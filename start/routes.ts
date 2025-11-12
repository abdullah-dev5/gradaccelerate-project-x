/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

const ProjectsController = () => import('#controllers/ProjectController')
const NotesController = () => import('#controllers/NoteController')
import router from '@adonisjs/core/services/router'

// Home and todos routes (keep existing)
router.get('/', ({ inertia }) => inertia.render('home'))
router.get('/todos', ({ inertia }) => inertia.render('todos/empty'))

// Projects routes (added all CRUD operations)
router.get('/projects', [ProjectsController, 'index'])
router.get('/projects/create', [ProjectsController, 'create'])
router.post('/projects', [ProjectsController, 'store'])
router.get('/projects/:id', [ProjectsController, 'show'])
router.get('/projects/:id/edit', [ProjectsController, 'edit'])
router.put('/projects/:id', [ProjectsController, 'update'])
router.patch('/projects/:id/status', [ProjectsController, 'updateStatus'])
router.delete('/projects/:id', [ProjectsController, 'destroy'])

// Notes routes (expanded from existing)
router.get('/notes', [NotesController, 'index'])
router.post('/notes', [NotesController, 'store'])
router.get('/notes/:id', [NotesController, 'show']) // Added show route
router.put('/notes/:id', [NotesController, 'update'])
router.delete('/notes/:id', [NotesController, 'destroy'])
router.patch('/notes/:id/pin', [NotesController, 'togglePin']) // Added pin toggle