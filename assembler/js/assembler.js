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
  this.codeBytes_ = [];
};

/**
 * Processes the provided chunk of code. Multiple calls may be made to this
 * method to link modules together. Labels are identified in the first pass,
 * then filled in during a second pass.
 */
gristVm.Assembler.prototype.loadCode = function(codeString) {
  var tokenizer = new gristVm.Tokenizer(codeString);
  var token = tokenizer.nextToken();
  /* States: 0 - start
   *         1 - defining a label
   *         2 - writing an integer literal
   *         3 - writing a hexidemial sequence of bytes
   */
  var state = 0;
  while (token != '') {
    if (state == 0) {
      if (token == 'label') {
        state = 1;
        token = tokenizer.nextIdentifier();
      } else if (token == 'int') {
        state = 2;
        token = tokenizer.nextInt();
      } else if (token == 'hex') {
        state = 3;
        token = tokenizer.nextHexSequence();
      } else if (/^\d+$/.test(token)) {
        this.codeBytes_.push(gristVm.Assembler.bytesTokenToBytes(token));
        token = tokenizer.nextToken();
      } else if (/^[A-Za-z_\.][A-Za-z_\.0-9]*$/.test(token)) {
        this.codeBytes_.push(gristVm.Assembler.commandToBytes(token));
        token = tokenizer.nextToken();
      } else {
        throw new gristVm.AssemblerError('Unexpected input: ' + token);
      }
    } else if (state == 1) {
      this.labelLocations_[token] = this.codeBytes.length;
      state = 0;
      token = tokenizer.nextToken();
    } else if (state == 2) {
      this.codeBytes_ = this.codeBytes_.concat(
          gristVm.Assembler.intTokenToBytes(token));
      state = 0;
      token = tokenizer.nextToken();
    } else if (state == 3) {
      this.codeBytes_ = this.codeBytes_.concat(
          gristVm.Assembler.hexTokenToBytes(token));
      state = 0;
      token = tokenizer.nextToken();
    }
  }
};

gristVm.Assembler.prototype.emitBytes = function() {
  // TODO: Fill in the labels locations now that all code has been loaded.
  return this.codeBytes_.slice(0);
};

gristVm.Assembler.bytesTokenToBytes = function(token) {
  var byteValue = parseInt(token, 10);
  if (byteValue < 0 || byteValue > 255) {
    throw new gristVm.AssemblerError(
        'Byte must be between 0 and 255 but was ' + token);
  }
  return byteValue;
};

gristVm.Assembler.intTokenToBytes = function(token) {
  var intValue = parseInt(token, 10);
  if (intValue < -2147483648 || intValue > 2147483647) {
    throw new gristVm.AssemblerError(
        'Integer must be between -2147483648 and 2147483647 but was ' + token);
  }
  var bytes = [];
  var isNegative = intValue < 0;
  if (isNegative) {
    intValue = (intValue * -1) - 1;
  }
  for (var i = 0; i < 4; i++) {
    if (isNegative) {
      bytes.push(255 - (intValue % 256));
    } else {
      bytes.push(intValue % 256);
    }
    intValue = intValue >> 8;
  }
  return bytes;
};

gristVm.Assembler.hexTokenToBytes = function(token) {
  if (token.length % 2 != 0) {
    throw new gristVm.AssemblerError(
        'Sequence of hexidecimal bytes must have an even number of ' +
        'characters. Sequence length: ' + token.length);
  }
  var charPair;
  var bytes = [];
  for (var i = 0; i < token.length; i += 2) {
    charPair = token.charAt(i) + token.charAt(i + 1);
    bytes.push(parseInt(charPair, 16));
  }
  return bytes;
};

gristVm.Assembler.commandToBytes = function(token) {
  var command = token.toLowerCase();
  switch (command) {
    case 'noop':
      return 0;
    case 'setreg':
      return 1;
    default:
      throw new gristVm.AssemblerError('Unrecognized command: ' + token);
  }
};

/**
 * Splits the provided code into tokens.
 * @constructor
 */
gristVm.Tokenizer = function(codeString) {
  this.code_ = codeString;
  this.index_ = 0;
};

gristVm.Tokenizer.prototype.skipWhitespaceAndComments_ = function() {
  var current;
  /* States: 0 - start
   *         1 - possible start of comment
   *         2 - comment
   */
  var state = 0;
  while (this.index_ < this.code_.length) {
    current = this.code_.charAt(this.index_);
    if (state == 0) {
      if (/\s/.test(current)) {
        this.index_++;
      } else if (current == '#') {
        state = 2;
        this.index_++;
      } else if (current == '/') {
        state = 1;
        this.index_++;
      } else {
        return;
      }
    } else if (state == 1) {
      if (current == '/') {
        state = 2;
        this.index_++;
      } else {
        this.index_--;
        return;
      }
    } else if (state == 2) {
      this.index_++;
      if (current == '\n' || current == '\r') {
        state = 0;
      }
    }
  }
};

gristVm.Tokenizer.prototype.nextByte = function() {
  this.skipWhitespaceAndComments_();
  var current;
  var tokenChars = [];
  while (this.index_ < this.code_.length) {
    current = this.code_.charAt(this.index_);
    if (/\d/.test(current)) {
      tokenChars.push(current);
      this.index_++;
    } else {
      break;
    }
  }
  return tokenChars.join('');
};

gristVm.Tokenizer.prototype.nextInt = function() {
  this.skipWhitespaceAndComments_();
  if (this.index_ >= this.code_.length) {
    return '';
  }
  var current = this.code_.charAt(this.index_);
  var tokenChars = [];
  var isNegative = current == '-';
  if (isNegative) {
    this.index_++;
    if (this.index_ < this.code_.length) {
      current = this.code_.charAt(this.index_);
      if (/\d/.test(current)) {
        tokenChars.push('-');
        tokenChars.push(current);
        this.index_++;
      }
    }
  }
  while (this.index_ < this.code_.length) {
    current = this.code_.charAt(this.index_);
    if (/\d/.test(current)) {
      tokenChars.push(current);
      this.index_++;
    } else {
      break;
    }
  }
  return tokenChars.join('');
};

gristVm.Tokenizer.prototype.nextHexSequence = function() {
  this.skipWhitespaceAndComments_();
  var current;
  var tokenChars = [];
  while (this.index_ < this.code_.length) {
    current = this.code_.charAt(this.index_);
    if (/[0-9A-Fa-f]/.test(current)) {
      tokenChars.push(current);
      this.index_++;
    } else {
      break;
    }
  }
  return tokenChars.join('');
};

gristVm.Tokenizer.prototype.nextIdentifier = function() {
  this.skipWhitespaceAndComments_();
  var current;
  var tokenChars = [];
  // Check first character which must not be a digit.
  if (this.index_ < this.code_.length) {
    current = this.code_.charAt(this.index_);
    if (/[A-Za-z_\.]/.test(current)) {
      tokenChars.push(current);
      this.index_++;
    } else {
      return '';
    }
  }
  // Check following characters which may be digits.
  while (this.index_ < this.code_.length) {
    current = this.code_.charAt(this.index_);
    if (/[A-Za-z_\.0-9]/.test(current)) {
      tokenChars.push(current);
      this.index_++;
    } else {
      break;
    }

  }
  return tokenChars.join('');
};

/**
 * Retrieves the next token from the assembly source code. Top level tokens
 * can be identifiers or bytes. Other tokens like ints and hex sequences must
 * follow an identifier (int/hex for example).
 */
gristVm.Tokenizer.prototype.nextToken = function() {
  var token = this.nextByte();
  if (token) {
    return token;
  }
    
  token = this.nextIdentifier();
  if (token) {
    return token;
  }

  // If neither a byte literal not identifier, return the current character.
  if (this.index_ < this.code_.length) {
    this.index_++;
    return this.code_.charAt(this.index_ - 1);
  }

  return '';
};
