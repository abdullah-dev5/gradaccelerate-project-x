import Project from '#models/project'
import { HttpContext } from '@adonisjs/core/http'
import { projectValidator } from '#validators/projects/project'
import { projectStatusValidator } from '#validators/projects/project_status'

export default class ProjectsController {
  // Alias method for backward compatibility - redirect to index
  async indexPage(context: HttpContext) {
    return this.index(context);
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
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      const page = request.input('page', 1);
      const status = request.input('status');
      const search = request.input('search');

      const query = Project.query()
        .where('userId', user.id) // Filter by authenticated user
        .orderBy('createdAt', 'desc')
        .if(status, (query) => query.where('status', status))
        .if(search, (query) =>
          query.where((builder) => {
            builder
              .where('title', 'ILIKE', `%${search}%`)
              .orWhere('description', 'ILIKE', `%${search}%`)
          })
        );

      const projects = await query.paginate(page, 10);

      // Explicitly structure the response for Inertia
      return inertia.render('projects/index', {
        projects: {
          data: projects.all(),
          meta: {
            total: projects.total,
            per_page: projects.perPage,
            current_page: projects.currentPage,
            last_page: projects.lastPage,
            first_page: 1,
            first_page_url: null, // Can be generated if needed
            last_page_url: null,  // Can be generated if needed
            next_page_url: projects.getNextPageUrl(),
            previous_page_url: projects.getPreviousPageUrl()
          }
        },
        filters: { status, search }
      });
    } catch (error) {
      // Handle authentication errors properly for Inertia requests
      if (error.message.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
        return response.redirect('/login')
      }
      // For other errors, render with empty data and error message
      return inertia.render('projects/index', {
        projects: { data: [], meta: { total: 0, per_page: 10, current_page: 1, last_page: 1, first_page: 1 } },
        filters: { status: null, search: null },
        error: 'Failed to fetch projects'
      });
    }
  }
  /**
   * Show project creation form
   */
  async create({ inertia, auth }: HttpContext) {
    await auth.authenticate() // Authenticate first
    auth.getUserOrFail() // Ensure user is authenticated
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
        userId: user.id // Set the authenticated user as owner
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
  async show({ params, inertia, auth }: HttpContext) {
    await auth.authenticate() // Authenticate first
    const user = auth.getUserOrFail()
    const project = await Project.query()
      .where('id', params.id)
      .where('userId', user.id) // Ensure user owns the project
      .firstOrFail()

    return inertia.render('projects/show', { project })
  }

  /**
   * Show project edit form
   */
  async edit({ params, inertia, auth }: HttpContext) {
    await auth.authenticate() // Authenticate first
    const user = auth.getUserOrFail()
    const project = await Project.query()
      .where('id', params.id)
      .where('userId', user.id) // Ensure user owns the project
      .firstOrFail()

    const statusOptions = ['pending', 'in_progress', 'completed']
    return inertia.render('projects/edit', { project, statusOptions })
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
