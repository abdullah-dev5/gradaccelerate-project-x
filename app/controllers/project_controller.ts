import Project from '#models/project'
import { HttpContext } from '@adonisjs/core/http'
import { projectValidator } from '#validators/projects/project'
import { projectStatusValidator } from '#validators/projects/project_status'

export default class ProjectsController {
  // Alias method for backward compatibility - redirect to index
  async indexPage(context: HttpContext) {
    return this.index(context)
  }

  /**
   * List all projects with pagination
   */
  // async index({ inertia, request }: HttpContext) {
  //   const page = request.input('page', 1)
  //   const status = request.input('status')
  //   const search = request.input('search')

  //   const query = Project.query().orderBy('createdAt', 'desc')

  //   if (status) {
  //     query.where('status', status)
  //   }

  //   if (search) {
  //     query.where((builder) => {
  //       builder
  //         .where('title', 'ILIKE', `%${search}%`)
  //         .orWhere('description', 'ILIKE', `%${search}%`)
  //     })
  //   }

  //   const projects = await query.paginate(page, 10)

  //   return inertia.render('projects/index', {
  //     projects, // Let Inertia handle serialization
  //     filters: { status, search },
  //   })
  // }

  async index({ inertia, request, auth, response }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()
      const page = request.input('page', 1)
      const status = request.input('status')
      const search = request.input('search')

      const query = Project.query()
        .where('userId', user.id)
        .orderBy('createdAt', 'desc')
        .if(status, (statusQuery) => statusQuery.where('status', status))
        .if(search, (searchQuery) =>
          searchQuery.where((builder) => {
            builder
              .where('title', 'ILIKE', `%${search}%`)
              .orWhere('description', 'ILIKE', `%${search}%`)
          })
        )

      const projects = await query.paginate(page, 10)
      
      // Debug: Log project data
      const projectData = projects.all()
      console.log('Projects fetched:', {
        total: projects.total,
        currentPage: projects.currentPage,
        projects: projectData.map(p => ({
          id: p.id,
          title: p.title,
          userId: p.userId,
          hasUserId: p.userId !== undefined,
          serialized: p.serialize()
        }))
      })

      if (
        request.header('x-inertia') === 'true' ||
        request.header('accept')?.includes('text/html')
      ) {
        return inertia.render('projects/index', {
          projects: {
            data: projectData.map(p => p.serialize()),
            meta: {
              total: projects.total,
              per_page: projects.perPage,
              current_page: projects.currentPage,
              last_page: projects.lastPage,
              first_page: 1,
              first_page_url: null,
              last_page_url: null,
              next_page_url: projects.getNextPageUrl(),
              previous_page_url: projects.getPreviousPageUrl(),
            },
          },
          filters: { status, search },
        })
      }
      // API/JSON response
      return response.ok({
        projects: projectData.map(p => p.serialize()),
        meta: {
          total: projects.total,
          per_page: projects.perPage,
          current_page: projects.currentPage,
          last_page: projects.lastPage,
        },
        filters: { status, search },
      })
    } catch (error) {
      if (
        request.header('x-inertia') === 'true' ||
        request.header('accept')?.includes('text/html')
      ) {
        if (error.message.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
          return response.redirect('/login')
        }
        return inertia.render('projects/index', {
          projects: {
            data: [],
            meta: { total: 0, per_page: 10, current_page: 1, last_page: 1, first_page: 1, first_page_url: null, last_page_url: null, next_page_url: null, previous_page_url: null },
          },
          filters: { status: null, search: null },
          error: 'Failed to fetch projects',
        })
      }
      return response.status(500).json({
        message: 'Failed to fetch projects',
        error: error.message,
      })
    }
  }
  /**
   * Show project creation form
   */
  async create({ inertia, auth }: HttpContext) {
    await auth.authenticate()
    auth.getUserOrFail()
    const statusOptions = ['pending', 'in_progress', 'completed']
    return inertia.render('projects/create', { statusOptions })
  }

  /**
   * Store new project
   */
  async store({ request, response, session, auth }: HttpContext) {
    try {
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      const payload = await request.validateUsing(projectValidator)

      await Project.create({
        ...payload,
        userId: user.id, // Set the authenticated user as owner
      })

      session.flash('success', 'Project created successfully!')
      return response.redirect('/projects')
    } catch (error) {
      session.flash('error', 'Failed to create project!')
      return response.redirect().back()
    }
  }

  /**
   * Show single project
   */
  async show({ params, inertia, auth, request, response }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()
      const projectId = params.id

      // Find project by ID and ensure user has access
      const project = await Project.query()
        .where('id', projectId)
        .where('userId', user.id)
        .firstOrFail()

      // Check if it's an Inertia request (web page)
      const isInertiaRequest = request.header('x-inertia') === 'true'
      const acceptsHtml = request.header('accept')?.includes('text/html')

      if (isInertiaRequest || acceptsHtml) {
        const serializedProject = project.serialize()
        console.log('Rendering project show page:', {
          projectId: project.id,
          serializedProject,
          hasUserId: serializedProject.userId !== undefined
        })
        return inertia.render('projects/Show', { project: serializedProject })
      }

      // API/JSON response
      return response.ok({ project: project.serialize() })
    } catch (error) {
      const isInertiaRequest = request.header('x-inertia') === 'true'
      const acceptsHtml = request.header('accept')?.includes('text/html')

      if (isInertiaRequest || acceptsHtml) {
        if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
          return inertia.render('errors/unauthorized', {
            message: 'You need to be authenticated to view this project.',
            redirectUrl: '/login',
          })
        }
        return inertia.render('errors/not_found', {
          error: error.message || 'Project not found',
          message: 'This project may have been deleted or you do not have permission to view it.',
        })
      }

      if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
        return response.unauthorized({ message: 'Unauthorized', error: error.message })
      }
      return response.status(404).send({ message: 'Project not found', error: error.message })
    }
  }

  /**
   * Show project edit form
   */
  async edit({ params, inertia, auth, request, response }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()
      const projectId = params.id
      const project = await Project.query()
        .where('id', projectId)
        .where('userId', user.id)
        .firstOrFail()

      const statusOptions = ['pending', 'in_progress', 'completed']

      // Check if it's an Inertia request (web page)
      const isInertiaRequest = request.header('x-inertia') === 'true'
      const acceptsHtml = request.header('accept')?.includes('text/html')

      if (isInertiaRequest || acceptsHtml) {
        const serializedProject = project.serialize()
        console.log('Rendering project edit page:', {
          projectId: project.id,
          serializedProject,
          hasUserId: serializedProject.userId !== undefined
        })
        return inertia.render('projects/edit', { project: serializedProject, statusOptions })
      }

      // API/JSON response
      return response.ok({ project: project.serialize(), statusOptions })
    } catch (error) {
      const isInertiaRequest = request.header('x-inertia') === 'true'
      const acceptsHtml = request.header('accept')?.includes('text/html')

      if (isInertiaRequest || acceptsHtml) {
        if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
          return inertia.render('errors/unauthorized', {
            message: 'You need to be authenticated to edit this project.',
            redirectUrl: '/login',
          })
        }
        return inertia.render('errors/not_found', {
          error: error.message || 'Project not found',
          message: 'This project may have been deleted or you do not have permission to edit it.',
        })
      }

      if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
        return response.unauthorized({ message: 'Unauthorized', error: error.message })
      }
      return response.status(404).send({ message: 'Project not found', error: error.message })
    }
  }

  /**
   * Update project
   */
  async update({ params, request, response, session, auth }: HttpContext) {
    try {
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      const project = await Project.query()
        .where('id', params.id)
        .where('userId', user.id) // Ensure user owns the project
        .firstOrFail()

      const payload = await request.validateUsing(projectValidator)

      project.merge(payload)
      await project.save()

      session.flash('success', 'Project updated successfully!')
      return response.redirect('/projects')
    } catch (error) {
      session.flash('error', 'Failed to update project!')
      return response.redirect().back()
    }
  }

  /**
   * Delete project
   */
  async destroy({ params, response, session, auth }: HttpContext) {
    try {
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      const project = await Project.query()
        .where('id', params.id)
        .where('userId', user.id) // Ensure user owns the project
        .firstOrFail()

      await project.delete()

      session.flash('success', 'Project deleted successfully!')
      return response.redirect('/projects')
    } catch (error) {
      session.flash('error', 'Failed to delete project!')
      return response.redirect().back()
    }
  }

  /**
   * Update project status
   */
  async updateStatus({ params, request, response, session, auth }: HttpContext) {
    try {
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      const project = await Project.query()
        .where('id', params.id)
        .where('userId', user.id) // Ensure user owns the project
        .firstOrFail()

      const { status } = await request.validateUsing(projectStatusValidator)

      project.status = status
      await project.save()

      session.flash('success', 'Project status updated successfully!')
      return response.redirect().back()
    } catch (error) {
      session.flash('error', 'Failed to update project status!')
      return response.redirect().back()
    }
  }
}
