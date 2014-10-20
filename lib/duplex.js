var through = require('through2'),
    isStream = require('isstream');

function duplex(writable, readable) {
  console.log(readable);

  if (!isStream.isWritable(writable)) {
    throw new Error('The first stream must be writable.');
  }
  if (!isStream.isReadable(readable)) {
    throw new Error('The last stream must be readable.');
  }
  if (writable === readable) {
    throw new Error('The two streams must not be === to each other.');
    // ... because it would lead to a bunch of special cases related to duplicate calls
  }

  var wrapper = through.obj(),
      wrapperEmit = wrapper.emit,
      readableEvents = ['readable', 'data', 'end', 'close', 'error', 'newListener', 'removeListener'],
      writableEvents = ['drain', 'finish', 'pipe', 'unpipe', 'error', 'newListener', 'removeListener'];

  // readable events
  readableEvents.forEach(function(key) {
    readable.on(key, function() {
      wrapperEmit.apply(wrapper, [key].concat(Array.prototype.slice.call(arguments)));
    });
  });

  // writable events
  writableEvents.forEach(function(key) {
    writable.on(key, function() {
      wrapperEmit.apply(wrapper, [key].concat(Array.prototype.slice.call(arguments)));
    });
  });

  // eventemitter methods - targeted, chainable
  ['addListener', 'on', 'once', 'removeListener', 'emit', 'listeners'].forEach(function(key) {
    wrapper[key] = function() {
      var isWritableEvent = writableEvents.indexOf(arguments[0]) > -1;

      if (!isWritableEvent) {
        readable[key].apply(readable, arguments);
      } else {
        writable[key].apply(writable, arguments);
      }
      return wrapper;
    };
  });
  // ee methods; need to apply to both, return chainable
  ['removeAllListeners', 'setMaxListeners'].forEach(function(key) {
    wrapper[key] = function() {
      writable[key].apply(writable, arguments);
      readable[key].apply(readable, arguments);
      return wrapper;
    };
  });

  // readable methods - non chained (return value directly)
  ['read', 'pipe', 'unshift', 'wrap'].forEach(function(key) {
    wrapper[key] = function() { return readable[key].apply(readable, arguments); };
  });

  // readable methods - chained (return wrapper)
  ['setEncoding', 'resume', 'pause', 'unpipe'].forEach(function(key) {
    wrapper[key] = function() {
      readable[key].apply(readable, arguments);
      return wrapper;
    };
  });

  // writable methods
  ['write', 'end'].forEach(function(key) {
    wrapper[key] = function() { return writable[key].apply(writable, arguments); };
  });

  return wrapper;
}

module.exports = duplex;
