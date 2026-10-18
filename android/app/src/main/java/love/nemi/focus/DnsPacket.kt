package love.nemi.focus

import java.nio.charset.StandardCharsets

internal const val DNS_RCODE_NAME_ERROR = 3

internal fun parseDnsQuestionName(packet: ByteArray): String? {
  if (packet.size < DNS_HEADER_SIZE || unsignedShort(packet, 4) != 1) return null

  val labels = mutableListOf<String>()
  var offset = DNS_HEADER_SIZE
  while (offset < packet.size) {
    val length = packet[offset].toInt() and 0xff
    offset += 1
    if (length == 0) break
    if (length > DNS_MAX_LABEL_LENGTH || offset + length > packet.size) return null
    val label = String(packet, offset, length, StandardCharsets.US_ASCII)
    if (!isDnsLabel(label)) return null
    labels += label.lowercase()
    offset += length
  }

  if (labels.isEmpty() || offset + DNS_QUESTION_SUFFIX_SIZE > packet.size) return null
  return labels.joinToString(".")
}

internal fun buildDnsErrorResponse(query: ByteArray, responseCode: Int): ByteArray {
  require(responseCode in 0..15) { "DNS response code is invalid." }
  require(parseDnsQuestionName(query) != null) { "DNS query is invalid." }

  return query.copyOf().also { response ->
    val recursionDesired = response[2].toInt() and 0x01
    response[2] = (0x80 or recursionDesired).toByte()
    response[3] = (0x80 or responseCode).toByte()
    clearCount(response, 6)
    clearCount(response, 8)
    clearCount(response, 10)
  }
}

private const val DNS_HEADER_SIZE = 12
private const val DNS_MAX_LABEL_LENGTH = 63
private const val DNS_QUESTION_SUFFIX_SIZE = 4

private fun unsignedShort(bytes: ByteArray, offset: Int): Int =
  ((bytes[offset].toInt() and 0xff) shl 8) or
    (bytes[offset + 1].toInt() and 0xff)

private fun isDnsLabel(value: String): Boolean =
  value.isNotEmpty() &&
    value.first() != '-' &&
    value.last() != '-' &&
    value.all { it.isLetterOrDigit() || it == '-' }

private fun clearCount(packet: ByteArray, offset: Int) {
  packet[offset] = 0
  packet[offset + 1] = 0
}
