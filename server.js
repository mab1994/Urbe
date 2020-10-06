const express = require('express')
const connectToDB = require('./Config/database')

const app = express()

// connect to database
connectToDB()

// initiate middleware
app.use(express.json({ extended: false }))

// define routes
app.use('/api/users', require('./Routes/users'))
app.use('/api/auth', require('./Routes/auth'))
app.use('/api/locations', require('./Routes/locations'))
app.use('/api/petitions', require('./Routes/petitions'))
app.use('/api/projects', require('./Routes/projects'))
app.use('/api/profile', require('./Routes/profile'))

const Port = process.env.Port || 5000
app.listen(Port, console.log(`Server run on port ${Port}...`))
