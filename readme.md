# pipe-iterators

Functions for iterating over object mode streams.

# API

The API is analoguous to the native `Array.*` iteration API (`forEach`, `map`, `filter`). All the functions return object mode streams.

- `forEach(function(obj) {})`: returns a stream that iterates over every element in the stream and passes through every element. The return value from the callback is ignored.
- `map(function(obj) {})`: returns a stream that iterates over every element in the stream. The output value from the callback is written to the stream.
- `filter(function(obj) {})`: returns a stream that iterates over every element in the stream. If the return value from the callback function is `false`, then the current element is filtered (not written to the next stream). If the return value is `true`, the element is written to the next stream.
- `mapKey(key, function(value) {})`: takes `obj[key]`, and calls the function with this value. The return value from the function replaces the old value.
- `mapKey(hash)`: you can also specify a `key => fn` hash

Note that the callbacks only receive one argument - the value from the stream - which means that you can probably just write `.map(someLibFn)` directly without worrying about `someLibFn` getting extra arguments.

- `fork(stream1, stream2, ...)`: returns a duplex stream. The stream is piped into the streams passed as arguments. Every forked stream receives a clone of the original input object. Cloning prevents annoying issues that might occur when one fork stream modifies an object that is shared among multiple forked streams.
- `fork([stream1, stream2, ...])`: you can also pass an array
- `clone()`: returns a stream that clones each of the input values before writing them forward.
- `.pipeFirst(stream1, stream2, ...)`: Like `a.pipe(b).pipe(c)`, but returns the first stream (`a`) rather than the last stream (`c`).
- `.pipeFirst([stream1, stream2, ...])`: you can also pass an array.

When calling `fork`, keep in mind that `.pipe()` returns the last stream's object, so you probably want to use `.pipeFirst(stream1, stream2, ...)`, since `.fork(a.pipe(b).pipe(c))` would be equivalent to `.fork(c)` and not `.fork(a)` because of how `.pipe` works.

## Examples

Log every item:

```js
.pipe(forEach(function(obj) { console.log(obj); }))
```

Set defaults:
    
```js
.pipe(map(function(obj) { return _.extend(obj, source); }));
```

Convert to string:

```js
.pipe(map(function(chunk) { return chunk.toString()); }));    
```

Append or prepend a value:

```js
.pipe(map(function(chunk) { return chunk + '!!' }))
```

Replace the value in the `path` key:

```js
.pipe(mapKey('path', function(p) { return p.replace(assetPath, outPath); }))
```

## What about asynchronous iteration?

Meh, `through2` streams already make writing async iteration quite easy. 
