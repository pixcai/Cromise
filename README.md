# Cromise
A Promise/A+ specification implementation

It is an extremely lightweight implementation and very useful for learning how to implement the Promise/A+ spec.

## API
### Cromise.all(iterable)
Returns a Promise that waits for all promises in the iterable to be fulfilled and is then fulfilled with an array of those resulting values (in the same order as the input).

### Cromise.race(iterable)
Returns a promise that resolves or rejects as soon as any of the promises in iterable have been resolved or rejected (with the corresponding reason or value).

### Cromise.reject(reason)
Returns a promise that is rejected with the given reason.

### Cromise.resolve(value)
Returns a promise that is resolved with the given value.

If the value is a promise, then it is unwrapped so that the resulting promise adopts the state of the promise passed in as value. This is useful for converting promises created by other libraries.

### Cromise.prototype.catch(onRejected)
Equivalent to calling Cromise.prototype.then(undefined, onRejected)

### Cromise.prototype.done(onFulfilled, onRejected)
Calls onFulfilled or onRejected with the fulfillment value or rejection reason of the promise (as appropriate).

Unlike Cromise.prototype.then it does not return a Promise. It will also throw any errors that occur in the next tick, so they are not silenced. In node.js they will then crash your process (so it can be restarted in a clean state). In browsers, this will cause the error to be properly logged.

### Cromise.prototype.finally(onResolved)
Some promise libraries implement a (non-standard) .finally method. It takes a function, which it calls whenever the promise is fulfilled or rejected.

### Cromise.prototype.then(onFulfilled, onRejected)
Calls onFulfilled or onRejected with the fulfillment value or rejection reason of the promise (as appropriate) and returns a new promise resolving to the return value of the called handler.

If the handler throws an error, the returned Promise will be rejected with that error.

If the onFulfilled handler is not a function, it defaults to the identify function (i.e. function (value) { return value; }).

If the onRejected handler is not a function, it defaults to a function that always throws (i.e. function (reason) { throw reason; }).

## Liscense
MIT