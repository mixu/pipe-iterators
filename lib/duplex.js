var through = require('through2'),
    isStream = require('isstream');

function duplex(writable, readable) {
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
      readableEvents = ['readable', 'data', 'end', 'close', 'error', 'newListener', 'removeListener'],
      writableEvents = ['drain', 'finish', 'pipe', 'unpipe', 'error', 'newListener', 'removeListener'];

  // eventemitter methods - targeted, chainable
  var originalMethods = {};
  ['addListener', 'on', 'once', 'removeListener', 'emit', 'listeners'].forEach(function(key) {
    originalMethods[key] = wrapper[key];
    wrapper[key] = function() {
      var isWritableEvent = writableEvents.indexOf(arguments[0]) > -1,
          isReadableEvent = readableEvents.indexOf(arguments[0]) > -1;

      // should not emit twice given a once method
      if (key === 'once') {
        // wrap the last argument
        var emitted = false,
            listenerFn = arguments[arguments.length - 1];
        arguments[arguments.length - 1] = function() {
          var args = Array.prototype.slice.call(arguments);
          if (!emitted) {
            emitted = true;
            listenerFn.apply(wrapper, args);
          }
        };
      }
      // error events are re-emitted on the wrapper in the case of a piped stream
      // by the stream piped into the emitter
      if (arguments[0] === 'error') {
        if (key !== 'emit') {
          // listen on both, never emit on either
          readable[key].apply(readable, arguments);
          writable[key].apply(writable, arguments);
        }
        originalMethods[key].apply(wrapper, arguments);
        return wrapper;
      }

      if (isReadableEvent) {
        readable[key].apply(readable, arguments);
      }
      if (isWritableEvent) {
        writable[key].apply(writable, arguments);
      }
      if (!isReadableEvent && !isWritableEvent) {
        originalMethods[key].apply(wrapper, arguments);
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
