# Op Codes

The Grist VM supports the following op code instructions. Each instruction is a single byte instruction which may optionally be followed by parameters.

## Instructions

### NOOP

Tells the processor to move on to the next instruction.

0 

### SETREG

Sets a register to a literal value. 

1 followed by two parameters
1. A byte numbering which register should be filled.
2. Literal value to place in that register. This can be a number or character. For a value that doesn't take the full four bytes, all unused bytes in the register will be set to 0.
