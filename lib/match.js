var Writable = require('readable-stream').Writable;

require('util').inherits(Match, Writable);

function Match(opts) {
  if (!opts) { opts = {}; }
  opts.objectMode = true;
  Writable.call(this, opts);

  var self = this;
  this._conditions = opts.conditions;
  this._writables = opts.streams;
  this._rest = opts.rest;
  this._ok = this._writables.map(function() { return true; });


  this._writables.forEach(function(stream, i) {
    stream.on('drain', function() {
      self._ok[i] = true;
    });
  });

  this.once('finish', function() {
    self._writables.forEach(function(stream) {
      stream.end();
    });
  });
}

Match.prototype._write = function(chunk, enc, done) {
  var i, stream,
      self = this;
  for (i = 0; i < this._conditions.length; i++) {
    if (this._conditions[i](chunk)) {
      stream = this._writables[i];
      break;
    }
  }
  // no match -> call done
  if (!stream) {
    return done();
  }

  function write() {
    if (!self._ok[i]) {
      stream.once('drain', write);
    } else {
      self._ok[i] = stream.write(chunk);
      done();
    }
  }

  write();
};

module.exports = Match;
