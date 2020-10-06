const express = require('express')
const Router = express.Router()
const { check, validationResult } = require('express-validator')

const Auth = require('../Middleware/auth')
// const User = require('../Models/User')
const Project = require('../Models/Project')

// Route: POST { api/projects } // Desc: Add New Project // Access: Private
Router.post('/', [Auth, [
  check('title', 'Champs réquis! Veuillez indiquer le titre de votre projet').not().isEmpty(),
  check('sdgs', 'Veuillez sélectionner au moins un objectif de développement durable').not().isEmpty(),
  check('overview', 'Champs réquis! Veuillez décrire brièvement l\'objectif, le démarche et le cible de votre projet').not().isEmpty(),
  check('start', 'Champs réquis! Veuillez indiquer la date de déclenchement de votre projet').isDate().not().isEmpty(),
  check('end', 'Champs réquis! Veuillez indiquer la date prévisionnelle de clôture de votre projet').isDate().not().isEmpty()
]], async (req, res) => {
  const Errors = validationResult(req)
  if (!Errors.isEmpty()) {
    return res.status(400).json({ Errors: Errors.array() })
  }

  const { title, sdgs, overview, start, end } = req.body
  const prFields = {}

  prFields.user = req.user.id
  if (title) prFields.title = title
  if (overview) prFields.overview = overview
  if (start) prFields.start = start
  if (end) prFields.end = end
  if (sdgs) {
    prFields.sdgs = sdgs.split('\n').map(sdg => sdg.trim())
  }

  try {
    var project = await Project.findOne({ user: req.user.id })

    if (project) {
      project = await Project.findOneAndUpdate({ user: req.user.id }, { $set: prFields }, { new: true })
      res.json(project)
    }

    project = new Project(prFields)
    await project.save()
    res.json(project)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Problème du serveur!...')
  }
})

// Route: GET { api/projects } // Desc: Get All Projectss // Access: Public
Router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 })
    res.json(projects)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Problème du serveur!...')
  }
})

// Route: GET { api/projects/:id } // Desc: Get Project By ID // Access: Public
Router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(400).json({ msg: 'Projet Non Trouvable!...' })
    }

    res.json(project)
  } catch (er) {
    console.error(er.message)

    if (er.kind === 'ObjectId') {
      res.status(400).json({ msg: 'Projet Non Trouvable!...' })
    }

    res.status(500).send('Problème du serveur!...')
  }
})

// Route: GET { api/projects/:userId } // Desc: Get Project By User ID // Access: Public
Router.get('/:userId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.userId).populate('user', ['firstname', 'lastName', 'avatar'])

    if (!project) {
      return res.status(400).json({ msg: 'Projet Non Trouvable!...' })
    }

    res.json(project)
  } catch (er) {
    console.error(er.message)

    if (er.kind === 'ObjectId') {
      res.status(400).json({ msg: 'Projet Non Trouvable!...' })
    }

    res.status(500).send('Problème du serveur!...')
  }
})

// Route: DELETE { api/projects/:id } // Desc: Delete Project // Access: Private
Router.delete('/:id', Auth, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id)

    if (!project) {
      res.status(400).json({ msg: 'Projet Non Trouvable!...' })
    }

    if (project.user.toString() !== req.user.id) {
      res.status(401).json({ msg: 'Vous n\'êtes pas autorisé à faire cette action!...' })
    }

    await project.remove()
    res.json({ msg: 'Projet Supprimé!...' })
  } catch (er) {
    console.error(er.message)

    if (er.kind === 'ObjectId') {
      res.status(400).json({ msg: 'Projet Non Trouvable!...' })
    }

    res.status(500).send('Problème du serveur!...')
  }
})

// Route: POST { api/projects/tasks/:projectId } // Desc: Create New Task // Access: Private
Router.post('/tasks/:projectId', [Auth, [
  check('title', 'Indiquez le titre de la tâche').not().isEmpty(),
  check('desc', 'Rédigez une description brêve de la tâche').not().isEmpty(),
  check('dateStart', 'Indiquer la date du début de la tâche').isDate().not().isEmpty(),
  check('dateEnd', 'Indiquer la date prévue pour la fin de la tâche').isDate().not().isEmpty()
]], async (req, res) => {
  const Errors = validationResult(req)
  if (!Errors.isEmpty()) {
    return res.status(400).json({ Errors: Errors.array() })
  }

  try {
    const project = await Project.findOne({ user: req.user.id })

    // check if user matches
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Vous n\'êtes pas autorisés!...' })
    }

    const { title, desc, dateStart, dateEnd, isFinished } = req.body

    const task = {
      title,
      desc,
      dateStart,
      dateEnd,
      isFinished
    }

    project.tasks.unshift(task)

    await project.save()
    res.json(project.tasks)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Problème du serveur!...')
  }
})

// Route: DELETE { api/projects/tasks/:projectId/:taskId } // Desc: Remove Task // Access: Private
Router.delete('/tasks/:projectId/:taskId', Auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)

    // extract task
    const task = project.tasks.find(tsk => tsk.id === req.params.taskId)

    // check if the task exists
    if (!task) {
      return res.status(404).json({ msg: 'Tâche non-existante!...' })
    }

    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Vous n\'êtes pas autorisés!...' })
    }

    const removeIndex = project.tasks.map(tsk => tsk.toString()).indexOf(req.user.id)
    project.tasks.splice(removeIndex, 1)

    await project.save()
    res.json(project.tasks)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Problème du serveur!...')
  }
})

// Route: PUT { api/projects/tasks/finish/:projectId/:taskId } // Desc: Finish Task // Access: Private
Router.put('/tasks/finish/:projectId/:taskId', Auth, async (req, res) => {
  try {
    var project = await Project.findById(req.params.projectId)
    var task = project.tasks.find(tsk => tsk.id === req.params.taskId)

    if (!task) {
      return res.status(404).json({ msg: 'Tâche non-existante!...' })
    }

    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Vous n\'êtes pas autorisés!...' })
    }

    var finish = await task.isFinished

    if (finish === true) {
      return res.status(400).json({ msg: 'Tâche déja finie!' })
    }
    var taskProgress = ((task.dateEnd.getTime() - task.dateStart.getTime()) / (project.end.getTime() - project.start.getTime())) * 100

    project = await Project.findOneAndUpdate({ _id: req.params.projectId, 'tasks._id': req.params.taskId }, { $inc: { progress: taskProgress }, $set: { 'tasks.$.isFinished': true } }, { new: true })

    await project.save()
    res.json(project)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Problème du serveur!...')
  }
})

// Route: PUT { api/projects/tasks/unfinish/:projectId/:taskId } // Desc: unfinish Task // Access: Private
Router.put('/tasks/unfinish/:projectId/:taskId', Auth, async (req, res) => {
  try {
    var project = await Project.findById(req.params.projectId)
    var task = project.tasks.find(tsk => tsk.id === req.params.taskId)

    if (!task) {
      return res.status(404).json({ msg: 'Tâche non-existante!...' })
    }

    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Vous n\'êtes pas autorisés!...' })
    }

    var finish = await task.isFinished

    if (finish === false) {
      return res.status(400).json({ msg: 'Tâche pas encore commencée!' })
    }
    var taskProgress = ((task.dateEnd.getTime() - task.dateStart.getTime()) / (project.end.getTime() - project.start.getTime())) * 100

    project = await Project.findOneAndUpdate({ _id: req.params.projectId, 'tasks._id': req.params.taskId }, { $inc: { progress: -taskProgress }, $set: { 'tasks.$.isFinished': false } }, { new: true })

    await project.save()
    res.json(project)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Problème du serveur!...')
  }
})

// Route: POST { api/projects/budget/:projectId } // Desc: Create New Budget // Access: Private
Router.post('/budget/:projectId', [Auth, [
  check('tool', 'Précisez l\'outil à acheter!').not().isEmpty(),
  check('isAvailable', 'Indiquez s\'il est disponible!...').not().isEmpty()
]], async (req, res) => {
  const Errors = validationResult(req)
  if (!Errors.isEmpty()) {
    return res.status(400).json({ Errors: Errors.array() })
  }

  try {
    var project = await Project.findOne({ user: req.user.id })

    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Vous n\'êtes pas autorisés!...' })
    }

    const { tool, price, quantity, isAvailable } = req.body

    // create budget element
    const element = {
      tool,
      quantity,
      price,
      isAvailable
    }
    // calculate unitary budget of one tool by multiplying price with quantity
    const elBudget = element.price * element.quantity

    // add elBudget to the total budget of the Project
    project = await Project.findOneAndUpdate({ _id: req.params.projectId }, { $inc: { totalBudget: elBudget } }, { new: true })

    // push into the budget table
    await project.budget.unshift(element)

    await project.save()
    res.json(project)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Problème du serveur!...')
  }
})

// Route: DELETE { api/projects/budget/:projectId/:elementId } // Desc: Remove Budget Element // Access: Private
Router.delete('/budget/:projectId/:elementId', Auth, async (req, res) => {
  try {
    var project = await Project.findById(req.params.projectId)

    // extract budget element
    const element = project.budget.find(el => el.id === req.params.elementId)

    // check if the element exists
    if (!element) {
      return res.status(404).json({ msg: 'Element non-existant!...' })
    }

    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Vous n\'êtes pas autorisés!...' })
    }

    const removeIndex = project.budget.map(el => el.toString()).indexOf(req.user.id)

    const elBudget = element.price * element.quantity

    // substract the elementary budget from the total budget
    project = await Project.findOneAndUpdate({ _id: req.params.projectId }, { $inc: { totalBudget: -elBudget } }, { new: true })

    // remove from budget table
    project.budget.splice(removeIndex, 1)

    await project.save()
    res.json(project)
  } catch (er) {
    console.error(er.message)
    res.status(500).send('Problème du serveur!...')
  }
})

module.exports = Router
