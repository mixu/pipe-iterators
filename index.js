var through = require('through2'),
    cloneLib = require('clone');

var duplex = require('./lib/duplex.js'),
    Match = require('./lib/match.js');

// Iteration functions

exports.forEach = function(fn, thisArg) {
  var index = 0;
  thisArg = (typeof thisArg !== 'undefined' ? thisArg : null);
  return through.obj(function(obj, enc, onDone) {
    fn.call(thisArg, obj, index++);
    this.push(obj);
    onDone();
  });
};

exports.map = function(fn, thisArg) {
  var index = 0;
  thisArg = (typeof thisArg !== 'undefined' ? thisArg : null);
  return through.obj(function(obj, enc, onDone) {
    this.push(fn.call(thisArg, obj, index++));
    onDone();
  });
};

exports.reduce = function(fn, initial) {
  var index = 0,
      captureFirst = (arguments.length < 2),
      acc = (!captureFirst ? initial : null);
  return through.obj(function(obj, enc, onDone) {
    if (captureFirst) {
      acc = obj;
      captureFirst = false;
      index++;
    } else {
      acc = fn(acc, obj, index++);
    }
    onDone();
  }, function(onDone) {
    this.push(acc);
    onDone();
  });
};

exports.filter = function(fn, thisArg) {
  var index = 0;
  thisArg = (typeof thisArg !== 'undefined' ? thisArg : null);
  return through.obj(function(obj, enc, onDone) {
    if (fn.call(thisArg, obj, index++)) { this.push(obj); }
    onDone();
  });
};

exports.mapKey = function(first, fn, thisArg) {
  var index = 0;
  if (typeof first === 'string' && typeof fn === 'function') {
    thisArg = (typeof thisArg !== 'undefined' ? thisArg : null);
    return through.obj(function(obj, enc, onDone) {
      obj[first] = fn.call(thisArg, obj[first], obj, index++);
      this.push(obj);
      onDone();
    });
  } else if (typeof first === 'object' && first !== null) {
    thisArg = (typeof fn !== 'undefined' ? fn : null);
    return through.obj(function(obj, enc, onDone) {
      Object.keys(first).forEach(function(key) {
        fn = first[key];
        if (typeof fn === 'function') {
          obj[key] = fn.call(thisArg, obj[key], obj, index++);
        } else {
          obj[key] = fn;
        }
      });
      this.push(obj);
      onDone();
    });
  } else {
    throw new Error('mapKey must be called with: (key, fn) or (hash).');
  }
};

// Input and output

exports.fromArray = function(arr) {
  var eof = false;
  arr = (Array.isArray(arr) ? arr : Array.prototype.slice.call(arguments));

  var stream = exports.readable.obj(function() {
    var item;
    if (arr.length > 0) {
      do {
        item = arr.shift();
      } while(typeof item !== 'undefined' && this.push(item))
    }
    if (arr.length === 0 && !eof) {
      // pushing null signals EOF
      eof = true;
      this.push(null);
    }
  });

  return stream;
};

exports.toArray = function(fn) {
  var endFn = typeof fn === 'function' ? fn : null,
      arr = (Array.isArray(fn) ? fn : []),
      stream = exports.writable.obj(function(chunk, enc, done) {
        arr.push(chunk);
        done();
      });

  if (endFn) {
    stream.once('finish', function() {
      endFn(arr);
      arr = [];
    });
  }
  return stream;
};

// Constructing streams

exports.thru = exports.through = through;
exports.writable = require('./lib/writable.js');
exports.readable = require('./lib/readable.js');
exports.duplex = duplex;

exports.devnull = function(endFn) {
  var result = exports.writable({ objectMode: true });
  if (endFn) {
    result.once('finish', endFn);
  }
  return result;
};

exports.clone = function() {
  return exports.map(cloneLib);
}

// Control flow

exports.fork = function() {
  var args = (Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.call(arguments)),
      result = through.obj();
  args.forEach(function(target) {
    // to avoid forked streams from interfering with each other, we will have to create a
    // fresh clone for each fork
    result.pipe(exports.clone()).pipe(target);
  });
  return result;
};

function trueFn() { return true; }

exports.match = function() {
  var args = (Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.call(arguments)),
      conditions = [],
      streams = [],
      i = 0;

  while (i < args.length) {
    if (typeof args[i] === 'function' && typeof args[i + 1] === 'object') {
      conditions.push(args[i]);
      streams.push(args[i + 1]);
      i += 2;
    } else { break; }
  }
  // the rest-stream is implemented as an appended stream with a condition that's always true
  for (;i < args.length; i++) {
    conditions.push(trueFn);
    streams.push(args[i]);
  }

  return new Match({
    objectMode: true,
    conditions: conditions,
    streams: streams
  });
};

// Constructing pipelines from individual elements

exports.pipe = function() {
  var args = (Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.call(arguments));
  args.reduce(function(prev, curr) { return prev.pipe(curr); });
  return args;
}

exports.head = function() {
  var args = (Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.call(arguments));
  return exports.pipe(args)[0];
};

exports.tail = function() {
  var args = (Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.call(arguments));
  return exports.pipe(args).pop();
};

exports.pipeline = function() {

  // iterate and construct duplex pipelines from arrays (deep)

  // finally construct the top level duplex stream


  var streams = exports.pipe(Array.prototype.slice.call(arguments));
  return duplex(streams[0], streams[streams.length - 1]);
};
