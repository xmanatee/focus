package love.nemi.focus

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.LinkProperties
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.os.SystemClock
import android.system.OsConstants
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.util.Calendar
import kotlin.concurrent.thread

class FocusDnsVpnService : VpnService() {
  private val usageTracker by lazy { AndroidUsageTracker(this) }
  private val connectivity by lazy {
    getSystemService(ConnectivityManager::class.java)
  }
  @Volatile
  private var upstream: UpstreamNetwork? = null
  private val availableNetworks = linkedMapOf<Network, InetAddress>()
  @Volatile
  private var tunnel: ParcelFileDescriptor? = null
  private var worker: Thread? = null

  private val stopReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      if (FocusBlockerStorage.hasWebsiteRules(context)) return
      stopTunnel()
      stopSelf()
    }
  }

  private val networkCallback = object : ConnectivityManager.NetworkCallback() {
    override fun onLinkPropertiesChanged(
      network: Network,
      linkProperties: LinkProperties,
    ) {
      val dnsServer = linkProperties.dnsServers.firstOrNull()
      if (dnsServer == null) availableNetworks.remove(network)
      else availableNetworks[network] = dnsServer
      updateUpstream()
    }

    override fun onLost(network: Network) {
      availableNetworks.remove(network)
      updateUpstream()
    }
  }

  override fun onCreate() {
    super.onCreate()
    ContextCompat.registerReceiver(
      this, stopReceiver, IntentFilter(ACTION_STOP), ContextCompat.RECEIVER_NOT_EXPORTED,
    )
    connectivity.registerNetworkCallback(
      NetworkRequest.Builder()
        .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        .addCapability(NetworkCapabilities.NET_CAPABILITY_NOT_VPN)
        .build(),
      networkCallback,
    )
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (!FocusBlockerStorage.hasWebsiteRules(this)) {
      stopTunnel()
      stopSelf()
      return START_NOT_STICKY
    }
    startForeground(NOTIFICATION_ID, foregroundNotification())
    if (worker == null) startTunnel()
    return START_STICKY
  }

  override fun onRevoke() {
    stopTunnel()
    stopSelf()
    super.onRevoke()
  }

  override fun onDestroy() {
    stopTunnel()
    unregisterReceiver(stopReceiver)
    connectivity.unregisterNetworkCallback(networkCallback)
    super.onDestroy()
  }

  private fun stopTunnel() {
    val previous = tunnel
    tunnel = null
    worker?.interrupt()
    worker = null
    previous?.close()
    stopForeground(STOP_FOREGROUND_REMOVE)
  }

  private fun startTunnel() {
    val builder = Builder()
      .setSession(getString(R.string.app_name))
      .setBlocking(true)
      .setMtu(MAX_PACKET_SIZE)
      .addAddress(TUNNEL_ADDRESS, 32)
      .addDnsServer(TUNNEL_DNS_ADDRESS)
      .addRoute(TUNNEL_DNS_ADDRESS, 32)
      .allowFamily(OsConstants.AF_INET6)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) builder.setMetered(false)
    val established = builder.establish()
    if (established == null) {
      Log.e(LOG_TAG, "Android did not establish the Focus Blocks DNS tunnel.")
      stopSelf()
      return
    }
    tunnel = established
    worker = thread(name = "FocusDnsVpn", start = true) {
      try {
        processPackets(established)
      } catch (error: IOException) {
        if (tunnel != null) Log.e(LOG_TAG, "DNS tunnel stopped unexpectedly.", error)
      } finally {
        stopSelf()
      }
    }
  }

  private fun processPackets(descriptor: ParcelFileDescriptor) {
    val input = FileInputStream(descriptor.fileDescriptor)
    val output = FileOutputStream(descriptor.fileDescriptor)
    val buffer = ByteArray(MAX_PACKET_SIZE)
    val policy = DomainPolicyCache(POLICY_REFRESH_MILLIS)
    while (!Thread.currentThread().isInterrupted) {
      val packetSize = input.read(buffer)
      if (packetSize < 0) return
      val request = parseIpv4UdpPacket(buffer.copyOf(packetSize)) ?: continue
      if (request.destinationPort != DNS_PORT) continue
      val queryName = parseDnsQuestionName(request.payload) ?: continue
      val domains = policy.domainsAt(SystemClock.elapsedRealtime()) {
        FocusBlockerStorage.blockedDomainsAt(this, Calendar.getInstance(), usageTracker)
      }
      val dnsResponse = if (isDomainBlocked(queryName, domains)) {
        buildDnsErrorResponse(request.payload, DNS_RCODE_NAME_ERROR)
      } else {
        forwardDnsQuery(request.payload)
          ?: buildDnsErrorResponse(request.payload, DNS_RCODE_SERVER_FAILURE)
      }
      output.write(buildIpv4UdpResponse(request, dnsResponse))
    }
  }

  private fun updateUpstream() {
    val preferred = connectivity.activeNetwork
    val selected = availableNetworks.entries.firstOrNull { it.key == preferred }
      ?: availableNetworks.entries.lastOrNull()
    upstream = selected?.let { UpstreamNetwork(it.key, it.value) }
  }

  private fun forwardDnsQuery(query: ByteArray): ByteArray? {
    val target = upstream ?: return null

    return try {
      DatagramSocket().use { socket ->
        if (!protect(socket)) {
          Log.e(LOG_TAG, "Android could not protect the upstream DNS socket.")
          return@use null
        }
        target.network.bindSocket(socket)
        socket.connect(target.dnsServer, DNS_PORT)
        socket.soTimeout = DNS_TIMEOUT_MILLIS
        socket.send(DatagramPacket(query, query.size, target.dnsServer, DNS_PORT))
        val response = DatagramPacket(ByteArray(MAX_DNS_PACKET_SIZE), MAX_DNS_PACKET_SIZE)
        socket.receive(response)
        response.data.copyOf(response.length)
      }
    } catch (error: IOException) {
      Log.w(LOG_TAG, "The upstream DNS request failed.", error)
      null
    }
  }

  private fun foregroundNotification(): android.app.Notification {
    ensureDnsNotificationChannel()
    val openApp = PendingIntent.getActivity(
      this,
      0,
      packageManager.getLaunchIntentForPackage(packageName),
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )
    return NotificationCompat.Builder(this, DNS_NOTIFICATION_CHANNEL_ID)
      .setSmallIcon(R.drawable.notification_icon)
      .setContentTitle(getString(R.string.dns_notification_title))
      .setContentText(getString(R.string.dns_notification_message))
      .setContentIntent(openApp)
      .setOngoing(true)
      .setSilent(true)
      .build()
  }

  private data class UpstreamNetwork(
    val network: Network,
    val dnsServer: InetAddress,
  )

  companion object {
    internal const val ACTION_STOP = "love.nemi.focus.STOP_DNS_VPN"
    private const val LOG_TAG = "FocusDnsVpn"
    private const val TUNNEL_ADDRESS = "10.23.0.1"
    private const val TUNNEL_DNS_ADDRESS = "10.23.0.2"
    private const val DNS_PORT = 53
    private const val MAX_PACKET_SIZE = 16_384
    private const val MAX_DNS_PACKET_SIZE = 4_096
    private const val DNS_TIMEOUT_MILLIS = 3_000
    private const val POLICY_REFRESH_MILLIS = 5_000L
    private const val NOTIFICATION_ID = 6_200
    private const val DNS_RCODE_SERVER_FAILURE = 2
  }
}

internal object FocusVpnController {
  fun reconcile(context: Context) {
    val intent = Intent(context, FocusDnsVpnService::class.java)
    if (FocusBlockerStorage.hasWebsiteRules(context)) {
      ContextCompat.startForegroundService(context, intent)
    } else {
      context.sendBroadcast(
        Intent(FocusDnsVpnService.ACTION_STOP).setPackage(context.packageName),
      )
    }
  }
}
