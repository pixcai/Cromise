/* A promise is in one of three different states:
 * pending - The initial state of a promise.
 * fulfilled - The state of a promise representing a successful operation.
 * rejected - The state of a promise representing a failed operation.
 */
const PENDING = Symbol('pending')
const REJECTED = Symbol('rejected')
const FULFILLED = Symbol('fulfilled')

/* Transition to either the fulfilled or rejected state. */
function __transition(cromise, state, value) {
  cromise._state = state
  cromise._value = value

  if (state === FULFILLED && isFunction(cromise._handler.fulfill)) {
    try {
      cromise._handler.fulfill(cromise._value)
    } catch(error) {
      cromise._state = state = REJECTED
      cromise._value = error
    }
  }
  if (state === REJECTED && isFunction(cromise._handler.reject)) {
    try {
      cromise._handler.reject(cromise._value)
    } catch(error) {
      cromise._value = error
    }
  }
}

/* helper function */
const isObject = o => o && typeof o === 'object'
const isFunction = f => typeof f === 'function'

/* The promise resolution procedure is an abstract operation taking as input a promise and a value, 
 * which we denote as [[Resolve]](promise, x). If x is a thenable, 
 * it attempts to make promise adopt the state of x, under the assumption that x behaves at least somewhat like a promise. 
 * Otherwise, it fulfills promise with the value x.
 */
function __resolve(cromise, x) {
  if (x instanceof Cromise) {
    __transition(
      cromise,
      x._state, x._value
    )
    return
  }
  if (isObject(x) || isFunction(x)) {
    if (isFunction(x.then)) {
      x.then(value => {
        __transition(
          cromise,
          FULFILLED, value
        )
      }, reason => {
        __transition(
          cromise,
          REJECTED, reason
        )
      })
      return
    }
  }
  __transition(
    cromise,
    FULFILLED, x
  )
}

class Cromise {
  constructor(fn) {
    /* store value or error once FULFILLED or REJECTED */
    this._value = undefined
      /* store state which can be PENDING, FULFILLED or REJECTED */
    this._state = PENDING
      /* store handlers for PENDING state */
    this._handler = {}

    if (isFunction(fn)) {
      fn(value => __resolve(this, value), reason => __transition(this, REJECTED, reason))
    }
  }

  /* The default toString() function will return [object Object], 
   * So we override it and makes it return [object Cromise]
   */
  toString() {
    return '[object Cromise]'
  }

  /* Returns a Promise that waits for all promises in the iterable to be fulfilled 
   * and is then fulfilled with an array of those resulting values (in the same order as the input).
   */
  static all(iterable) {
    return new Cromise(function(resolve, reject) {
      (function recursion(i) {
        return Cromise.resolve(iterable[i]).then(value => {
            iterable[i] = value
            if (i < iterable.length - 1) {
              recursion(i + 1)
            } else {
              resolve(iterable)
            }
          },
          reject
        )
      })(0)
    })
  }

  /* Returns a promise that resolves or rejects as soon as any of the promises in iterable have been resolved 
   * or rejected (with the corresponding reason or value).
   */
  static race(iterable) {
    return new Cromise(function(resolve, reject) {
      let done = false
      for (let i = 0, length = iterable.length; i < length && !done; i++) {
        Cromise.resolve(iterable[i]).then(
          value => ((!done && resolve(value)), done = true), 
          reject
        )
      }
    })
  }

  /* Returns a promise that is rejected with the given reason. */
  static reject(reason) {
    return new Cromise(function(resolve, reject) {
      reject(reason)
    })
  }

  /* Returns a promise that is resolved with the given value.
   *
   * If the value is a promise, then it is unwrapped so that 
   * the resulting promise adopts the state of the promise passed in as value. 
   * This is useful for converting promises created by other libraries.
   */
  static resolve(value) {
    return new Cromise(resolve => resolve(value))
  }

  /* Equivalent to calling Promise.prototype.then(undefined, onRejected) */
  catch(onRejected) {
    return this.then(undefined, onRejected)
  }

  /* Calls onFulfilled or onRejected with the fulfillment value or rejection reason of the promise (as appropriate).
   *
   * Unlike Promise.prototype.then it does not return a Promise. It will also throw any errors that occur in the next tick, 
   * so they are not silenced. In node.js they will then crash your process (so it can be restarted in a clean state). 
   * In browsers, this will cause the error to be properly logged.
   */
  done(onFulfilled, onRejected) {
    setTimeout(() => {
      if (this._state === FULFILLED && isFunction(onFulfilled)) {
        onFulfilled(this._value)
      }
      if (this._state === REJECTED && isFunction(onRejected)) {
        onRejected(this._value)
      }
    }, 0)
  }

  /* Some promise libraries implement a (non-standard) .finally method. 
   * It takes a function, which it calls whenever the promise is fulfilled or rejected.
   */
  finally(onResolved) {
    return this.then(value => onResolved(value), reason => onResolved(reason))
  }

  /* Calls onFulfilled or onRejected with the fulfillment value or rejection reason of the promise (as appropriate) 
   * and returns a new promise resolving to the return value of the called handler.
   *
   * If the handler throws an error, the returned Promise will be rejected with that error.
   *
   * If the onFulfilled handler is not a function, it defaults to the identify function (i.e. function (value) { return value; }).
   * 
   * If the onRejected handler is not a function, it defaults to a function that always throws (i.e. function (reason) { throw reason; }).
   */
  then(onFulfilled, onRejected) {
    const maybe = (fn, value) => (isFunction(fn) ? fn(value) : value)
    
    return new Cromise((resolve, reject) => {
      if (this._state === PENDING) {
        this._handler.fulfill = value => resolve(maybe(onFulfilled, value))
        this._handler.reject = reason => reject(maybe(onRejected, reason))
        return
      }
      this.done(
        value => resolve(maybe(onFulfilled, value)), 
        reason => reject(maybe(onRejected, reason))
      )
    })
  }
}

module.exports = Cromise
