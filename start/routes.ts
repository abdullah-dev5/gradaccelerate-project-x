/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/


import ProjectsController from '#controllers/ProjectController'
import NotesController from '#controllers/NoteController'
import TodosController from '#controllers/TodoController'
import LabelsController from '#controllers/LabelController'

import router from '@adonisjs/core/services/router'


// ========================
// Inertia Routes (Frontend)
// ========================
router.get('/', ({ inertia }) => inertia.render('home'))

// ========================
// API Routes (Backend)
// ========================
// Projects (keep existing)
router.get('/projects', [ProjectsController, 'index'])
router.get('/projects/create', [ProjectsController, 'create'])
router.post('/projects', [ProjectsController, 'store'])
router.get('/projects/:id', [ProjectsController, 'show'])
router.get('/projects/:id/edit', [ProjectsController, 'edit'])
router.put('/projects/:id', [ProjectsController, 'update'])
router.patch('/projects/:id/status', [ProjectsController, 'updateStatus'])
router.delete('/projects/:id', [ProjectsController, 'destroy'])

// Notes (expanded)
router.get('/notes', [NotesController, 'index'])
router.post('/notes', [NotesController, 'store'])
router.get('/notes/:id', [NotesController, 'show'])
router.put('/notes/:id', [NotesController, 'update'])
router.delete('/notes/:id', [NotesController, 'destroy'])
router.patch('/notes/:id/pin', [NotesController, 'togglePin'])

// Todos (new)
router.get('/todos/api', [TodosController, 'index']) // API endpoint for todos
router.post('/todos/api', [TodosController, 'store'])
router.get('/todos/api/:id', [TodosController, 'show'])
router.put('/todos/api/:id', [TodosController, 'update'])
router.delete('/todos/api/:id', [TodosController, 'destroy'])

// Labels (new)
router.get('/labels', [LabelsController, 'index'])
router.post('/labels', [LabelsController, 'store'])
router.delete('/labels/:id', [LabelsController, 'destroy'])