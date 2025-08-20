// start/routes/api.ts
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// ========================
// API v1 Routes
// ========================

// Authentication API Routes
router.group(() => {
  router.post('/login', '#controllers/AuthController.login')
  router.post('/register', '#controllers/AuthController.register')
  
  // OAuth Routes
  router.get('/google/redirect', '#controllers/AuthController.googleRedirect')
  router.get('/google/callback', '#controllers/AuthController.googleCallback')
  
}).prefix('/api/v1/auth')

// Protected API Routes (require authentication)
router.group(() => {
  // Auth management
  router.get('/me', '#controllers/AuthController.me')
  router.post('/logout', '#controllers/AuthController.logout')
  
  // Notes API (CRUD operations)
  router.get('/notes', '#controllers/NoteController.index')
  router.post('/notes', '#controllers/NoteController.store')
  router.get('/notes/:id', '#controllers/NoteController.show')
  router.put('/notes/:id', '#controllers/NoteController.update')
  router.delete('/notes/:id', '#controllers/NoteController.destroy')
  router.patch('/notes/:id/pin', '#controllers/NoteController.togglePin')
  router.patch('/notes/:id/restore', '#controllers/NoteController.restore')
  router.post('/notes/:id/image', '#controllers/NoteController.uploadImage')
  router.patch('/notes/:id/gif', '#controllers/NoteController.attachGif')
  router.delete('/notes/:id/gif', '#controllers/NoteController.removeGif')
  
  // Share management API
  router.post('/notes/:id/share', '#controllers/NoteController.generateShareLink')
  router.delete('/notes/:id/share', '#controllers/NoteController.revokeShareLink')
  router.get('/notes/:id/share/status', '#controllers/NoteController.getShareStatus')
  
  // Projects API (CRUD operations)
  router.get('/projects', '#controllers/ProjectController.index')
  router.post('/projects', '#controllers/ProjectController.store')
  router.get('/projects/:id', '#controllers/ProjectController.show')
  router.put('/projects/:id', '#controllers/ProjectController.update')
  router.patch('/projects/:id/status', '#controllers/ProjectController.updateStatus')
  router.delete('/projects/:id', '#controllers/ProjectController.destroy')
  
  // Todos API (CRUD operations)
  router.get('/todos', '#controllers/TodoController.index')
  router.post('/todos', '#controllers/TodoController.store')
  router.get('/todos/:id', '#controllers/TodoController.show')
  router.put('/todos/:id', '#controllers/TodoController.update')
  router.patch('/todos/:id/status', '#controllers/TodoController.toggleStatus')
  router.delete('/todos/:id', '#controllers/TodoController.destroy')
  
}).prefix('/api/v1').use(middleware.auth({ guards: ['web', 'api'] }))

// Admin API Routes (require admin role)
router.group(() => {
  router.get('/dashboard', '#controllers/AdminController.dashboard')
  router.get('/users', '#controllers/AdminController.getUsers')
  router.get('/roles', '#controllers/AdminController.getRoles')
  router.get('/permissions', '#controllers/AdminController.getPermissions')
  router.post('/users/:userId/roles', '#controllers/AdminController.assignRole')
  router.delete('/users/:userId/roles/:roleId', '#controllers/AdminController.removeRole')
  
}).prefix('/api/v1/admin').use(middleware.auth({ guards: ['api'] }))
