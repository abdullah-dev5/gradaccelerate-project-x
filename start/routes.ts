// start/routes.ts
import router from '@adonisjs/core/services/router'

import LabelsController from '#controllers/LabelController'

// Controllers
import NotesController from '#controllers/NoteController'

import TodosController from '#controllers/TodoController'

// Middleware
const authMiddleware = () => import('#middleware/auth_middleware')

// ========================
// Inertia Route (Frontend)
// ========================
router.get('/', ({ inertia }) => inertia.render('home'))

// ========================
// API Routes
// ========================

// Public route to view shared note (TODO: implement viewSharedNote method)
router.get('/notes/shared/:uuid', [NotesController, 'viewSharedNote'])

// Auth-protected notes routes
router
  .group(() => {
    router.get('/', [NotesController, 'index'])
    router.post('/', [NotesController, 'store'])
    router.post('/upload', [NotesController, 'uploadImage'])

    router.get('/:note_id', [NotesController, 'show'])
    router.put('/:note_id', [NotesController, 'update'])
    router.delete('/:note_id', [NotesController, 'destroy'])
    router.patch('/:note_id/pin', [NotesController, 'togglePin'])
    router.patch('/:note_id/restore', [NotesController, 'restore'])
    router.post('/:note_id/share', [NotesController, 'generateShareLink'])
  })
  .prefix('/notes')
  .use(authMiddleware) // 🔐 protect all notes-related routes

// ========== Modules Below Will Be Enabled Later ==========

// 🔹 Projects
/*
import ProjectsController from '#controllers/ProjectController'
import { projectIdValidator } from '#validators/projects/project_id_validator'

router.group(() => {
  router.get('/', [ProjectsController, 'index'])
  router.get('/create', [ProjectsController, 'create'])
  router.post('/', [ProjectsController, 'store'])

  router.get('/:id', [ProjectsController, 'show']).use(projectIdValidator)
  router.get('/:id/edit', [ProjectsController, 'edit']).use(projectIdValidator)
  router.put('/:id', [ProjectsController, 'update']).use(projectIdValidator)
  router.patch('/:id/status', [ProjectsController, 'updateStatus']).use(projectIdValidator)
  router.delete('/:id', [ProjectsController, 'destroy']).use(projectIdValidator)
}).prefix('/projects')
*/

// 🔹 Todos

// Enable Todos Routes
router
  .group(() => {
    router.get('/', [TodosController, 'index'])         // GET /todos
    router.post('/', [TodosController, 'store'])        // POST /todos
    router.get('/:id', [TodosController, 'show'])       // GET /todos/:id
    router.put('/:id', [TodosController, 'update'])     // PUT /todos/:id
    router.delete('/:id', [TodosController, 'destroy']) // DELETE /todos/:id
  })
  .prefix('/todos')
  .use(authMiddleware)

// 🔹 Labels
router
  .group(() => {
    router.get('/', [LabelsController, 'index'])
    router.post('/', [LabelsController, 'store'])
    router.delete('/:id', [LabelsController, 'destroy'])
  })
  .prefix('/labels')
  .use(authMiddleware)
