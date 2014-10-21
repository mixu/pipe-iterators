var assert = require('assert'),
    pi = require('../index.js'),
    isReadable = require('isstream').isReadable,
    isWritable = require('isstream').isWritable,
    isDuplex = require('isstream').isDuplex,
    child_process = require('child_process');

describe('match', function() {

  it('returns a writable stream, accepts multiple condition + stream pairs', function(done) {
    var twos = [],
        threes = [],
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

  it('works when given a single condition and stream', function(done) {
    var twos = [],
        result = pi.match(
          function(obj) { return obj % 2 == 0; },
          pi.toArray(twos)
        );

    assert.ok(isWritable(result));
    assert.ok(!isReadable(result));

    pi.fromArray([ 1, 2, 3, 4, 5, 6 ])
      .pipe(result)
      .once('finish', function() {
        assert.deepEqual(twos, [ 2, 4, 6]);
        done();
      });
  });

  it('works when given a single stream (rest)', function(done) {
    var all = [],
        result = pi.match(
          pi.toArray(all)
        );

    assert.ok(isWritable(result));
    assert.ok(!isReadable(result));

    pi.fromArray([ 1, 2, 3, 4, 5, 6 ])
      .pipe(result)
      .once('finish', function() {
        assert.deepEqual(all, [ 1, 2, 3, 4, 5, 6 ]);
        done();
      });
  });

  it('accepts a last parameter which is a stream for non-matching elements', function(done){
    var twos = [],
        threes = [],
        rest = [],
        result = pi.match(
          function(obj) { return obj % 2 == 0; },
          pi.toArray(twos),
          function(obj) { return obj % 3 == 0; },
          pi.toArray(threes),
          pi.toArray(rest)
        );

    assert.ok(isWritable(result));
    assert.ok(!isReadable(result));

    pi.fromArray([ 1, 2, 3, 4, 5, 6 ])
      .pipe(result)
      .once('finish', function() {
        assert.deepEqual(twos, [ 2, 4, 6]);
        assert.deepEqual(threes, [ 3 ]); // matched in order
        assert.deepEqual(rest, [ 1, 5]);
        done();
      });
  });

  xit('listening on error captures errors emitted in the first stream', function(done) {

  });


  xit('listening on error captures errors emitted in the second stream', function(done) {

  });


  xit('listening on error captures errors emitted in the rest stream', function(done) {

  });

});

describe('fork', function() {

  it('returns a duplex stream', function() {
    var result = pi.fork();
    assert.ok(isWritable(result));
    assert.ok(isReadable(result));
  });

  it('prevents streams from interfering with each other by cloning', function(done) {
    var inputs = [ { id: 1 }, { id: 2 } ],
        result1 = [],
        result2 = [];
    pi.fromArray(inputs)
      .pipe(pi.fork(
        pi.head(pi.mapKey('foo', function() { return 'bar'; }), pi.toArray(result1)),
        pi.head(pi.mapKey('id', function(val) { return val * 2; }), pi.toArray(result2))
      )).once('finish', function() {
        assert.deepEqual(result1, [ { id: 1, foo: 'bar'}, { id: 2, foo: 'bar' }]);
        assert.deepEqual(result2, [ { id: 2 }, { id: 4 }]);
        done();
      });
  });
});
