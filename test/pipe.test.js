var assert = require('assert'),
    pi = require('../index.js'),
    isReadable = require('isstream').isReadable,
    isWritable = require('isstream').isWritable,
    isDuplex = require('isstream').isDuplex;

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

describe('pipeline', function() {

  it('throws an error if the first argument is not a readable stream');

  it('throws an error if the last argument is not a writable stream');

  it('throws an error if the first and last streams are the same stream');

});
