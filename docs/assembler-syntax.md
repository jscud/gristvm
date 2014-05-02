# Assembler Syntax

The assembly language for Grist VM consists of the following.

## Literals

Byte sequences can be expressed in a few ways. The most basic is a series of hexadecimal characters to express a sequence of bytes. A hexidecimal literal begins with the character x followed by 0-9, A-F, or a-f. The first non hexidecimal character marks the end of the byte sequence.

A sequence of 4 bytes can be specified using the i marker. The i character is followed by - for negative numbers then 0-9. The first non digit character marks the end of the integer. The base 10 number following the i is converted to a sequence of four little endian bytes to express the integer's value. If the value following i cannot fit in a 32 bit integer, then the assembler will halt with an error message. 
