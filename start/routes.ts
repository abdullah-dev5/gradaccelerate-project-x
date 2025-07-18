// start/routes.ts
import router from '@adonisjs/core/services/router'

import LabelsController from '#controllers/LabelController'
import NotesController from '#controllers/NoteController'
import TodosController from '#controllers/TodoController'
import ProjectsController from '#controllers/ProjectController'

// Middleware
const authMiddleware = () => import('#middleware/auth_middleware')

// ========================
// Inertia Route (Frontend)
// ========================
router.get('/', ({ inertia }) => inertia.render('home'))

// ========================
// API Routes
// ========================

// Public route to view shared note
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
//.use(authMiddleware)

// 🔹 Projects Routes (enabled)
router
  .group(() => {
    router.get('/', [ProjectsController, 'index'])
    router.get('/create', [ProjectsController, 'create'])
    router.post('/', [ProjectsController, 'store'])
    router.get('/:id', [ProjectsController, 'show'])
    router.get('/:id/edit', [ProjectsController, 'edit'])
    router.put('/:id', [ProjectsController, 'update'])
    router.patch('/:id/status', [ProjectsController, 'updateStatus'])
    router.delete('/:id', [ProjectsController, 'destroy'])
  })
  .prefix('/projects')
// .use(authMiddleware) // 🔒 Uncomment when auth is ready

// 🔹 Todos Routes
router
  .group(() => {
    router.get('/', [TodosController, 'index'])
    router.post('/', [TodosController, 'store'])
    router.get('/:id', [TodosController, 'show'])
    router.put('/:id', [TodosController, 'update'])
    router.delete('/:id', [TodosController, 'destroy'])
  })
  .prefix('/todos')
// .use(authMiddleware) // 🔒 Temporarily skipped

// 🔹 Labels Routes
router
  .group(() => {
    router.get('/', [LabelsController, 'index'])
    router.post('/', [LabelsController, 'store'])
    router.delete('/:id', [LabelsController, 'destroy'])
  })
  .prefix('/labels')
// .use(authMiddleware) // 🔒 Uncomment when auth is ready
