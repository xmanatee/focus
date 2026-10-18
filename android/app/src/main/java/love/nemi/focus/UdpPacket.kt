package love.nemi.focus

internal data class Ipv4UdpPacket(
  val sourceAddress: ByteArray,
  val destinationAddress: ByteArray,
  val sourcePort: Int,
  val destinationPort: Int,
  val payload: ByteArray,
)

internal fun parseIpv4UdpPacket(packet: ByteArray): Ipv4UdpPacket? {
  if (packet.size < IPV4_HEADER_SIZE + UDP_HEADER_SIZE) return null
  if ((packet[0].toInt() ushr 4) != IPV4_VERSION) return null
  val headerSize = (packet[0].toInt() and 0x0f) * 4
  if (headerSize < IPV4_HEADER_SIZE || packet.size < headerSize + UDP_HEADER_SIZE) {
    return null
  }
  val totalSize = readUnsignedShort(packet, 2)
  if (totalSize < headerSize + UDP_HEADER_SIZE || totalSize > packet.size) return null
  if (packet[9].toInt() and 0xff != UDP_PROTOCOL) return null
  if (readUnsignedShort(packet, 6) and IPV4_FRAGMENT_MASK != 0) return null

  val udpSize = readUnsignedShort(packet, headerSize + 4)
  if (udpSize < UDP_HEADER_SIZE || headerSize + udpSize > totalSize) return null
  return Ipv4UdpPacket(
    sourceAddress = packet.copyOfRange(12, 16),
    destinationAddress = packet.copyOfRange(16, 20),
    sourcePort = readUnsignedShort(packet, headerSize),
    destinationPort = readUnsignedShort(packet, headerSize + 2),
    payload = packet.copyOfRange(
      headerSize + UDP_HEADER_SIZE,
      headerSize + udpSize,
    ),
  )
}

internal fun buildIpv4UdpResponse(
  request: Ipv4UdpPacket,
  payload: ByteArray,
): ByteArray {
  val result = ByteArray(IPV4_HEADER_SIZE + UDP_HEADER_SIZE + payload.size)
  result[0] = 0x45
  writeUnsignedShort(result, 2, result.size)
  result[8] = DEFAULT_TIME_TO_LIVE
  result[9] = UDP_PROTOCOL.toByte()
  request.destinationAddress.copyInto(result, 12)
  request.sourceAddress.copyInto(result, 16)
  writeUnsignedShort(result, IPV4_HEADER_SIZE, request.destinationPort)
  writeUnsignedShort(result, IPV4_HEADER_SIZE + 2, request.sourcePort)
  writeUnsignedShort(result, IPV4_HEADER_SIZE + 4, UDP_HEADER_SIZE + payload.size)
  payload.copyInto(result, IPV4_HEADER_SIZE + UDP_HEADER_SIZE)
  writeUnsignedShort(result, 10, internetChecksum(result, IPV4_HEADER_SIZE))
  return result
}

internal fun writeUnsignedShort(bytes: ByteArray, offset: Int, value: Int) {
  require(value in 0..0xffff) { "Unsigned short value is invalid." }
  bytes[offset] = (value ushr 8).toByte()
  bytes[offset + 1] = value.toByte()
}

private const val IPV4_VERSION = 4
private const val IPV4_HEADER_SIZE = 20
private const val UDP_HEADER_SIZE = 8
private const val UDP_PROTOCOL = 17
private const val IPV4_FRAGMENT_MASK = 0x3fff
private const val DEFAULT_TIME_TO_LIVE: Byte = 64

private fun readUnsignedShort(bytes: ByteArray, offset: Int): Int =
  ((bytes[offset].toInt() and 0xff) shl 8) or
    (bytes[offset + 1].toInt() and 0xff)

private fun internetChecksum(bytes: ByteArray, length: Int): Int {
  var sum = 0L
  var offset = 0
  while (offset < length) {
    sum += readUnsignedShort(bytes, offset)
    sum = (sum and 0xffff) + (sum ushr 16)
    offset += 2
  }
  return sum.inv().toInt() and 0xffff
}
