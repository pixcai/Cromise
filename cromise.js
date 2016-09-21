/* A promise is in one of three different states:
 * pending - The initial state of a promise.
 * fulfilled - The state of a promise representing a successful operation.
 * rejected - The state of a promise representing a failed operation.
 */
const PENDING = Symbol('pending')
const REJECTED = Symbol('rejected')
const FULFILLED = Symbol('fulfilled')

function __fulfill(value) {
  this._state = FULFILLED
  this._value = value
}

function __reject(reason) {
  this._state = REJECTED
  this._value = reason
}

/* Transition to either the fulfilled or rejected state. */
function __transition(cromise, state, value) {
  const handlers = cromise._handlers

  if (state === FULFILLED) {
    while (handlers.length) {
      handlers.shift().fulfill(cromise._value)
    }
    __fulfill.call(cromise, value)
  }
  if (state === REJECTED) {
    while (handlers.length) {
      handlers.shift().reject(cromise._value)
    }
    __reject.call(cromise, value)
  }
}

const isObject = o => o && typeof o === 'object'
const isFunction = f => typeof f === 'function'

function __resolve(cromise) {
  try {
    if (cromise instanceof Cromise) {
      __transition(
        this,
        cromise._state, cromise._value
      )
    }
    if (isObject(cromise) || isFunction(cromise)) {
      if (isFunction(cromise.then)) {
        cromise.then(value => {
          __transition(
            this,
            FULFILLED, value
          )
        }, reason => {
          __transition(
            this,
            REJECTED, reason
          )
        })
      }
    } else {
      __transition(
        this,
        FULFILLED, cromise
      )
    }
  } catch (error) {
    __transition(
      this,
      REJECTED, error
    )
  }
}

class Cromise {
  constructor(fn) {
    /* store value or error once FULFILLED or REJECTED */
    this._value = undefined
      /* store state which can be PENDING, FULFILLED or REJECTED */
    this._state = PENDING
      /* store handlers for PENDING state */
    this._handlers = []

    if (isFunction(fn)) {
      fn(__resolve.bind(this), __reject.bind(this))
    }
  }

  /* Returns a Promise that waits for all promises in the iterable to be fulfilled and is then fulfilled with an array of those resulting values (in the same order as the input). */
  static all(iterable) {
    return new Cromise(function(resolve, reject) {
      iterable.reduce((initial, cromise) => {
        return Cromise.resolve(initial).then(result => {
          Cromise.resolve(cromise).then(value => result.push(value), reason => result.push(reason))
        })
      }, []).then(resolve, reject)
    })
  }

  /* Returns a promise that resolves or rejects as soon as any of the promises in iterable have been resolved or rejected (with the corresponding reason or value). */
  static race(iterable) {
    return new Cromise(function(resolve, reject) {
      iterable.forEach(cromise => {
        Cromise.resolve(cromise).then(resolve, reject)
      })
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
   * If the value is a promise, then it is unwrapped so that the resulting promise adopts the state of the promise passed in as value. This is useful for converting promises created by other libraries.
   */
  static resolve(value) {
    const cromise = new Cromise()

    __resolve.call(cromise, value)
    return cromise
  }

  /* Equivalent to calling Promise.prototype.then(undefined, onRejected) */
  catch (onRejected) {
    return this.then(undefined, onRejected)
  }

  /* Calls onFulfilled or onRejected with the fulfillment value or rejection reason of the promise (as appropriate).
   *
   * Unlike Promise.prototype.then it does not return a Promise. It will also throw any errors that occur in the next tick, so they are not silenced. In node.js they will then crash your process (so it can be restarted in a clean state). In browsers, this will cause the error to be properly logged.
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

  /* Some promise libraries implement a (non-standard) .finally method. It takes a function, which it calls whenever the promise is fulfilled or rejected. */
  finally(onResolved) {
    return this.then(value => onResolved(value), reason => onResolved(reason))
  }

  /* Calls onFulfilled or onRejected with the fulfillment value or rejection reason of the promise (as appropriate) and returns a new promise resolving to the return value of the called handler.
   *
   * If the handler throws an error, the returned Promise will be rejected with that error.
   *
   * If the onFulfilled handler is not a function, it defaults to the identify function (i.e. function (value) { return value; }).
   * 
   * If the onRejected handler is not a function, it defaults to a function that always throws (i.e. function (reason) { throw reason; }).
   */
  then(onFulfilled, onRejected) {
    return new Cromise((resolve, reject) => {
      if (this._state === PENDING) {
        this._handlers.push({
          fulfill: isFunction(onFulfilled) ? onFulfilled : value => value,
          reject: isFunction(onRejected) ? onRejected : reason => { throw reason }
        })
        return
      }
      if (this._state === FULFILLED) {
        __transition(this, FULFILLED, resolve(onFulfilled(this._value)))
      }
      if (this._state === REJECTED) {
        __transition(this, REJECTED, reject(onRejected(this._value)))
      }
    })
  }
}

module.exports = Cromise
