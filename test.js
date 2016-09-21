const Cromise = require('./cromise')

const fn = (resolve, reject) => resolve(1)
const then = value => ++value

console.log('Cromise:')

new Cromise(fn)
	.then(value => {
		console.log('then-1: ', value)
		return then(value)
	}).then(value => {
		console.log('then-2: ', value)
		return then(value)
	}).then(value => {
		console.log('then-catch: ', value)
		throw 'oh, no!'
	}).catch(error => {
		console.log(error)
	})

const a = new Cromise(fn).then(value => {
	console.log('then-a: ', value)
	return then(value)
})
const b = new Cromise(fn).then(value => {
	console.log('then-b: ', value)
	return then(value)
})
const c = new Cromise(fn).then(value => {
	console.log('then-c: ', value)
	return then(value)
})
const d = new Cromise(fn).then(value => {
	console.log('then-d: ', value)
	return then(value)
})

Cromise.all([a, b]).then(value => {
	console.log('all: ', value)
})

Cromise.race([c, d]).then(value => {
	console.log('race: ', value)
})

Cromise.reject(new Error("fail")).then(() => {
  // not called
}, error => console.log(error))
