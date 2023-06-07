const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')
require('dotenv').config()

const errorHandler = (error, request, response, next) => {
	console.error(error.message)
  
	if (error.name === 'CastError') {
	  	return response.status(400).send({ error: 'malformatted id' })
	} else if (error.name === 'ValidationError') {
		return response.status(400).json({ error: error.message })
	}
	next(error)
}
  
const unknownEndpoint = (request, response) => {
	response.status(404).send({ error: 'unknown endpoint' })
}

app.use(express.static('build'))
app.use(express.json())
app.use(morgan('tiny'))
app.use(cors())

morgan.token('postToken', (req, res) => JSON.stringify(req.body))

const Person = require('./models/person')

app.use(
	morgan(':method :url :status :res[content-length] - :response-time ms :postToken',{
		skip: (req) => req.method !== 'POST',
	})
)


app.get('/api/persons', (req, res) => {
	Person.find({}).then(persons => {
		res.json(persons)
	})
})

app.get('/api/persons/:id', (req, res, next) => {
	Person.findById(req.params.id).then(person => {
		if (person) {
			res.json(person)
		} else {
			res.status(404).end()
		}
	}).catch(error => next(error))	
})

app.get('/info', (req,res) => {
	const date = new Date()
	console.log('Date', date)
	Person.find({}).then(persons => {
		res.send(`<p>Phonebook has info for ${persons.length} people</p> <p>${date}</p>`)
	})
})

app.delete('/api/persons/:id', (req, res, next) => {
  	Person.findByIdAndRemove(req.params.id).then(() => {
		res.status(204).end()
	})
	.catch(error => next(error))
})

app.post('/api/persons', (req, res, next) => {
	const body = req.body

	if (!body.name || !body.number) {
		return res.status(400).json({
			error: 'name or number missing'
		})
	}
	Person.find({}).then(persons => {
		const randId = Math.floor(Math.random()*2000)

		const person = new Person({
			id: randId,
			name: body.name,
			number: body.number
		})
		person.save().then(savedPerson => {
			res.json(savedPerson)
		})
		.catch(error => next(error))		
	})
})

app.put('/api/persons/:id', (req, res, next) => {
	const body = req.body

	const person = {
		name: body.name,
		number: body.number,
	}
	Person.findByIdAndUpdate(req.params.id, person, {new: true}).then(updatedPerson => {
		res.json(updatedPerson)
	}).catch(error => next(error))
})

app.use(unknownEndpoint)
app.use(errorHandler)


const PORT = process.env.PORT
app.listen(PORT, () => {
  	console.log(`Server running on port ${PORT}`)
})