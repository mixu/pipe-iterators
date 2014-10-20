var through = require('through2'),
    cloneLib = require('clone');

var DevNull = require('./lib/dev-null.js'),
    duplex = require('./lib/duplex.js'),
    FromArr = require('./lib/from-arr.js')
    ToArr = require('./lib/to-arr'),
    Match = require('./lib/match.js');

exports.forEach = function(fn, thisArg) {
  var index = 0;
  thisArg = (typeof thisArg !== 'undefined' ? thisArg : null);
  return through.obj(function(obj, enc, onDone) {
    fn.call(thisArg, obj, index++);
    this.push(obj);
    onDone();
  });
}

exports.map = function(fn, thisArg) {
  var index = 0;
  thisArg = (typeof thisArg !== 'undefined' ? thisArg : null);
  return through.obj(function(obj, enc, onDone) {
    this.push(fn.call(thisArg, obj, index++));
    onDone();
  });
}

exports.filter = function(fn, thisArg) {
  var index = 0;
  thisArg = (typeof thisArg !== 'undefined' ? thisArg : null);
  return through.obj(function(obj, enc, onDone) {
    if (fn.call(thisArg, obj, index++)) { this.push(obj); }
    onDone();
  });
}

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
}

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
}

exports.clone = function() {
  return map(cloneLib);
}

exports.fork = function() {
  var args = (Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.call(arguments)),
      result = through.obj();
  args.forEach(function(target) {
    // to avoid forked streams from interfering with each other, we will have to create a
    // fresh clone for each fork
    result.pipe(clone()).pipe(target);
  });
  return result;
}

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

  return new Match({
    objectMode: true,
    conditions: conditions,
    streams: streams
  });
};

exports.devnull = function(endFn) {
  var result = new DevNull();
  if (endFn) {
    result.once('finish', endFn);
  }
  return result;
};
exports.fromArray = function(arr) { return new FromArr({ objectMode: true, arr: arr }); };
exports.toArray = function(fn) { return new ToArr({ objectMode: true, fn: fn }); };
exports.duplex = duplex;
exports.thru = exports.through = through;

// TODO:
// - add writable(fn)
// - add readable(fn, fn)

exports.pipeline = function() {

  // iterate and construct duplex pipelines from arrays (deep)

  // finally construct the top level duplex stream


  var streams = exports.pipe(Array.prototype.slice.call(arguments));
  return duplex(streams[0], streams[streams.length - 1]);
};

