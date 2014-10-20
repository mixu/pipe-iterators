var Writable = require('readable-stream').Writable;

require('util').inherits(ToArr, Writable);

function ToArr(opts) {
  if (!opts) {
    opts = {};
  }
  Writable.call(this, opts);
  var self = this;
  this._bufferArr = [];
  if (opts.fn) {
    this._fn = opts.fn;
    this.once('finish', function() {
      self._fn(self._bufferArr);
      self._bufferArr = [];
    });
  }
}

ToArr.prototype._write = function(chunk, enc, done) {
  this._bufferArr.push(chunk);
  done();
};

module.exports = ToArr;
