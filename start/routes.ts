/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

const NotesController = () => import('#controllers/notes_controller')
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import NotesControllers from '#controllers/NoteController'
// ========================
// Inertia Routes (Frontend)
// ========================
router.get('/', ({ inertia }) => inertia.render('home'))
router.get('/login', ({ inertia }) => inertia.render('auth/login'))
router.get('/register', ({ inertia }) => inertia.render('auth/register'))
router.get('/dashboard', ({ inertia }) => inertia.render('dashboard'))



// ========================
// Public API Routes
// ========================
import WeatherController from '#controllers/weathers_controller'
router.get('/weather', [WeatherController, 'get'])

// ========================
// Authentication API Routes
// ========================

router.post('/api/auth/login', '#controllers/AuthController.login')
router.post('/api/auth/register', '#controllers/AuthController.register')

// OAuth Routes
router.get('/auth/google/redirect', '#controllers/AuthController.googleRedirect')
router.get('/google/callback', '#controllers/AuthController.googleCallback')

// Protected auth routes (require API token)
router.group(() => {
  router.get('/me', '#controllers/AuthController.me')
  router.post('/logout', '#controllers/AuthController.logout')
}).prefix('/api/auth').use(middleware.auth({ guards: ['api'] }))

// Admin routes (require admin role)
router.group(() => {
  router.get('/dashboard', '#controllers/AdminController.dashboard')
  router.get('/users', '#controllers/AdminController.getUsers')
  router.get('/roles', '#controllers/AdminController.getRoles')
  router.get('/permissions', '#controllers/AdminController.getPermissions')
  router.post('/users/:userId/roles', '#controllers/AdminController.assignRole')
  router.delete('/users/:userId/roles/:roleId', '#controllers/AdminController.removeRole')
}).prefix('/api/admin').use(middleware.auth({ guards: ['api'] }))

// ========================
// Combined Routes (Frontend + API) - Protected
// ========================

// Notes Routes (Protected)
router
  .group(() => {
    router.get('/', '#controllers/NoteController.index')
    router.post('/', '#controllers/NoteController.store')
    router.post('/upload-image', '#controllers/NoteController.uploadImage')
    router.get('/:note_id', '#controllers/NoteController.show')
    router.get('/:note_id/edit', '#controllers/NoteController.edit')
    router.put('/:note_id/edit', '#controllers/NoteController.update')
    router.delete('/:note_id', '#controllers/NoteController.destroy')
    router.patch('/:note_id/toggle-pin', '#controllers/NoteController.togglePin')
    router.patch('/:note_id/restore', '#controllers/NoteController.restore')

    router.patch('/notes/:id/gif', '#controllers/NoteController.attachGif')
    router.get('/notes/:id/gifs/search', [NotesControllers, 'searchGifs'])
    router.delete('/notes/:id/gif', '#controllers/NoteController.removeGif')

    // Share management routes (protected)
    router.post('/:note_id/share', '#controllers/NoteController.generateShareLink')
    router.delete('/:note_id/share', '#controllers/NoteController.revokeShareLink')
    router.get('/:note_id/share/status', '#controllers/NoteController.getShareStatus')
  })
  .prefix('/notes')
  .use(middleware.auth({ guards: ['web', 'api'] }))

// Public shared notes route (no authentication required)
router.get('/notes/gifs/search', [NotesControllers, 'searchGifs'])
router.get('/notes/shared/:token', '#controllers/NoteController.viewSharedNote')
// Projects Routes (Protected)
router
  .group(() => {
    router.get('/', '#controllers/ProjectController.index')
    router.get('/create', '#controllers/ProjectController.create')
    router.post('/', '#controllers/ProjectController.store')
    router.get('/:id', '#controllers/ProjectController.show')
    router.get('/:id/edit', '#controllers/ProjectController.edit')
    router.put('/:id', '#controllers/ProjectController.update')
    router.patch('/:id/status', '#controllers/ProjectController.updateStatus')
    router.delete('/:id', '#controllers/ProjectController.destroy')
  })
  .prefix('/projects')
  .use(middleware.auth({ guards: ['web', 'api'] }))

// Todos Routes (Protected)
router
  .group(() => {
    router.get('/', '#controllers/TodoController.index')
    router.post('/', '#controllers/TodoController.store')
    router.get('/:id', '#controllers/TodoController.show')
    router.put('/:id', '#controllers/TodoController.update')
    router.patch('/:id/toggle-status', '#controllers/TodoController.toggleStatus')
    router.delete('/:id', '#controllers/TodoController.destroy')
  })
  .prefix('/todos')
  .use(middleware.auth({ guards: ['web', 'api'] }))

// Labels Routes (Protected)
router
  .group(() => {
    router.get('/', '#controllers/LabelController.index')
    router.post('/', '#controllers/LabelController.store')
    router.delete('/:id', '#controllers/LabelController.destroy')
  })
  .prefix('/labels')
  .use(middleware.auth({ guards: ['web', 'api'] }))
