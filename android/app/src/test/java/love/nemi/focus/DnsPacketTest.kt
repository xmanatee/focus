package love.nemi.focus

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class DnsPacketTest {
  @Test
  fun readsTheCanonicalQuestionName() {
    assertEquals("m.youtube.com", parseDnsQuestionName(query("m.youtube.com")))
  }

  @Test
  fun rejectsCompressedOrTruncatedQuestionNames() {
    val compressed = query("youtube.com").also { it[12] = 0xc0.toByte() }

    assertNull(parseDnsQuestionName(compressed))
    assertNull(parseDnsQuestionName(byteArrayOf(0, 1, 2)))
  }

  @Test
  fun buildsAnNxDomainResponseWithoutChangingTheQuestion() {
    val query = query("youtube.com")
    val response = buildDnsErrorResponse(query, DNS_RCODE_NAME_ERROR)

    assertEquals(query[0], response[0])
    assertEquals(query[1], response[1])
    assertEquals(0x81.toByte(), response[2])
    assertEquals(0x83.toByte(), response[3])
    assertArrayEquals(query.copyOfRange(12, query.size), response.copyOfRange(12, response.size))
  }

  private fun query(domain: String): ByteArray {
    val labels = domain.split('.')
    val questionSize = labels.sumOf { it.length + 1 } + 1 + 4
    val packet = ByteArray(12 + questionSize)
    packet[0] = 0x12
    packet[1] = 0x34
    packet[2] = 0x01
    packet[5] = 0x01
    var offset = 12
    for (label in labels) {
      packet[offset++] = label.length.toByte()
      for (character in label) packet[offset++] = character.code.toByte()
    }
    packet[offset++] = 0
    packet[offset + 1] = 0x01
    packet[offset + 3] = 0x01
    return packet
  }
}
