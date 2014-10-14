# pipe-iterators

Functions for iterating over object mode streams.

# Installation

    npm install --save pipe-iterators

Preamble:

```js
var pi = require('pipe-iterators');
```

## Iteration functions

The API is analoguous to the native `Array.*` iteration API (`forEach`, `map`, `filter`). All the functions return object mode streams.

### forEach

```js
pi.forEach(callback, [thisArg])
```

Calls a function for each element in the stream. `callback` is invoked with two arguments:

- the element value
- the element index

The return value from the callback is ignored. If `thisArg` is provided, it is available as `this` within the callback.

- `forEach(function(obj) {})`: returns a stream that iterates over every element in the stream and passes through every element. 

```js
pi.fromArray(['a', 'b', 'c'])
  .pipe(pi.forEach(function(obj) { console.log(obj); }));
```

### map

```js
pi.map(callback, [thisArg])
```

Produces a new stream of values by mapping each value in the stream through a transformation callback. The callback is invoked with two arguments, the element value and the element index. 

The return value from the callback is written back to the stream. If `thisArg` is provided, it is available as `this` within the callback.

```js
pi.fromArray([{ a: 'a' }, { b: 'b' }, { c: 'c' }])
  .pipe(pi.map(function(obj) { return _.defaults(obj, { foo: 'bar' }); }));
```

### mapKey

```js
pi.mapKey(key, callback, [thisArg])
pi.mapKey(hash, [thisArg])
```

Produces a new stream of values by mapping a single key (when given `key` and `callback`) or multiple keys (when given `hash`) through a transformation callback. The callback is invoked with two arguments: the value of  `element[key]`, and the element itself.

The return value from the callback is set on the element, and the element itself is written back to the stream. If `thisArg` is provided, it is available as `this` within the callback.

- `mapKey(key, function(value, obj) {})`: takes `obj[key]`, and calls the function with this value; the second argument is the full object. The return value from the function replaces the old value of `obj[key]`.
- `mapKey(hash)`: you can also specify a `key => fn` hash. You can also specify a value that this not a function, in which case it is simply assigned as the new value.

```js
pi.fromArray([{ path: '/a/a' }, { path: '/a/b' }, { path: '/a/c' }])
  .pipe(pi.mapKey('path', function(p) { return p.replace('/a/', '/some/'); }));
```

### reduce

```js
pipe(pi.reduce(callback, [initialValue]))
```

Reduce boils down a stream of values into a single value. `initialValue` is the initial value of the reduction, and each successive step of it should be returned by the callback. The callback is called with three arguments: the previous (or initial) value, the current value and the index.

- `reduce(function(prev, obj){}, initial)`: returns a stream that accumulates all of the input, applying the given callback on each entry and storing the return value from the callback as the new value of the accumulator. When the input stream ends, emits the value built up in the accumulator.

```js
pi.reduce(function(posts, post) { return posts.concat(post); }, []),
```


### reduceRight

```js

```

### filter

```js
pipe(pi.filter(callback, [thisArg]))
```

Looks through each value in the stream, writing all the values that pass a truth test defined by `callback`.

- `filter(function(obj) {})`: returns a stream that iterates over every element in the stream. If the return value from the callback function is `false`, then the current element is filtered (not written to the next stream). If the return value is `true`, the element is written to the next stream.

```js
pi.filter(function(post) { return !post.draft; })
```

## Input and output

### fromArray

```js
pi.fromArray(arr)
```

- `fromArray(arr)`: constructs a readable stream from an array. The stream will emit one item for each item in the array, and then emit end.

### toArray

```js
.pipe(pi.toArray(callback))
```

Returns an instance of a writable stream which captures all of the input. The `callback` is invoked with an array containing every element in the stream when the stream emits `end`.

- `toArray(function(err, arr) {})`: constructs a duplex stream which reads in a set of values, places them in a single array and then finally calls the given function, passing in the `err` (any stream errors) and `arr` (containing all the values in a single array). Since this is a duplex stream you can pipe from it as well, and it will write the array it receives after it receives the end event.

### devnull

```js
pi.devnull()
```

Returns an instance of a writable stream which consumes any input and produces no output. Useful for executing pipelines consisting of duplex (through) streams when you want to ensure that the last step in the pipeline fully consumes the output coming into the pipeline.

## Control flow

### fork

```js
pi.fork(stream1, stream2, stream3)
```

Create an instance of a duplex stream

- `fork(stream1, stream2, ...)`: returns a duplex stream. The stream is piped into the streams passed as arguments. Every forked stream receives a clone of the original input object. Cloning prevents annoying issues that might occur when one fork stream modifies an object that is shared among multiple forked streams.
- `fork([stream1, stream2, ...])`: you can also pass an array

### head()

```js
pi.head(stream1, stream2, stream3)
```

Calls `.pipe()` on every stream, constructing a pipeline. Almost like `a.pipe(b).pipe(c)`, but  `.head()` returns the first stream (`a`) rather than the last stream (`c`). The equivalent without `.head` would be:

```js
(function() {
    var head = a;
    a.pipe(b).pipe(c);
    return head;
}())
```

### tail()

```js
pi.tail(stream1, stream2, stream3)
```

Calls `.pipe` on every stream, constructing a pipeline. Returns the last stream; just like calling `stream1.pipe(stream2).pipe(stream3)`.

### pipeline

```js
pi.pipeline(stream1, [ inStream, ..., outStream], stream2, ...)
```

- `.pipeFirst(stream1, stream2, ...)`: 
- `.pipeFirst([stream1, stream2, ...])`: you can also pass an array.

When calling `fork`, keep in mind that `.pipe()` returns the last stream's object, so you probably want to use `.pipeFirst(stream1, stream2, ...)`, since `.fork(a.pipe(b).pipe(c))` would be equivalent to `.fork(c)` and not `.fork(a)` because of how `.pipe` works.

#### Use case for pipeline

As you start building a larger pipeline, there are several annoyances with the standard `.pipe` which `.pipeline` resolves.

- first, writing `.pipe()` for each step in the pipeline gets a bit tedious
- second, it is hard to write modules that return pipelines because you want to write to the first stream in the array but read from the last stream in the array.

For example, this will break: `input.pipe(pi.fork(a.pipe(a2).pipe(a3), b))` - because `a.pipe(a2).pipe(a3)` returns `a3` when what you probably want is `a`.

With pipeline you can write this as: 

```js
input.pipe(pi.fork(pi.pipeline(a, a2, a3), b));
```

You could use a temporary variable to write:

```js
var head = a;
a.pipe(a2).pipe(a3);
input.pipe(pi.fork(head, b));
```

but this is ugly.

Second, imagine that you want to have a module with a function that returns a pipeline. You can't write:

```js
module.exports = function() {
  var head = a;
  a.pipe(a2).pipe(a3);
  return head;    
};
```

because the return value is not usable with `.pipe`:

```js
var myPipeline = require('./my-pipeline');
input.pipe(myPipeline).pipe(b);
```

because `myPipeline` returns `head` - and hence this is equivalent to `input.pipe(head).pipe(b)` when what you would want is: `input.pipe(head).pipe(a2).pipe(a3).pipe(b)`. 

With `.pipeline()`, writes into the return value go to the first stream but reads (and pipe calls) are applied to the last value in the stream:

```js
module.exports = function() {
  return pi.pipeline(a, a2, a3);
};
```

works as expected and `input.pipe(myPipeline).pipe(b)` writes to `a` but reads from `a3`.





# API


TODO: context object argument support - should default to the through stream.
TODO: .pipe() should do the right thing given .pipe([ foo, [ first, ..., last], bar); this would probably reduce the number of calls needed to pipeFirst. Also, maybe it should be called `head([ pipeline])` (or `first([pl])`)


Note that the forEach/map/filter callbacks only receive one argument - the value from the stream - which means that you can probably just write `.map(someLibFn)` directly without worrying about `someLibFn` getting extra arguments.

- `.through`: exposes the [through2](https://github.com/rvagg/through2) instance used, may be useful if you are using through2 anyway.
- `clone()`: returns a stream that clones each of the input values before writing them forward.


## Examples

  

Convert to string:

```js
.pipe(pi.map(function(chunk) { return chunk.toString()); }));    
```

Append or prepend a value:

```js
pi.fromArray(['a', 'b', 'c'])
  .pipe(pi.map(function(chunk) { return chunk + '!!' }));
```

Join chunks:

```js
pi.fromArray(['a', 'b', 'c'])
  .pipe(pi.reduce(function(prev, chunk) { return prev + '|' + chunk; }, ''));
```


## What about asynchronous iteration?

Meh, `through2` streams already make writing async iteration quite easy. 

## What about splitting strings?

Best handled by something that can do that in an efficient manner, such as [binary-split](https://github.com/maxogden/binary-split).

## Related

- [Raynos/duplexer](https://github.com/Raynos/duplexer)
- [dominictarr/event-stream](https://github.com/dominictarr/event-stream)
- [Medium/sculpt](https://github.com/Medium/sculpt)
