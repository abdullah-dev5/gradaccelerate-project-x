import Project from '#models/project'
import { HttpContext } from '@adonisjs/core/http'
import { projectValidator } from '#validators/projects/project'
import { projectStatusValidator } from '#validators/projects/project_status'

export default class ProjectsController {
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

  async index({ inertia, request }: HttpContext) {
    const page = request.input('page', 1);
    const status = request.input('status');
    const search = request.input('search');

    const query = Project.query()
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
  }
  /**
   * Show project creation form
   */
  async create({ inertia /*, auth */ }: HttpContext) {
    // const user = auth.user
    const statusOptions = ['pending', 'in_progress', 'completed']
    return inertia.render('projects/create', { statusOptions })
  }

  /**
   * Store new project
   */
  async store({ request, response, session /*, auth */ }: HttpContext) {
    try {
      const payload = await request.validateUsing(projectValidator)

      // payload.userId = auth.user?.id!

      await Project.create(payload)

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
  async show({ params, inertia /*, auth */ }: HttpContext) {
    const project = await Project.findOrFail(params.id)

    // if (project.userId !== auth.user?.id) {
    //   return response.unauthorized('Unauthorized access')
    // }

    return inertia.render('projects/show', { project })
  }

  /**
   * Show project edit form
   */
  async edit({ params, inertia /*, auth */ }: HttpContext) {
    const project = await Project.findOrFail(params.id)

    // if (project.userId !== auth.user?.id) {
    //   return response.unauthorized('Unauthorized access')
    // }

    const statusOptions = ['pending', 'in_progress', 'completed']
    return inertia.render('projects/edit', { project, statusOptions })
  }

  /**
   * Update project
   */
  async update({ params, request, response, session /*, auth */ }: HttpContext) {
    try {
      const project = await Project.findOrFail(params.id)

      // if (project.userId !== auth.user?.id) {
      //   return response.unauthorized('Unauthorized update')
      // }

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
  async destroy({ params, response, session /*, auth */ }: HttpContext) {
    try {
      const project = await Project.findOrFail(params.id)

      // if (project.userId !== auth.user?.id) {
      //   return response.unauthorized('Unauthorized delete')
      // }

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
  async updateStatus({ params, request, response, session /*, auth */ }: HttpContext) {
    try {
      const project = await Project.findOrFail(params.id)

      // if (project.userId !== auth.user?.id) {
      //   return response.unauthorized('Unauthorized status change')
      // }

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
