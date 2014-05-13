# Op Codes

The Grist VM supports the following op code instructions. Each instruction is a single byte instruction which may optionally be followed by parameters.

## Instructions

### 0 - NOOP

Tells the processor to move on to the next instruction.

### 1 - SETREG

Sets a register to a literal value. 

1 followed by two parameters
1. A byte numbering which register should be filled.
2. Literal value to place in that register. This can be a number or character. For a value that doesn't take the full four bytes, all unused bytes in the register will be set to 0.

### 2 - COPYREG

Sets a register to the same value as another register.

2 Followed by two parameters
1. A byte numbering the register to receive the copied value.
2. A byte for the register whose value should be copied.

### 3 - XOR

Performs xor on the destination register using the value in the source register.

3 followed by two parameters
1. A byte numbering the register to receive the xored value.
2. A byte for the register whose value should be xored with the first register.


