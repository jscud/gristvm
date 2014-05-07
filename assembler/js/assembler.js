/**
 * @fileoverview Assembler to produce byte code for the Grist Virtual Machine.
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
 * Error class to be thrown by the assembler when it must halt assembly.
 * @constructor
 */
gristVm.AssemblerError = function(message) {
  this.name = 'GristAssemblerError';
  this.message = message;
};

gristVm.AssemblerError.prototype = new Error();

/**
 * Assembler which can produce GristVM bytecode.
 * @constructor
 */
gristVm.Assembler = function() {
  this.labelLocations_ = {};
  this.codeBytes = [];
};

/**
 * Processes the provided chunk of code. Multiple calls may be made to this
 * method to link modules together. Labels are identified in the first pass,
 * then filled in during a second pass.
 */
gristVm.Assembler.prototype.loadCode = function(codeString) {
  // TODO
};

gristVm.Assembler.prototype.emitBytes = function() {
  // Return a copy so that the caller can't modify the bytes in the assembler.
  return this.codeBytes.slice(0);
};

/**
 * Splits the provided code into tokens.
 * @constructor
 */
gristVm.Tokenizer = function(codeString) {
  this.code_ = codeString;
  this.index_ = 0;
};

gristVm.Tokenizer.prototype.nextToken = function() {
  var tokenChars = [];
  var current;
  /* States: 0 - start
   *         1 - integer start (can have a - for a negative)
   *         2 - integer
   *         3 - hex string
   *         4 - identifier/command
   *         5 - label
   */
  var state = 0;
  while (this.index_ < this.code_.length) {
    current = this.code_.charAt(this.index_);
    if (state == 0) {
      if (/\s/.test(current)) {
        this.index_++;
      } else if (current == 'i') {
        state = 1;
        tokenChars.push(current);
        this.index_++;
      } else if (current == 'b') {
        state = 2;
        tokenChars.push(current);
        this.index_++;
      } else if (current == 'x') {
        state = 3;
        tokenChars.push(current);
        this.index_++;
      }
    } else if (state == 1 || state == 2) {
      if (/\d/.test(current) || (state == 1 && current == '-')) {
        state = 2;
        this.index_++;
        tokenChars.push(current);
      } else {
        state = 0;
        return tokenChars.join('');
      }
    } else if (state == 3) {
      if (/[\dA-Fa-f]/.test(current)) {
        this.index_++;
        tokenChars.push(current);
      } else {
        state = 0;
        return tokenChars.join('');
      }
    }
  }
  return tokenChars.join('');
};
