var assert = require('assert'),
    pi = require('../index.js'),
    isReadable = require('isstream').isReadable,
    isWritable = require('isstream').isWritable,
    isDuplex = require('isstream').isDuplex;

describe('forEach', function() {

  var stream, calls, contexts;

  beforeEach(function() {
    calls = [];
    contexts = [];
    stream = pi.fromArray(['a', 'b', 'c']);
  });

  it('iterates over every element with expected arguments', function(done) {
    stream.pipe(pi.forEach(function(obj, index) {
        contexts.push(this);
        calls.push([ obj, index]);
      }))
      .pipe(pi.toArray(function(results) {
        assert.deepEqual(calls, [
          [ 'a', 0 ],
          [ 'b', 1 ],
          [ 'c', 2 ]
        ]);
        assert.deepEqual(results, [ 'a', 'b', 'c' ]);
        done();
      }));
  });

  it('uses the provided thisArg', function(done) {
    var context = { foo: 'bar' };
    stream.pipe(pi.forEach(function(obj, index) {
        contexts.push(this);
        calls.push([ obj, index]);
      }, context))
      .pipe(pi.toArray(function(results) {
        assert.ok(contexts.every(function(item) {
          return item === context;
        }));
        assert.deepEqual(calls, [
          [ 'a', 0 ],
          [ 'b', 1 ],
          [ 'c', 2 ]
        ]);
        assert.deepEqual(results, [ 'a', 'b', 'c' ]);
        done();
      }));
  });
});

describe('map', function() {

  var stream, calls, contexts;

  beforeEach(function() {
    calls = [];
    contexts = [];
    stream = pi.fromArray(['a', 'b', 'c']);
  });

  it('should apply a mapper', function(done) {
    stream.pipe(pi.map(function(obj, index) {
        contexts.push(this);
        calls.push([ obj, index]);
        return obj.toString().toUpperCase();
      }))
      .pipe(pi.toArray(function(results) {
        assert.deepEqual(calls, [
          [ 'a', 0 ],
          [ 'b', 1 ],
          [ 'c', 2 ]
        ]);
        assert.deepEqual(results, [ 'A', 'B', 'C' ]);
        done();
      }));
  });

  it('uses the provided thisArg', function(done) {
    var context = { foo: 'bar' };
    stream.pipe(pi.map(function(obj, index) {
        contexts.push(this);
        calls.push([ obj, index]);
        return obj.toString().toUpperCase();
      }, context))
      .pipe(pi.toArray(function(results) {
        assert.ok(contexts.every(function(item) {
          return item === context;
        }));
        assert.deepEqual(calls, [
          [ 'a', 0 ],
          [ 'b', 1 ],
          [ 'c', 2 ]
        ]);
        assert.deepEqual(results, [ 'A', 'B', 'C' ]);
        done();
      }));
  });
});

describe('filter', function() {

  var stream, calls, contexts;

  beforeEach(function() {
    calls = [];
    contexts = [];
    stream = pi.fromArray([1, 2, 3]);
  });

  it('filters out non-matching values', function(done) {
    stream.pipe(pi.filter(function(obj, index) {
        contexts.push(this);
        calls.push([ obj, index]);
        return obj % 2 == 0;
      }))
      .pipe(pi.toArray(function(results) {
        assert.deepEqual(calls, [
          [ 1, 0 ],
          [ 2, 1 ],
          [ 3, 2 ]
        ]);
        assert.deepEqual(results, [ 2 ]);
        done();
      }));
  });

  it('uses the provided thisArg', function(done) {
    var context = { foo: 'bar' };
    stream.pipe(pi.filter(function(obj, index) {
        contexts.push(this);
        calls.push([ obj, index]);
        return obj % 2 == 0;
      }, context))
      .pipe(pi.toArray(function(results) {
        assert.ok(contexts.every(function(item) {
          return item === context;
        }));
        assert.deepEqual(calls, [
          [ 1, 0 ],
          [ 2, 1 ],
          [ 3, 2 ]
        ]);
        assert.deepEqual(results, [ 2 ]);
        done();
      }));
  });
});

describe('mapKey', function() {

  var stream, calls, contexts, context = { foo: 'bar' };

  beforeEach(function() {
    calls = [];
    contexts = [];
    stream = pi.fromArray([
        { a: 'aBc', b: 'dEf' },
        { a: 'gHi', b: 'jKl' },
        {}
      ]);
  });

  it('maps with a string and a function', function(done) {
    var objs = [];
    stream.pipe(pi.mapKey('a', function(value, obj, index) {
        contexts.push(this);
        objs.push(obj);
        calls.push([ value, index]);
        return ('' + value).toUpperCase();
      }, context))
      .pipe(pi.toArray(function(results) {
        assert.ok(contexts.every(function(item) {
          return item === context;
        }));
        assert.ok(objs.every(function(item, index) {
          return item === results[index];
        }));
        assert.deepEqual(calls, [
          [ 'aBc', 0 ],
          [ 'gHi', 1 ],
          [ undefined, 2 ]
        ]);
        assert.deepEqual(results, [
          { a: 'ABC', b: 'dEf' },
          { a: 'GHI', b: 'jKl' },
          { a: 'UNDEFINED' }
        ]);
        done();
      }));
  });

  it('maps with a hash of functions and non-functions', function(done) {
    var objs = [];
    stream.pipe(pi.mapKey({
      a: function(value, obj, index) {
        contexts.push(this);
        objs.push(obj);
        calls.push([ value, index]);
        return ('' + value).toUpperCase();
      },
      // bool, str, obj, arr, null, undefined
      b: true,
      c: 'str',
      d: { foo: 'bar' },
      e: [ 'a' ],
      f: null,
      e: undefined
    }, context))
      .pipe(pi.toArray(function(results) {
        assert.ok(contexts.every(function(item) {
          return item === context;
        }));
        assert.ok(objs.every(function(item, index) {
          return item === results[index];
        }));
        assert.deepEqual(calls, [
          [ 'aBc', 0 ],
          [ 'gHi', 1 ],
          [ undefined, 2 ]
        ]);
        assert.deepEqual(results, [
          { a: 'ABC', b: true, c: 'str', d: { foo: 'bar' }, e: [ 'a' ], f: null, e: undefined },
          { a: 'GHI', b: true, c: 'str', d: { foo: 'bar' }, e: [ 'a' ], f: null, e: undefined },
          { a: 'UNDEFINED', b: true, c: 'str', d: { foo: 'bar' }, e: [ 'a' ], f: null, e: undefined }
        ]);
        done();
      }));
  });
});

describe('reduce', function() {

  var stream, calls;

  beforeEach(function() {
    calls = [];
    stream = pi.fromArray([1, 2, 3]);
  });

  it('accumulates results', function(done) {
    stream.pipe(pi.reduce(function(prev, curr, index) {
        calls.push([ prev, curr, index ]);
        return prev + curr;
      }, 4))
      .pipe(pi.toArray(function(results) {
        assert.deepEqual(calls, [
          [ 4, 1, 0 ],
          [ 5, 2, 1 ],
          [ 7, 3, 2 ]
        ]);
        assert.deepEqual(results, [ 10 ]);
        done();
      }));
  });

  it('works when initial is not set', function(done) {
    stream.pipe(pi.reduce(function(prev, curr, index) {
        calls.push([ prev, curr, index]);
        return prev + curr;
      }))
      .pipe(pi.toArray(function(results) {
        assert.deepEqual(calls, [
          [ 1, 2, 1 ],
          [ 3, 3, 2 ]
        ]);
        assert.deepEqual(results, [ 6 ]);
        done();
      }));
  });

// If the stream has only one element and no `initialValue` was provided,
// or if `initialValue` is provided but the stream is empty, the solo
// value would be returned without calling callback.


});

describe('pipe function tests', function() {
  var dataEvents, endEvents;

  function getPassThrough() {
    return pi.through.obj(function(data, enc, done) {
      dataEvents.push(data);
      this.push(data);
      done();
    }, function(done) {
      endEvents++;
      done();
    });
  }

  beforeEach(function() {
    dataEvents = [];
    endEvents = 0;
  });

  describe('pipe', function() {

    it('constructs a pipe and returns an array', function(done) {
      var result = pi.pipe([
        getPassThrough(), getPassThrough()
      ]);

      assert.ok(Array.isArray(result));

      pi.fromArray([1, 2])
        .pipe(result[0])
        .pipe(pi.toArray(function(results) {
          assert.deepEqual(results, [ 1, 2 ]);
          assert.deepEqual(dataEvents, [ 1, 1, 2, 2]);
          assert.equal(endEvents, 2);
          done();
        }));
    });

    it('works when given a single array as an argument', function(done) {
      var result = pi.pipe([
        getPassThrough()
      ]);

      assert.ok(Array.isArray(result));

      pi.fromArray([1, 2])
        .pipe(result[0])
        .pipe(pi.toArray(function(results) {
          assert.deepEqual(results, [ 1, 2 ]);
          assert.deepEqual(dataEvents, [ 1, 2]);
          assert.equal(endEvents, 1);
          done();
        }));
    });

  });

  describe('head', function() {

    it('creates a pipe and returns the first element in the pipe', function(done) {
      var result = pi.head([
        getPassThrough(), getPassThrough()
      ]);

      assert.ok(!Array.isArray(result));
      assert.ok(isWritable(result) && isReadable(result));

      pi.fromArray([1, 2])
        .pipe(result)
        .pipe(pi.toArray(function(results) {
          assert.deepEqual(results, [ 1, 2 ]);
          assert.deepEqual(dataEvents, [ 1, 1, 2, 2]);
          assert.equal(endEvents, 2);
          done();
        }));
    });

    it('works when given a single array as an argument', function(done) {
      var result = pi.head([
        getPassThrough()
      ]);

      assert.ok(!Array.isArray(result));
      assert.ok(isWritable(result) && isReadable(result));

      pi.fromArray([1, 2])
        .pipe(result)
        .pipe(pi.toArray(function(results) {
          assert.deepEqual(results, [ 1, 2 ]);
          assert.deepEqual(dataEvents, [ 1, 2]);
          assert.equal(endEvents, 1);
          done();
        }));
    });

  });

  describe('tail', function() {

    it('creates a pipe and returns the lest element in the pipe', function(done) {
      var result = pi.tail([
        getPassThrough(), getPassThrough()
      ]);

      assert.ok(!Array.isArray(result));
      assert.ok(isWritable(result) && isReadable(result));

      pi.fromArray([1, 2])
        .pipe(result)
        .pipe(pi.toArray(function(results) {
          assert.deepEqual(results, [ 1, 2 ]);
          assert.deepEqual(dataEvents, [ 1, 2]);
          assert.equal(endEvents, 1);
          done();
        }));
    });

    it('works when given a single array as an argument', function(done) {
      var result = pi.tail([
        getPassThrough(),
      ]);

      assert.ok(!Array.isArray(result));
      assert.ok(isWritable(result) && isReadable(result));

      pi.fromArray([1, 2])
        .pipe(result)
        .pipe(pi.toArray(function(results) {
          assert.deepEqual(results, [ 1, 2 ]);
          assert.deepEqual(dataEvents, [ 1, 2]);
          assert.equal(endEvents, 1);
          done();
        }));
    });

  });

});



describe('match', function() {

  it('returns a writable stream, accepts multiple condition + stream pairs', function(done) {
    var twos = [],
        threes = [];
        result = pi.match(
          function(obj) { return obj % 2 == 0; },
          pi.toArray(twos),
          function(obj) { return obj % 3 == 0; },
          pi.toArray(threes)
        );

    assert.ok(isWritable(result));
    assert.ok(!isReadable(result));

    pi.fromArray([ 1, 2, 3, 4, 5, 6 ])
      .pipe(result)
      .once('finish', function() {
        assert.deepEqual(twos, [ 2, 4, 6]);
        assert.deepEqual(threes, [ 3 ]); // matched in order
        done();
      });
  });

  it('works when given a single stream', function() {

  });

  it('accepts a last parameter which is a stream for non-matching elements');

});

describe('fork', function() {

  it('returns a duplex stream'); // ??

  it('prevents streams from interfering with each other by cloning');

});

describe('devnull', function() {

  it('returns a writable stream which consumes every element');

  it('call an optional callback on end');

});


describe('fromArray', function() {

  it('returns a readable stream with the array contents');

});

describe('toArray', function() {

  it('returns a writable stream');

  it('accepts an optional callback on end');

  it('accepts an array as a target');
});

describe('duplex', function() {

  it('throws an error if the first argument is not a readable stream');

  it('throws an error if the last argument is not a writable stream');

  it('throws an error if the first and last streams are the same stream');

  it('works with a child process object', function() {

  var p = cp.spawn('wc', ['-c']);

  var cp = require('child_process');

    .pipe(pi.duplex(p.stdin, p.stdout))
    .pipe(process.stdout);

  });

});

describe('pipeline', function() {

  it('throws an error if the first argument is not a readable stream');

  it('throws an error if the last argument is not a writable stream');

  it('throws an error if the first and last streams are the same stream');


});
