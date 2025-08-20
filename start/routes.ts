// start/routes.ts
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// NOTE: Removing imports to prevent duplicates
// import './routes/api.js'  // REMOVED - causes duplicates
// import './routes/web.js'  // REMOVED - causes duplicates

// ========================
// Public Routes
// ========================
router.get('/', ({ inertia }) => inertia.render('home'))
router.get('/login', ({ inertia }) => inertia.render('auth/login'))
router.get('/register', ({ inertia }) => inertia.render('auth/register'))

// Public API routes
router.get('/weather', '#controllers/weathers_controller.get')
router.get('/notes/gifs/search', '#controllers/NoteController.searchGifs')
router.get('/notes/shared/:token', '#controllers/NoteController.viewSharedNote')

// ========================
// Authentication Routes
// ========================
router.post('/api/auth/login', '#controllers/AuthController.login')
router.post('/api/auth/register', '#controllers/AuthController.register')

// ✅ STANDARD: Add web logout route for Inertia requests
router.post('/logout', '#controllers/AuthController.logout')

// OAuth Routes (Google)
router.get('/auth/google/redirect', '#controllers/AuthController.googleRedirect')
router.get('/google/callback', '#controllers/AuthController.googleCallback')

// Debug route (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/oauth/debug', '#controllers/AuthController.oauthDebug')
  router.get('/oauth/debug-simple', '#controllers/AuthController.oauthDebugSimple')
  router.get('/oauth/test-credentials', '#controllers/AuthController.testGoogleCredentials')
  router.get('/oauth/test-redirect', '#controllers/AuthController.testRedirect')
  router.get('/oauth/test-connectivity', '#controllers/AuthController.testGoogleConnectivity')
  router.get('/oauth/test-direct-https', '#controllers/AuthController.testDirectHttps')
  router.get('/oauth/test-ally-config', '#controllers/AuthController.testAllyConfig')
}

// Health check route
router.get('/oauth/health', '#controllers/AuthController.oauthHealth')

// Network diagnostic route (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/oauth/network', '#controllers/AuthController.networkDiagnostic')
}

// OAuth test route (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/oauth/test', '#controllers/AuthController.oauthTest')
}

// Protected auth routes
router.group(() => {
  router.get('/me', '#controllers/AuthController.me')
  router.post('/logout', '#controllers/AuthController.logout')
}).prefix('/api/auth').use(middleware.auth({ guards: ['web', 'api'] }))

// ========================
// Protected Web Routes (Inertia Pages)
// ========================
router.group(() => {
  router.get('/dashboard', ({ inertia }) => inertia.render('dashboard'))
  
  // Notes pages (Web/Inertia only)
  router.get('/notes', '#controllers/NoteController.index')
  router.get('/notes/create', ({ inertia }) => inertia.render('notes/create'))
  router.get('/notes/:id', '#controllers/NoteController.show')
  router.get('/notes/:id/edit', '#controllers/NoteController.edit')
  
  // Projects pages (Web/Inertia only)
  router.get('/projects', '#controllers/ProjectController.index')
  router.get('/projects/create', ({ inertia }) => inertia.render('projects/create'))
  router.get('/projects/:id', '#controllers/ProjectController.show')
  router.get('/projects/:id/edit', '#controllers/ProjectController.edit')
  
  // Todos pages (Web/Inertia only)
  router.get('/todos', '#controllers/TodoController.index')
  router.get('/todos/create', ({ inertia }) => inertia.render('todos/create'))
  router.get('/todos/:id', '#controllers/TodoController.show')
  router.get('/todos/:id/edit', '#controllers/TodoController.edit')
  
}).use(middleware.auth({ guards: ['web'] }))

// ========================
// API Routes (CRUD Operations)
// ========================

// Notes API routes
router.group(() => {
  router.post('/', '#controllers/NoteController.store')
  router.post('/upload-image', '#controllers/NoteController.uploadImage')
  router.put('/:note_id/edit', '#controllers/NoteController.update')
  router.delete('/:note_id', '#controllers/NoteController.destroy')
  router.patch('/:note_id/toggle-pin', '#controllers/NoteController.togglePin')
  router.patch('/:note_id/restore', '#controllers/NoteController.restore')
  
  // GIF routes
  router.patch('/:note_id/gif', '#controllers/NoteController.attachGif')
  router.delete('/:note_id/gif', '#controllers/NoteController.removeGif')
  
  // Share management
  router.post('/:note_id/share', '#controllers/NoteController.generateShareLink')
  router.delete('/:note_id/share', '#controllers/NoteController.revokeShareLink')
  router.get('/:note_id/share/status', '#controllers/NoteController.getShareStatus')
}).prefix('/notes').use(middleware.auth({ guards: ['web', 'api'] }))

// Projects API routes
router.group(() => {
  router.post('/', '#controllers/ProjectController.store')
  router.put('/:id', '#controllers/ProjectController.update')
  router.patch('/:id/status', '#controllers/ProjectController.updateStatus')
  router.delete('/:id', '#controllers/ProjectController.destroy')
}).prefix('/projects').use(middleware.auth({ guards: ['web', 'api'] }))

// Todos API routes
router.group(() => {
  router.post('/', '#controllers/TodoController.store')
  router.put('/:id', '#controllers/TodoController.update')
  router.patch('/:id/toggle-status', '#controllers/TodoController.toggleStatus')
  router.delete('/:id', '#controllers/TodoController.destroy')
}).prefix('/todos').use(middleware.auth({ guards: ['web', 'api'] }))

// ========================
// API v1 Routes (New Development)
// ========================

// API v1 Auth routes
router.group(() => {
  router.post('/login', '#controllers/AuthController.login')
  router.post('/register', '#controllers/AuthController.register')
  // OAuth routes moved to main section to avoid conflicts
}).prefix('/api/v1/auth')

// API v1 Protected routes
router.group(() => {
  router.get('/me', '#controllers/AuthController.me')
  router.post('/logout', '#controllers/AuthController.logout')
  
  // Notes API
  router.get('/notes', '#controllers/NoteController.index')
  router.post('/notes', '#controllers/NoteController.store')
  router.put('/notes/:id', '#controllers/NoteController.update')
  router.delete('/notes/:id', '#controllers/NoteController.destroy')
  router.patch('/notes/:id/pin', '#controllers/NoteController.togglePin')
  router.patch('/notes/:id/restore', '#controllers/NoteController.restore')
  router.post('/notes/:id/image', '#controllers/NoteController.uploadImage')
  router.patch('/notes/:id/gif', '#controllers/NoteController.attachGif')
  router.delete('/notes/:id/gif', '#controllers/NoteController.removeGif')
  router.post('/notes/:id/share', '#controllers/NoteController.generateShareLink')
  router.delete('/notes/:id/share', '#controllers/NoteController.revokeShareLink')
  router.get('/notes/:id/share/status', '#controllers/NoteController.getShareStatus')
  
  // Projects API (CRUD Operations)
  router.post('/projects', '#controllers/ProjectController.store')
  router.put('/projects/:id', '#controllers/ProjectController.update')
  router.patch('/projects/:id/status', '#controllers/ProjectController.updateStatus')
  router.delete('/projects/:id', '#controllers/ProjectController.destroy')
  
  // Todos API
  router.get('/todos', '#controllers/TodoController.index')
  router.post('/todos', '#controllers/TodoController.store')
  router.get('/todos/:id', '#controllers/TodoController.show')
  router.put('/todos/:id', '#controllers/TodoController.update')
  router.patch('/todos/:id/status', '#controllers/TodoController.toggleStatus')
  router.delete('/todos/:id', '#controllers/TodoController.destroy')
  
}).prefix('/api/v1').use(middleware.auth({ guards: ['web', 'api'] }))

// API v1 Admin routes
router.group(() => {
  router.get('/dashboard', '#controllers/AdminController.dashboard')
  router.get('/users', '#controllers/AdminController.getUsers')
  router.get('/roles', '#controllers/AdminController.getRoles')
  router.get('/permissions', '#controllers/AdminController.getPermissions')
  router.post('/users/:userId/roles', '#controllers/AdminController.assignRole')
  router.delete('/users/:userId/roles/:roleId', '#controllers/AdminController.removeRole')
}).prefix('/api/v1/admin').use(middleware.auth({ guards: ['api'] }))

