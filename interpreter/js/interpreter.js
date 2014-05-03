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

gristVm.Interpreter = function(instructionBytes, opt_numRegisters) {
  this.instructions_ = instructionBytes;
  this.instructionIndex_ = 0;
  this.stackBase_ = 0;
  this.stackTop_ = 0;
  this.stack = [];
  this.heap = [];

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

gristVm.Interpreter.prototype.dump = function() {
  var state = {
    instructionIndex: this.instructionIndex_,
    stackBase: this.stackBase_,
    stackTop: this.stackTop_,
  };
  for (var i = 0; i < this.numRegisters_; i++) {
    state['r' + i] = this.registers_[i];
  }
  return state;
};
