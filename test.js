const Cromise = require('./cromise')

const fn = (resolve, reject) => {
	const value = 1

	console.log('input: ', value)
	resolve(value);
}
const then = value => {
	console.log('then: ', value)
	return ++value
}

console.log('Cromise:')
new Cromise(fn).then(then).then(then)

console.log('Promise:')
new Promise(fn).then(then).then(then)
