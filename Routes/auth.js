const express = require('express')
const Router = express.Router()
const { check, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const JWT = require('jsonwebtoken')
const config = require('config')
const nodemailer = require('nodemailer')
const crypto = require('crypto')

const Auth = require('../Middleware/auth')

const User = require('../Models/User')

// Route: GET { api/auth } // Desc: Get The Logged-In User // Access: Private
Router.get('/', Auth, async (req, res) => {
  try {
    const user = User.findById(req.user.id).select('-password')
    res.json(user)
  } catch (er) {
    console.error(er.message)
    res.status(500).status('Problème du Serveur!...')
  }
})

// Route: POST { api/auth } // Desc: Authenticate User // Access: Public
Router.post('/', [
  check('email', 'Champ réquis! Veuillez indiquer votre adresse électronique (email)').not().isEmpty(),
  check('password', 'Champ réquis! Veuillez indiquer votre mot de passe').exists()
], async (req, res) => {
  const Errors = validationResult(req)
  if (!Errors.isEmpty()) {
    return res.status(400).json({ Errors: Errors.array() })
  }

  const { email, password } = req.body

  try {
    var user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ Errors: [{ msg: 'Identifiants non valides! Veuillez vérifier vos entrées ou bien s\'enregistrer' }] })
    }

    const isIdentical = await bcrypt.compare(password, user.password)
    if (!isIdentical) {
      return res.status(400).json({ Errors: [{ msg: 'Identifiants non valides! Veuillez vérifier vos entrées ou bien s\'enregistrer' }] })
    }

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

// Route: POST { api/auth/reset } // Desc: Send Reset Password Email // Access: Public
Router.post('/reset', async (req, res, next) => {
  var { email, resetPasswordToken, tokenExpires } = req.body

  try {
    var user = await User.findOne({ email, resetPasswordToken, tokenExpires })
    if (!user) {
      return res.status(400).json({ Errors: [{ msg: 'Adresse non valide! Veuillez vérifier votre entrée' }] })
    }

    const pToken = crypto.randomBytes(20).toString('hex')

    user.resetPasswordToken = pToken
    user.tokenExpires = Date.now() + 3600000

    await user.save()
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Server Error! cannot assign new password')
  }

  try {
    const smtpTransport = nodemailer.createTransport('SMTP', {
      service: 'SendGrid',
      auth: {
        user: 'SENDGRID USERNAME',
        pass: 'SENDGRID PASSWORD'
      }
    })

    const mailOptions = {
      to: user.email,
      from: 'urbe.help-center@gmail.com',
      subject: 'Réinitialiser votre mot de passe',
      text: 'Bienvenue cher ' + user.firstname + ',\n\n' +
      ' Nous avons appri que vous avez perdu votre mot de passe. \n' +
      'Mais c\'est pas grave, vous pouvez réinitialiser un autre tout en laissant vos autres données et activités intactes et sécurisés.\n' +
      ' Il suffit de cliquer le lien ci-dessous: \n\n ' +
      'http://' + req.headers.host + '/reset/' + user.resetPasswordToken + '\n\n' +
      'Veuillez connaître que ce lien n\'est valable q\'une heure après l\'envoi de cet email'
    }

    await smtpTransport.sendMail(mailOptions)
    next()
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Server Error! cannot send mail')
  }
})

// Route: GET { api/auth/confirm/:p_token } // Desc: Get Password Token // Access: Public
Router.get('/confirm/:p_token', async (req, res) => {
  try {
    const user = await User.findOne({ resetPasswordToken: req.params.p_token, tokenExpires: { $gt: Date.now() } })
    if (!user) {
      return res.status(400).json({ Errors: [{ msg: 'Invalid or Expired Token!...' }] })
    }

    res.send(req.user)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Server Error! cannot send mail')
  }
})

// Route: POST { api/auth/confirm/:p_token } // Desc: Confirm Password Reset // Access: Public
Router.post('/confirm/:p_token', async (req, res) => {
  var { password } = req.body

  try {
    var user = await User.findOne({ resetPasswordToken: req.params.p_token, tokenExpires: { $gt: Date.now() } })
    if (!user) {
      return res.status(400).json({ Errors: [{ msg: 'Invalid or Expired Token!...' }] })
    }

    user.password = await password
    user.resetPasswordToken = undefined
    user.tokenExpires = undefined

    await user.save()
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Server Error! cannot assign new password')
  }

  try {
    const smtpTransport = nodemailer.createTransport('SMTP', {
      service: 'SendGrid',
      auth: {
        user: 'SENDGRID USERNAME',
        pass: 'SENDGRID PASSWORD'
      }
    })

    const mailOptions = {
      to: user.email,
      from: 'urbe.help-center@gmail.com',
      subject: 'Mot de passe changé avec succès',
      text: 'Bienvenue encore une fois, \n\n' +
      'Veuillez connaître que le mot de passe associé à' + user.email + 'a été réinitialisé avec succès \n\n' +
      'A très bientôt.'
    }

    await smtpTransport.sendMail(mailOptions)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Server Error! cannot send mail')
  }
})

module.exports = Router
