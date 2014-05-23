/**
 * @fileoverview Interpreter for the Grist Virtual Machine.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var gristVm = gristVm || {};

/**
 * Error class to be thrown by the interpreter in case of a program error.
 * @constructor
 */
gristVm.InterpreterError = function(message) {
  this.name = 'GristInterpreterError';
  this.message = message;
};

gristVm.InterpreterError.prototype = new Error();


/**
 * Interpreter for GristVM bytecode.
 * @constructor
 */
gristVm.Interpreter = function(instructionBytes, opt_numRegisters,
                               opt_stackSize, opt_instructionOffset) {
  /* The interpreter includes its own virtual memory simulation with the
   * following layout.
   * High addresses       ---------------------| 2147483647
   *                      | stack start        |
   *                      | more stack         |
   *                      | ...                |
   *                      |                    |
   *                      | ...                |
   *                      | more heap          |
   *                      | start of heap      |
   *                      |                    |
   *                      | ...                |
   *                      | later instructions |
   *                      | instructions start |
   * Low addresses        ---------------------- 0
   */
  this.virtualMemory_ = {};
  var instructionOffset = opt_instructionOffset || 0;
  if (instructionOffset < 0) {
    instructionOffset = 0;
  }
  this.instructionsStart_ = 1024 + instructionOffset;
  var instructions = instructionBytes || [];
  for (var i = 0; i < instructions.length; i++) {
    this.virtualMemory_[this.instructionsStart_ + i] = instructions[i];
  }
  this.instructionIndex_ = this.instructionsStart_;
  this.instructionsLength_ = instructions.length;
  this.heapStart_ = this.instructionsStart_ + this.instructionsLength_ + 100 +
      Math.floor(Math.random() * 1000);
  this.stackStart_ = 2147482623 - Math.floor(Math.random() * 1000);
  this.stackSize_ = opt_stackSize || 1048576; // 1MB stack by default.
  // TODO: Have the stack start at a random high address to discourage hard
  // coded stack reference addresses.
  // The stack starts at a high address so that it can grow downward.
  this.stackBase_ = this.stackStart_;
  this.stackTop_ = this.stackBase_;

  // Set up the registers.
  this.registers_ = [];
  this.numRegisters_ = opt_numRegisters || 8;
  if (opt_numRegisters <= 0) {
    this.numRegisters_ = 0;
  }
  if (opt_numRegisters > 256) {
    this.numRegisters_ = 256;
  } 
  for (var i = 0; i < this.numRegisters_; i++) {
    this.registers_.push(0);
  }

  // TODO: add flags for overflow/underflow and zero, possible negative and
  // others.
};

/**
 * Provides a snapshot of the state of the virtual processor's registers.
 */
gristVm.Interpreter.prototype.dump = function() {
  var state = {
    instructionIndex: this.instructionIndex_,
    stackBase: this.stackBase_,
    stackTop: this.stackTop_,
    stackSample: {}
  };
  var i;
  for (i = 0; i < this.numRegisters_; i++) {
    state['r' + i] = this.registers_[i];
  }
  for (i = 8; i > -12; i--) {
    var address = this.stackTop_ + i;
    if (address > this.stackStart_ - this.stackSize_ && address <= this.stackStart_ && this.virtualMemory_.hasOwnProperty(address)) {
      state.stackSample['stack top + ' + i] = this.virtualMemory_[address];
    } 
  }
  return state;
};

gristVm.Interpreter.prototype.consumeByte_ = function() {
  if (this.instructionIndex_ >= this.instructionsStart_ &&
      this.instructionIndex_ <
      this.instructionsLength_ + this.instructionsStart_) {
    var byteVal = this.virtualMemory_[this.instructionIndex_];
    if (byteVal < 0 || byteVal > 255) {
      return null;
    }
    this.instructionIndex_++;
    return byteVal;
  } else {
    return null;
  }
};

gristVm.Interpreter.prototype.consumeInt_ = function() {
  var intVal = 0;
  var b;
  for (var i = 0; i < 4; i++) {
    b = this.consumeByte_();
    if (b == null) {
      return null;
    }
    intVal += b << (i * 8);
  }
  return intVal;
};

/**
 * Executes the next instruction and advances to the next instruction.
 * @return {boolean} true if execution should continue.
 */
gristVm.Interpreter.prototype.step = function() {
  var instructionByte = this.consumeByte_();
  switch (instructionByte) {
    case 0:
      break;
    case 1:
      this.setReg();
      break;
    case 2:
      this.copyReg();
      break;
    case 3:
      this.xor();
      break;
    case 8:
      this.push();
      break;
    default: // if null, we've run out of bytes and should not continue.
      return false;
  }
  return true;
};

gristVm.Interpreter.prototype.setReg = function() {
  var regNumber = this.consumeByte_();
  var value = this.consumeInt_();
  if (regNumber == null || value == null) {
    throw new gristVm.InterpreterError(
        'Unexpected inputs when setting register. Tried to set register ' +
        regNumber + ' to value ' + value + '.');
  } else if (regNumber > this.numRegisters_) {
    throw new gristVm.InterpreterError(
        'Tried to set register that does not exist. Requested register ' +
        regNumber + ' but this VM only has ' + this.numReggisters_ +
        ' registers.');
  }
  this.registers_[regNumber] = value;
};

gristVm.Interpreter.prototype.copyReg = function() {
  var destReg = this.consumeByte_();
  var sourceReg = this.consumeByte_();
  if (destReg == null || sourceReg == null) {
    throw new gristVm.InterpreterError(
        'Unexpected inputs when copying register. Tried to set register ' +
        destReg + ' to match register ' + sourceReg + '.');
  } else if (destReg > this.numRegisters_ || sourceReg > this.numRegisters_) {
    throw new gristVm.InterpreterError(
        'Tried to accessed register that does not exist. Requested registers ' +
        destReg + ' and ' + sourceReg + ' but this VM only has ' +
        this.numReggisters_ + ' registers.');
  }
  this.registers_[destReg] = this.registers_[sourceReg];
};

gristVm.Interpreter.prototype.xor = function() {
  var destReg = this.consumeByte_();
  var sourceReg = this.consumeByte_();
  if (destReg == null || sourceReg == null) {
    throw new gristVm.InterpreterError(
        'Unexpected inputs when xoring register. Tried to set register ' +
        destReg + ' to the xor of register ' + destReg + ' and register ' +
        sourceReg + '.');
  } else if (destReg > this.numRegisters_ || sourceReg > this.numRegisters_) {
    throw new gristVm.InterpreterError(
        'Tried to access register that does not exist. Requested registers ' +
        destReg + ' and ' + sourceReg + ' but this VM only has ' +
        this.numReggisters_ + ' registers.');
  }
  this.registers_[destReg] ^= this.registers_[sourceReg]; 
};

gristVm.Interpreter.prototype.setStackByte_ = function(address, value) {
  if (address > this.stackStart_ ||
      address < this.stackStart_ - this.stackSize_) {
    throw new gristVm.InterpreterError('Tried to store ' + value +
        ' at an address that is not part of the stack. Tried to set ' +
        address + ' but the stack is ' + this.stackStart_ + ' to ' +
        (this.stackStart_ - this.stackSize_) + '.');
  } else if (value < 0 || value > 255) {
    throw new gristVm.InterpreterError(
        'Invalid value for byte being written to the stack: ' + value +
        ' must be between 0 and 255.');
  }
  this.virtualMemory_[address] = value;
};

gristVm.Interpreter.prototype.push = function() {
  var sourceReg = this.consumeByte_();
   if (sourceReg == null) {
    throw new gristVm.InterpreterError(
        'Unexpected input when pushing register. Tried to push register ' +
        sourceReg + '.');
  } else if (sourceReg > this.numRegisters_) {
    throw new gristVm.InterpreterError(
        'Tried to access register that does not exist. Requested registers ' +
        sourceReg + ' but this VM only has ' + this.numReggisters_ +
        ' registers.');
  }
  var intValue = this.registers_[sourceReg];
  // TODO: the following code is very similar to the assembler's
  // intTokenToBytes. Consider splitting out a shared library.
  if (intValue < -2147483648 || intValue > 2147483647) {
    throw new gristVm.InterpreterError(
        'Register ' + sourceReg + '\'s value must be between -2147483648 ' +
        'and 2147483647 but was ' + intValue);
  }
  var isNegative = intValue < 0;
  if (isNegative) {
    intValue = (intValue * -1) - 1;
  }
  for (var i = 0; i < 4; i++) {
    if (isNegative) {
      this.setStackByte_(this.stackTop_, 255 - (intValue % 256));
    } else {
      this.setStackByte_(this.stackTop_, intValue % 256);
    }
    this.stackTop_--;
    intValue = intValue >> 8;
  }
};

gristVm.Interpreter.prototype.run = function() {

};
