const express = require('express')
const Router = express.Router()
const { check, validationResult } = require('express-validator')
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const JWT = require('jsonwebtoken')
const config = require('config')

const User = require('../Models/User')

// Route: POST { api/users } // Desc: SignUp New User // Access: Public
Router.post('/', [
  check('firstName', 'Champ réquis! Veuillez indiquer votre prénom').not().isEmpty(),
  check('lastName', 'Champ réquis! Veuillez indiquer votre nom de famille').not().isEmpty(),
  check('email', 'Champ réquis! Veuillez indiquer votre adresse électronique (email)').not().isEmpty(),
  check('email', 'Votre adresse email doit être du format: \'adresse@site.com\'').isEmail(),
  check('password', 'Champ réquis! Veuillez poser un mot de passe ( minimum 8 caractères de longueur et ne contient pas de caractères spéciaux )').not().isEmpty().isLength({ min: 8 }).isAlphanumeric()
], async (req, res) => {
  const Errors = validationResult(req)
  if (!Errors.isEmpty()) {
    return res.status(400).json({ Errors: Errors.array() })
  }

  const { firstName, lastName, email, password } = req.body

  try {
    let user = await User.findOne({ email })
    if (user) {
      return res.status(400).json({ Errors: [{ msg: 'Il existe déja un utilisateur avec ces identifiants! Veuillez vérifier vos entrées ou bien se connecter' }] })
    }

    const avatar = gravatar.url(email, {
      s: '200',
      r: 'pg',
      d: 'mm'
    })

    user = new User({
      firstName,
      lastName,
      email,
      password,
      avatar
    })

    const Salt = await bcrypt.genSalt(12)
    user.password = await bcrypt.hash(password, Salt)

    await user.save()

    const payload = {
      user: {
        id: user.id
      }
    }

    JWT.sign(
      payload,
      config.get('jwtSecret'),
      {
        expiresIn: 7200000
      },
      (er, token) => {
        if (er) throw er
        res.json({ token })
      }
    )
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Server Error!')
  }
})

module.exports = Router
