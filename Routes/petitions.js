const express = require('express')
const Router = express.Router()
const { check, validationResult } = require('express-validator')

const Auth = require('../Middleware/auth')
const User = require('../Models/User')
const Petition = require('../Models/Petition')

// Route: POST { api/petitions } // Desc: Add New Petition // Access: Private
Router.post('/', [Auth, [
  check('subject', 'Champs Réquis! Veuillez indiquer le sujet de la pétition').not().isEmpty(),
  check('categories', 'Champs Réquis! Indiquez au moins une catégorie qu\'on peut labelliser la pétition').not().isEmpty(),
  check('content', 'Champs Réquis! Veuillez rédiger la pétition').not().isEmpty()
]], async (req, res) => {
  const Errors = validationResult(req)
  if (!Errors.isEmpty()) {
    return res.status(400).json({ Errors: Errors.array() })
  }

  const { subject, categories, content } = req.body
  const ptFields = {}
  ptFields.user = req.user.id
  if (subject) ptFields.subject = subject
  if (content) ptFields.content = content
  if (categories) {
    ptFields.categories = categories.split('\n').map(ctgr => ctgr.trim())
  }

  try {
    var petition = await Petition.findOne({ user: req.user.id })

    if (petition) {
      petition = await Petition.findOneAndUpdate({ user: req.user.id }, { $set: ptFields }, { new: true })
      res.json(petition)
    }

    petition = new Petition(ptFields)
    await petition.save()
    res.json(petition)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Problème du serveur!...')
  }
})

// Route: GET { api/petitions } // Desc: Get All Petitions // Access: Public
Router.get('/', async (req, res) => {
  try {
    const petitions = await Petition.find().sort({ writtenAt: -1 })
    res.json(petitions)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Problème du serveur!...')
  }
})

// Route: GET { api/petitions/:id } // Desc: Get Petition By ID // Access: Public
Router.get('/:id', async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id)

    if (!petition) {
      return res.status(400).json({ msg: 'Petition Non Trouvable!...' })
    }

    res.json(petition)
  } catch (er) {
    console.error(er.message)

    if (er.kind === 'ObjectId') {
      res.status(400).json({ msg: 'Petition Non Trouvable!...' })
    }

    res.status(500).send('Problème du serveur!...')
  }
})

// Route: GET { api/petitions/:userId } // Desc: Get Petition By User ID // Access: Public
Router.get('/:userId', async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.userId).populate('user', ['firstname', 'lastName', 'avatar'])

    if (!petition) {
      return res.status(400).json({ msg: 'Petition Non Trouvable!...' })
    }

    res.json(petition)
  } catch (er) {
    console.error(er.message)

    if (er.kind === 'ObjectId') {
      res.status(400).json({ msg: 'Petition Non Trouvable!...' })
    }

    res.status(500).send('Problème du serveur!...')
  }
})

// Route: DELETE { api/petitions/:id } // Desc: Delete Petition // Access: Private
Router.delete('/:id', Auth, async (req, res) => {
  try {
    const petition = await Petition.findByIdAndDelete(req.params.id)

    if (!petition) {
      res.status(400).json({ msg: 'Petition Non Trouvable!...' })
    }

    if (petition.user.toString() !== req.user.id) {
      res.status(401).json({ msg: 'Vous n\'êtes pas autorisé à faire cette action!...' })
    }

    await petition.remove()
    res.json({ msg: 'Pétition Supprimée!...' })
  } catch (er) {
    console.error(er.message)

    if (er.kind === 'ObjectId') {
      res.status(400).json({ msg: 'Petition Non Trouvable!...' })
    }

    res.status(500).send('Problème du serveur!...')
  }
})

// Route: PUT { api/petitions/support/:id } // Desc: Add Support To Petition // Access: Private
Router.put('/support/:id', Auth, async (req, res) => {
  try {
    var user = await User.findById(req.user.id).select('-password')
    var petition = await Petition.findById(req.params.id)

    // check if petition has been supported
    if (petition.supports.filter(sup => sup.user.toString() === req.user.id).length > 0) {
      return res.status(400).json({ msg: 'Petition déja supportée!...' })
    }

    const support = {
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      user: req.user.id
    }

    petition.supports.unshift(support)

    await petition.save()
    res.json(petition.supports)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Problème du serveur!...')
  }
})

// Route: PUT { api/petitions/unsupport/:id } // Desc: Add Support To Petition // Access: Private
Router.put('/unsupport/:id', Auth, async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id)

    // check if petition has been supported
    if (petition.supports.filter(sup => sup.user.toString() === req.user.id).length === 0) {
      return res.status(400).json({ msg: 'Petition pas encore supportée!...' })
    }

    const removeIndex = petition.supports.map(sup => sup.user.toString()).indexOf(req.user.id)
    petition.supports.splice(removeIndex, 1)

    await petition.save()
    res.json(petition.supports)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Problème du serveur!...')
  }
})

// Route: POST { api/petitions/comment/:id } // Desc: Add Comment // Access: Private
Router.post('/comment/:id', [Auth, [
  check('text', 'Contenu Vide!...').not().isEmpty()
]], async (req, res) => {
  const Errors = validationResult(req)
  if (!Errors.isEmpty()) {
    return res.status(400).json({ Errors: Errors.array() })
  }

  try {
    const user = await User.findById(req.user.id).select('-password')
    const petition = await Petition.findById(req.params.id)

    const comment = {
      text: req.body.text,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      user: req.user.id
    }

    petition.comments.unshift(comment)

    await petition.save()
    res.json(petition.comments)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Problème du serveur!...')
  }
})

// Route: DELETE { api/petitions/comment/:ptId/:ctId } // Desc: Remove Comment // Access: Private
Router.delete('/comment/:id/:cId', Auth, async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id)

    // extract comment
    const comment = petition.comments.find(ct => ct.id === req.params.cId)

    // check if comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'Commentaire non-existant!...' })
    }

    // check if user matches
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Vous n\'êtes pas autorisés!...' })
    }

    const removeIndex = petition.comments.map(ct => ct.user.toString()).indexOf(req.user.id)
    petition.comments.splice(removeIndex, 1)

    await petition.save()
    res.json(petition.comments)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Problème du serveur!...')
  }
})

module.exports = Router
