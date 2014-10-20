var Readable = require('readable-stream').Readable;

require('util').inherits(FromArr, Readable);

function FromArr(opts) {
  this._arr = opts.arr;
  Readable.call(this, opts);
}

FromArr.prototype._read = function() {
  var item;
  if (this._arr.length > 0) {
    while (item = this._arr.shift()) {
      this.push(item);
    }
    // pushing null signals EOF
    this.push(null);
  }
};

module.exports = FromArr;
