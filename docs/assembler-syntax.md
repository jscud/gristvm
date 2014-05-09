# Assembler Syntax

The assembly language for Grist VM consists of the following.

## Literals

A single byte is expressed by writing the unsigned value in base 10. For example the string 35 in the assembly code will be converted to a single byte with value 35.

Byte sequences can be expressed in a few ways. The most basic is a series of hexadecimal characters to express a sequence of bytes. A hexidecimal literal is preceeded by the string hex followed by whitespace then a sequence of 0-9, A-F, or a-f. The first non hexidecimal character marks the end of the byte sequence.

A sequence of 4 bytes can be specified using the int marker. The string int then whitespace is followed by - for negative numbers then 0-9. The first non digit character marks the end of the integer. The base 10 number following the int is converted to a sequence of four little endian bytes to express the integer's value. If the value following int cannot fit in a 32 bit integer, then the assembler will halt with an error message.
