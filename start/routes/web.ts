// start/routes/web.ts
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// ========================
// Web Routes (Inertia Pages)
// ========================

// Public routes
router.get('/', ({ inertia }) => inertia.render('home'))
router.get('/login', ({ inertia }) => inertia.render('auth/login'))
router.get('/register', ({ inertia }) => inertia.render('auth/register'))

// Protected web routes (require authentication)
router.group(() => {
  router.get('/dashboard', ({ inertia }) => inertia.render('dashboard'))
  
  // Notes pages (Inertia renders only)
  router.get('/notes', '#controllers/NoteController.index')
  router.get('/notes/create', ({ inertia }) => inertia.render('notes/create'))
  router.get('/notes/:id', '#controllers/NoteController.show')
  router.get('/notes/:id/edit', '#controllers/NoteController.edit')
  
  // Projects pages (Inertia renders only)
  router.get('/projects', '#controllers/ProjectController.index')
  router.get('/projects/create', ({ inertia }) => inertia.render('projects/create'))
  router.get('/projects/:id', '#controllers/ProjectController.show')
  router.get('/projects/:id/edit', '#controllers/ProjectController.edit')
  
  // Todos pages (Inertia renders only)
  router.get('/todos', '#controllers/TodoController.index')
  router.get('/todos/create', ({ inertia }) => inertia.render('todos/create'))
  router.get('/todos/:id', '#controllers/TodoController.show')
  router.get('/todos/:id/edit', '#controllers/TodoController.edit')
  
}).use(middleware.auth({ guards: ['web'] }))
