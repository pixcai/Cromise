const Cromise = require('./cromise')

const fn = (resolve, reject) => resolve(1)
const then = value => ++value

new Cromise(fn)
	.then(value => {
		console.log('then-1: ', value)
		return then(value)
	}).then(value => {
		console.log('then-2: ', value)
		return then(value)
	}).then(value => {
		console.log('then-3: ', value)
		return then(value)
	}).then(value => {
		console.log('then-before-catch: ', value)
		throw 'oh, no!'
	}).catch(error => {
		console.log(error)
	})

const a = new Cromise(fn)
const b = new Cromise(fn)
const c = new Cromise(fn)
const d = new Cromise(fn)

Cromise.all([a, b]).then(value => {
	console.log('all: ', value)
})

Cromise.race([c, d]).then(value => {
	console.log('race: ', value)
})

Cromise.reject(new Error("fail")).then(() => {
  // not called
}, error => console.log(error))

console.log(Cromise.resolve(1))
