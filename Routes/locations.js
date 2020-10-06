const express = require('express')
const Router = express.Router()

// Route: GET { api/locations } // Desc: Testing Location Routes // Access: Public
Router.get('/', (req, res) => res.send('Location Route...'))

module.exports = Router
