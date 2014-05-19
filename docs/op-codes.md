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

### 4 - ADD

### 5 - SUB

### 6 - MUL

### 7 - DIV

### 8 - PUSH

8 followed by one parameter
1. the register whose integer (4 byte) value should be written to the top of the stack. The top of the stack is automatically advanced.

### 9 - PUSHB

8 followed by one parameter
1. the register from which the lowest order byte should be written to the top of the stack. The top of the stack is automatically advanced.

### 10 - PUSHF

8 followed by one parameter
1. the register from which a double precision floating point (8 byte) value should be written to the top of the stack. The top of the stack is automatically advanced.
