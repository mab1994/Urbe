const JWT = require('jsonwebtoken')
const config = require('config')

module.exports = function (req, res, next) {
  // get token from header
  const token = req.header('x-auth-token')

  // check if token does not exist
  if (!token) {
    return res.status(401).json({ msg: 'No Token found! Access denied' })
  }

  // verify token
  try {
    const codeOff = JWT.verify(token, config.get('jwtSecret'))
    req.user = codeOff.user
    next()
  } catch (er) {
    res.status(401).json({ msg: 'Invalid Token!...' })
  }
}
