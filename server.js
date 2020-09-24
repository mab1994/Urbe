const express = require('express')

const app = express()

const Port = process.env.Port || 5000
app.listen(Port, console.log(`Server run on port ${Port}...`))
