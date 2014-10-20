var Writable = require('readable-stream').Writable;

require('util').inherits(DevNull, Writable);

function DevNull(opts) {
  if (!opts) {
    opts = {};
  }
  opts.objectMode = true;
  Writable.call(this, opts);
}

DevNull.prototype._write = function(chunk, enc, done) {
  done();
};

module.exports = DevNull;
