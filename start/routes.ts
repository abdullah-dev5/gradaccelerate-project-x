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
router.get('/notes/gifs/search', '#controllers/note_controller.searchGifs')
router.get('/notes/shared/:token', '#controllers/note_controller.viewSharedNote')

// ========================
// Authentication Routes
// ========================
router.post('/api/auth/login', '#controllers/auth_controller.login')
router.post('/api/auth/register', '#controllers/auth_controller.register')

// ✅ STANDARD: Add web logout route for Inertia requests
router.post('/logout', '#controllers/auth_controller.logout')

// OAuth Routes (Google)
router.get('/auth/google/redirect', '#controllers/auth_controller.googleRedirect')
router.get('/google/callback', '#controllers/auth_controller.googleCallback')

// Debug route (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/oauth/debug', '#controllers/auth_controller.oauthDebug')
  router.get('/oauth/debug-simple', '#controllers/auth_controller.oauthDebugSimple')
  router.get('/oauth/test-credentials', '#controllers/auth_controller.testGoogleCredentials')
  router.get('/oauth/test-redirect', '#controllers/auth_controller.testRedirect')
  router.get('/oauth/test-connectivity', '#controllers/auth_controller.testGoogleConnectivity')
  router.get('/oauth/test-direct-https', '#controllers/auth_controller.testDirectHttps')
  router.get('/oauth/test-ally-config', '#controllers/auth_controller.testAllyConfig')
}

// Health check route
router.get('/oauth/health', '#controllers/auth_controller.oauthHealth')

// Network diagnostic route (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/oauth/network', '#controllers/auth_controller.networkDiagnostic')
}

// OAuth test route (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/oauth/test', '#controllers/auth_controller.oauthTest')
}

// Protected auth routes
router
  .group(() => {
    router.get('/me', '#controllers/auth_controller.me')
    router.post('/logout', '#controllers/auth_controller.logout')
  })
  .prefix('/api/auth')
  .use(middleware.auth({ guards: ['web', 'api'] }))

// ========================
// Protected Web Routes (Inertia Pages)
// ========================
router
  .group(() => {
    router.get('/dashboard', ({ inertia }) => inertia.render('dashboard'))

    // Notes pages (Web/Inertia only)
    router.get('/notes', '#controllers/note_controller.index')
    router.get('/notes/create', ({ inertia }) => inertia.render('notes/create'))
    router.get('/notes/:id', '#controllers/note_controller.show')
    router.get('/notes/:id/edit', '#controllers/note_controller.edit')

    // Projects pages (Web/Inertia only)
    router.get('/projects', '#controllers/project_controller.index')
    router.get('/projects/create', ({ inertia }) => inertia.render('projects/create'))
    router.get('/projects/:id', '#controllers/project_controller.show')
    router.get('/projects/:id/edit', '#controllers/project_controller.edit')

    // Todos pages (Web/Inertia only)
    router.get('/todos', '#controllers/todo_controller.index')
    router.get('/todos/create', ({ inertia }) => inertia.render('todos/create'))
    router.get('/todos/:id', '#controllers/todo_controller.show')
    router.get('/todos/:id/edit', '#controllers/todo_controller.edit')

    // Bookmarks pages (Web/Inertia only)
    router.get('/bookmarks', '#controllers/bookmark_controller.index')
    router.get('/bookmarks/create', '#controllers/bookmark_controller.create')
    router.get('/bookmarks/:id', '#controllers/bookmark_controller.show')
    router.get('/bookmarks/:id/edit', '#controllers/bookmark_controller.edit')
  })
  .use(middleware.auth({ guards: ['web'] }))

// ========================
// API Routes (CRUD Operations)
// ========================

// Notes API routes
router
  .group(() => {
    router.post('/', '#controllers/note_controller.store')
    router.post('/upload-image', '#controllers/note_controller.uploadImage')
    router.put('/:id', '#controllers/note_controller.update')
    router.delete('/:id', '#controllers/note_controller.destroy')
    router.patch('/:id/pin', '#controllers/note_controller.togglePin')
    router.patch('/:id/restore', '#controllers/note_controller.restore')

    // GIF routes
    router.patch('/:id/gif', '#controllers/note_controller.attachGif')
    router.delete('/:id/gif', '#controllers/note_controller.removeGif')

    // Share management
    router.post('/:id/share', '#controllers/note_controller.generateShareLink')
    router.delete('/:id/share', '#controllers/note_controller.revokeShareLink')
    router.get('/:id/share/status', '#controllers/note_controller.getShareStatus')
  })
  .prefix('/notes')
  .use(middleware.auth({ guards: ['web', 'api'] }))

// Projects API routes
router
  .group(() => {
    router.post('/', '#controllers/project_controller.store')
    router.put('/:id', '#controllers/project_controller.update')
    router.patch('/:id/status', '#controllers/project_controller.updateStatus')
    router.delete('/:id', '#controllers/project_controller.destroy')
  })
  .prefix('/projects')
  .use(middleware.auth({ guards: ['web', 'api'] }))

// Todos API routes
router
  .group(() => {
    router.post('/', '#controllers/todo_controller.store')
    router.put('/:id', '#controllers/todo_controller.update')
    router.patch('/:id/complete', '#controllers/todo_controller.toggleStatus')
    router.patch('/:id/workflow-status', '#controllers/todo_controller.updatePriorityStatus')
    router.delete('/:id', '#controllers/todo_controller.destroy')
  })
  .prefix('/todos')
  .use(middleware.auth({ guards: ['web', 'api'] }))

// Bookmarks API routes
router
  .group(() => {
    router.post('/', '#controllers/bookmark_controller.store')
    router.post('/validate-url', '#controllers/bookmark_controller.validateUrl')
    router.put('/:id', '#controllers/bookmark_controller.update')
    router.delete('/:id', '#controllers/bookmark_controller.destroy')
    router.patch('/:id/favorite', '#controllers/bookmark_controller.toggleFavorite')
    router.patch('/:id/archive', '#controllers/bookmark_controller.archive')
    router.post('/:id/summary', '#controllers/bookmark_controller.generateSummary')
    router.post('/:id/labels', '#controllers/bookmark_controller.regenerateLabels')
  })
  .prefix('/bookmarks')
  .use(middleware.auth({ guards: ['web', 'api'] }))

// Labels API routes
router
  .group(() => {
    router.get('/', '#controllers/label_controller.index')
  })
  .prefix('/api/labels')
  .use(middleware.auth({ guards: ['web', 'api'] }))

// ========================
// API v1 Routes (New Development)
// ========================

// API v1 Auth routes
router
  .group(() => {
    router.post('/login', '#controllers/auth_controller.login')
    router.post('/register', '#controllers/auth_controller.register')
    // OAuth routes moved to main section to avoid conflicts
  })
  .prefix('/api/v1/auth')

// API v1 Protected routes
router
  .group(() => {
    router.get('/me', '#controllers/auth_controller.me')
    router.post('/logout', '#controllers/auth_controller.logout')

    // Notes API - Remove duplicate routes to avoid conflicts
    router.get('/notes', '#controllers/note_controller.index')
    router.post('/notes', '#controllers/note_controller.store')
    router.put('/notes/:id', '#controllers/note_controller.update')
    router.delete('/notes/:id', '#controllers/note_controller.destroy')
    router.patch('/notes/:id/pin', '#controllers/note_controller.togglePin')
    router.patch('/notes/:id/restore', '#controllers/note_controller.restore')
    router.post('/notes/:id/image', '#controllers/note_controller.uploadImage')
    router.patch('/notes/:id/gif', '#controllers/note_controller.attachGif')
    router.delete('/notes/:id/gif', '#controllers/note_controller.removeGif')
    router.post('/notes/:id/share', '#controllers/note_controller.generateShareLink')
    router.delete('/notes/:id/share', '#controllers/note_controller.revokeShareLink')
    router.get('/notes/:id/share/status', '#controllers/note_controller.getShareStatus')

    // Projects API (CRUD Operations)
    router.get('/projects', '#controllers/project_controller.index')
    router.post('/projects', '#controllers/project_controller.store')
    router.put('/projects/:id', '#controllers/project_controller.update')
    router.patch('/projects/:id/status', '#controllers/project_controller.updateStatus')
    router.delete('/projects/:id', '#controllers/project_controller.destroy')

    // Todos API
    router.get('/todos', '#controllers/todo_controller.index')
    router.post('/todos', '#controllers/todo_controller.store')
    router.get('/todos/:id', '#controllers/todo_controller.show')
    router.put('/todos/:id', '#controllers/todo_controller.update')
    router.patch('/todos/:id/complete', '#controllers/todo_controller.toggleStatus')
    router.patch('/todos/:id/workflow-status', '#controllers/todo_controller.updatePriorityStatus')
    router.delete('/todos/:id', '#controllers/todo_controller.destroy')

    // Bookmarks API (CRUD Operations)
    router.get('/bookmarks', '#controllers/bookmark_controller.apiIndex')
    router.post('/bookmarks', '#controllers/bookmark_controller.store')
    router.get('/bookmarks/:id', '#controllers/bookmark_controller.show')
    router.put('/bookmarks/:id', '#controllers/bookmark_controller.update')
    router.delete('/bookmarks/:id', '#controllers/bookmark_controller.destroy')
    router.patch('/bookmarks/:id/favorite', '#controllers/bookmark_controller.toggleFavorite')
    router.patch('/bookmarks/:id/archive', '#controllers/bookmark_controller.archive')
    router.post('/bookmarks/:id/summary', '#controllers/bookmark_controller.generateSummary')
    router.post('/bookmarks/:id/labels', '#controllers/bookmark_controller.regenerateLabels')
  })
  .prefix('/api/v1')
  .use(middleware.auth({ guards: ['web', 'api'] }))

// API v1 Admin routes
router
  .group(() => {
    router.get('/dashboard', '#controllers/admin_controller.dashboard')
    router.get('/users', '#controllers/admin_controller.getUsers')
    router.get('/roles', '#controllers/admin_controller.getRoles')
    router.get('/permissions', '#controllers/admin_controller.getPermissions')
    router.post('/users/:userId/roles', '#controllers/admin_controller.assignRole')
    router.delete('/users/:userId/roles/:roleId', '#controllers/admin_controller.removeRole')
  })
  .prefix('/api/v1/admin')
  .use(middleware.auth({ guards: ['api'] }))
