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
