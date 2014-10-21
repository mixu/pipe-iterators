var assert = require('assert'),
    pi = require('../index.js'),
    isReadable = require('isstream').isReadable,
    isWritable = require('isstream').isWritable,
    isDuplex = require('isstream').isDuplex,
    child_process = require('child_process');

describe('fromArray', function() {

  it('returns a readable stream with the array contents', function(done) {
    var stream = pi.fromArray(1, 2, 3);
    assert.ok(isReadable(stream));
    stream.pipe(pi.toArray(function(contents) {
      assert.deepEqual(contents, [ 1, 2, 3 ]);
      done();
    }));
  });

});

describe('toArray', function() {

  it('returns a writable stream', function() {
    var stream = pi.toArray();
    assert.ok(isWritable(stream));
  });

  it('accepts an optional callback on end', function(done) {
    var stream = pi.toArray(function(contents) {
      assert.deepEqual(contents, [ 1, 2, 3 ]);
      done();
    });
    pi.fromArray(1, 2, 3).pipe(stream);
  });

  it('accepts an array as a target', function(done) {
    var result = [],
        stream = pi.toArray(result);
    pi.fromArray(1, 2, 3).pipe(stream).once('finish', function() {
      assert.deepEqual(result, [ 1, 2, 3 ]);
      done();
    });
  });
});


describe('devnull', function() {

  it('returns a writable stream which consumes every element', function() {
    var result = pi.devnull();
    assert.ok(isWritable(result));
    assert.ok(!isReadable(result));
  });

  it('call an optional callback on end', function(done) {
    var result = pi.devnull(done);
    pi.fromArray(1).pipe(result);
  });
});

describe('duplex', function() {

  it('throws an error if the first argument is not a readable stream', function() {
    assert.throws(function() {
      var result = pi.duplex(pi.toArray(), pi.toArray());
    });
  });

  it('throws an error if the last argument is not a writable stream', function() {
    assert.throws(function() {
      var result = pi.duplex(pi.fromArray(1), pi.fromArray(1));
    });
  });

  it('throws an error if the first and last streams are the same stream', function() {
    assert.throws(function() {
    var thru = pi.thru();
      var result = pi.duplex(thru, thru);
    });
  });

  it('works with a child process object', function(done) {
    var p = child_process.spawn('wc', ['-c']),
        stream = pi.duplex(p.stdin, p.stdout);

    assert.ok(isReadable(stream));
    assert.ok(isWritable(stream));
    assert.ok(isDuplex(stream));

    pi.fromArray('a', 'b', 'c')
      .pipe(stream)
      .pipe(pi.toArray(function(result) {
        assert.equal(result, 3);
        done()
      }));
  });

  it('listening on error captures errors emitted in the first stream', function(done) {
    var result = pi.duplex(pi.thru.obj(function(chunk, enc, done) {
      this.emit('error', new Error('Expected error'));
      this.push(chunk);
      done();
    }), pi.thru.obj());

    result.once('error', function(err) {
      assert.ok(err);
      done();
    });
    pi.fromArray(1).pipe(result).pipe(pi.devnull());
  });

  it('listening on error captures errors emitted in the second stream', function(done) {
    // note that duplex does NOT pipe the two streams together
    var writable = pi.through.obj();
    var readable = pi.through.obj(function(chunk, enc, done) {
      this.emit('error', new Error('Expected error'));
      this.push(chunk);
      done();
    });
    writable.pipe(readable);
    var result = pi.duplex(writable, readable);

    result.once('error', function(err) {
      assert.ok(err);
      done();
    });

    pi.fromArray(1).pipe(result).pipe(pi.devnull());
  });
});
