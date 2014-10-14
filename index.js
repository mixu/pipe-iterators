var through = require('through2'),
    cloneLib = require('clone'),
    Readable = require('readable-stream').Readable;

function forEach(fn) {
  return through.obj(function(obj, enc, onDone) {
    fn(obj);
    this.push(obj);
    onDone();
  });
}

function map(fn) {
  return through.obj(function(obj, enc, onDone) {
    this.push(fn(obj));
    onDone();
  });
}

function filter(fn) {
  return through.obj(function(obj, enc, onDone) {
    if (fn(obj)) {
      this.push(obj);
    }
    onDone();
  });
}

function mapKey(first, fn) {
  if (typeof first === 'string' && typeof fn === 'function') {
    return through.obj(function(obj, enc, onDone) {
      obj[first] = fn(obj[first], obj);
      this.push(obj);
      onDone();
    });
  } else if (typeof first === 'object' && first !== null) {
    return through.obj(function(obj, enc, onDone) {
      Object.keys(first).forEach(function(key) {
        fn = first[key];
        if (typeof fn === 'function') {
          obj[key] = fn(obj[key], obj);
        } else {
          obj[key] = fn;
        }
      });
      this.push(obj);
      onDone();
    });
  }
}

function reduce(fn, initial) {
  var acc = initial;
  return through.obj(function(obj, enc, onDone) {
    acc = fn(acc, obj);
    onDone();
  }, function(onDone) {
    this.push(acc);
    onDone();
  });
}

function clone() {
  return map(cloneLib);
}

function fork() {
  var args = (Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.call(arguments)),
      result = through.obj();
  args.forEach(function(target) {
    // to avoid forked streams from interfering with each other, we will have to create a
    // fresh clone for each fork
    result.pipe(clone()).pipe(target);
  });
  return result;
}

function pipeFirst() {
  var args = (Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.call(arguments)),
      first = args.shift();
  args.reduce(function(prev, curr) {
    return prev.pipe(curr);
  }, first);
  return first;
}

// Readable stream wrapper
require('util').inherits(ArrWrapper, Readable);

function ArrWrapper(opts) {
  this._arr = opts.arr;
  Readable.call(this, opts);
}

ArrWrapper.prototype._read = function() {
  var item;
  if (this._arr.length > 0) {
    while (item = this._arr.shift()) {
      this.push(item);
    }
    // pushing null signals EOF
    this.push(null);
  }
};

function fromArray(arr) {
  return new ArrWrapper({ objectMode: true, arr: arr });
}

function toArray(fn) {
  var result;

  // FIXME: make this a writable, not a duplex stream!

  return reduce(function(prev, current) { return prev.concat(current); }, [])
    .once('data', function(r) { result = r; })
    .once('end', function(err) { fn(err, result); });
}


var Writable = require('readable-stream').Writable;

require('util').inherits(DevNull, Writable);

function DevNull(opts) {
  if (!opts) {
    opts = {};
  }
  opts.objectMode = true;
  Writable.call(this, opts);
}

DevNull.prototype._write = function(chunk, enc, onDone) {
  onDone();
};

function devnull() {
  return new DevNull();
}

module.exports = {
  forEach: forEach,
  map: map,
  filter: filter,
  mapKey: mapKey,
  reduce: reduce,
  fromArray: fromArray,
  toArray: toArray,
  clone: clone,
  fork: fork,
  pipeFirst: pipeFirst,
  devnull: devnull,
  through: through
};
