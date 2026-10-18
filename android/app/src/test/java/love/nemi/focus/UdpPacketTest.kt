package love.nemi.focus

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class UdpPacketTest {
  @Test
  fun parsesAnIpv4DnsDatagram() {
    val payload = byteArrayOf(1, 2, 3)
    val packet = ipv4UdpPacket(53000, 53, payload)

    val parsed = requireNotNull(parseIpv4UdpPacket(packet))

    assertEquals(53000, parsed.sourcePort)
    assertEquals(53, parsed.destinationPort)
    assertArrayEquals(payload, parsed.payload)
  }

  @Test
  fun rejectsFragmentsAndInvalidLengths() {
    val fragmented = ipv4UdpPacket(53000, 53, byteArrayOf(1)).also {
      it[6] = 0x20
    }

    assertNull(parseIpv4UdpPacket(fragmented))
    assertNull(parseIpv4UdpPacket(byteArrayOf(0x45, 0, 0)))
  }

  @Test
  fun buildsAResponseWithReversedEndpoints() {
    val request = requireNotNull(
      parseIpv4UdpPacket(ipv4UdpPacket(53000, 53, byteArrayOf(1))),
    )

    val response = requireNotNull(
      parseIpv4UdpPacket(buildIpv4UdpResponse(request, byteArrayOf(9, 8))),
    )

    assertEquals(53, response.sourcePort)
    assertEquals(53000, response.destinationPort)
    assertArrayEquals(request.sourceAddress, response.destinationAddress)
    assertArrayEquals(request.destinationAddress, response.sourceAddress)
    assertArrayEquals(byteArrayOf(9, 8), response.payload)
  }

  private fun ipv4UdpPacket(
    sourcePort: Int,
    destinationPort: Int,
    payload: ByteArray,
  ): ByteArray {
    val result = ByteArray(28 + payload.size)
    result[0] = 0x45
    writeUnsignedShort(result, 2, result.size)
    result[8] = 64
    result[9] = 17
    result[12] = 10
    result[15] = 1
    result[16] = 10
    result[19] = 2
    writeUnsignedShort(result, 20, sourcePort)
    writeUnsignedShort(result, 22, destinationPort)
    writeUnsignedShort(result, 24, 8 + payload.size)
    payload.copyInto(result, 28)
    return result
  }
}
