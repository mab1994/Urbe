const express = require('express')
const { check, validationResult } = require('express-validator')
const Router = express.Router()

const Auth = require('../Middleware/auth')

const Profile = require('../Models/Profile')
const User = require('../Models/User')

// Route: GET { api/profile/me } // Desc: Get Current Profile Of The Logged-In User // Access: Private
Router.get('/me', Auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['firstName', 'lastName', 'email', 'avatar'])

    if (!profile) {
      return res.status(400).json({ msg: 'No Profile found!...' })
    }

    res.json(profile)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Problème du serveur!...')
  }
})

// Route: GET { api/profile } // Desc: Get All Profiles // Access: Public
Router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['firstName', 'lastName', 'email', 'avatar'])
    res.json(profiles)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Problème du serveur!...')
  }
})

// Route: GET { api/profile/user/:user_id } // Desc: Get Profiles By User ID // Access: Public
Router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['firstName', 'lastName', 'email', 'avatar'])

    if (!profile) {
      return res.status(400).json({ msg: 'No Profile found!...' })
    }

    res.json(profile)
  } catch (er) {
    console.error(er.message)

    if (er.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'No Profile found!...' })
    }

    res.status(500).send('Problème du serveur!...')
  }
})

// Route: POST { api/profile } // Desc: Create|Update Profile // Access: Private
Router.post('/', [Auth, [
  check('birthdate', 'Veuillez indiquer votre date de naissance!').isDate().not().isEmpty(),
  check('job', 'Veuillez indiquer votre profession actuelle!').not().isEmpty(),
  check('lastDegree', 'Veuillez indiquer le dernier diplôme obtenu!').not().isEmpty(),
  check('lastInstitute', 'Veuillez indiquer le dernier établissement secondaire/supérieur/de formation professionelle!').not().isEmpty()
]], async (req, res) => {
  const Errors = validationResult(req)
  if (!Errors.isEmpty()) {
    return res.status(400).json({ Errors: Errors.array() })
  }

  const { birthdate, bio, adress, job, jobLocation, jobGovernorate, jobCity, skills, lastDegree, lastInstitute } = req.body

  const fields = {}
  fields.user = req.user.id
  if (birthdate) fields.birthdate = birthdate
  if (bio) fields.bio = bio
  if (adress) fields.adress = adress
  if (job) fields.job = job
  if (jobLocation) fields.jobLocation = jobLocation
  if (jobGovernorate) fields.jobGovernorate = jobGovernorate
  if (jobCity) fields.jobCity = jobCity
  if (lastDegree) fields.lastDegree = lastDegree
  if (lastInstitute) fields.lastInstitute = lastInstitute
  if (skills) {
    fields.skills = skills.split(',').map(s => s.trim())
  }

  try {
    let profile = await Profile.findOne({ user: req.user.id })

    // if profile exists --> update it
    if (profile) {
      profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: fields }, { new: true })
      res.json(profile)
    }

    // else, if profile doesn't exist --> create new one
    profile = new Profile(fields)
    await profile.save()
    res.json(profile)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Problème du serveur!...')
  }
})

// Route: DELETE { api/profile } // Desc: Delete Profile & User // Access: Private
Router.delete('/', Auth, async (req, res) => {
  try {
    // delete profile
    await Profile.findOneAndDelete({ user: req.user.id })

    // delete user
    await User.findOneAndDelete({ _id: req.user.id })

    res.json({ msg: 'Utilisateur Supprimé!...' })
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Problème du serveur!...')
  }
})

// Route: PUT { api/profile/curriculum } // Desc: Add Profile Curriculum // Access: Private
Router.put('/curriculum', [Auth, [
  check('year', 'Champs réquis! Veuillez indiquer l\'année de l\'obtention de votre diplôme').isLength({ min: 4, max: 4 }).isNumeric().not().isEmpty(),
  check('title', 'Champs réquis! Veuillez indiquer le titre de votre diplôme').not().isEmpty(),
  check('institute', 'Champs réquis! Veuillez indiquer le nom de l\'établissement supérieur/de formation professionelle').not().isEmpty()
]], async (req, res) => {
  const Errors = validationResult(req)
  if (!Errors.isEmpty()) {
    return res.status(400).json({ Errors: Errors.array() })
  }

  const { year, title, institute } = req.body
  const degree = {
    year,
    title,
    institute
  }

  try {
    const profile = await Profile.findOne({ user: req.user.id })
    profile.curriculum.unshift(degree)

    await profile.save()

    res.json(profile)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Problème du serveur!...')
  }
})

// Route: PUT { api/profile/curriculum/:curr_id } // Desc: Delete Curriculum // Access: Private
Router.put('/curriculum/:curr_id', Auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id })

    // get remove index
    const removeIndex = profile.curriculum.map(it => it.id).indexOf(req.params.curr_id)

    profile.curriculum.splice(removeIndex, 1)
    await profile.save()

    res.json(profile)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Problème du serveur!...')
  }
})

module.exports = Router
