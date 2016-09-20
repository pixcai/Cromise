const Cromise = require('./cromise')

const c = new Cromise((resolve, reject) => {
	const value = 1

	console.log('input: ', value)
	resolve(value);
	console.log('input after')
})

c.then(value => {
	console.log('output: ', value)
})

const b = Cromise.resolve(1)
console.log(b)
