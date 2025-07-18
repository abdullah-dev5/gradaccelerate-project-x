import Project from '#models/project'
import { HttpContext } from '@adonisjs/core/http'
import { projectValidator } from '#validators/projects/project'
import { projectStatusValidator } from '#validators/projects/project_status'

export default class ProjectsController {
  /**
   * List all projects with pagination
   */
  async index({ inertia, request /*, auth */ }: HttpContext) {
    const page = request.input('page', 1)
    const status = request.input('status')

    // const user = auth.user

    const projects = await Project.query()
      // .where('user_id', user.id) // ← Uncomment when auth integrated
      .orderBy('createdAt', 'desc')
      .if(status, (query) => query.where('status', status))
      .paginate(page, 10)

    return inertia.render('projects/index', {
      projects: {
        data: projects.toJSON().data,
        meta: projects.toJSON().meta,
      },
    })
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
  async store({ request, response /*, auth */ }: HttpContext) {
    try {
      const payload = await request.validateUsing(projectValidator)

      // payload.userId = auth.user?.id!

      await Project.create(payload)
      return response.redirect('/projects')
    } catch (error) {
      if ('messages' in error) {
        return response.badRequest({ errors: error.messages })
      }
      return response.internalServerError({ message: 'Failed to create project', error: error.message })
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
  async update({ params, request, response /*, auth */ }: HttpContext) {
    try {
      const project = await Project.findOrFail(params.id)

      // if (project.userId !== auth.user?.id) {
      //   return response.unauthorized('Unauthorized update')
      // }

      const payload = await request.validateUsing(projectValidator)

      project.merge(payload)
      await project.save()

      return response.redirect('/projects')
    } catch (error) {
      if ('messages' in error) {
        return response.badRequest({ errors: error.messages })
      }
      return response.internalServerError({ message: 'Failed to update project', error: error.message })
    }
  }

  /**
   * Delete project
   */
  async destroy({ params, response /*, auth */ }: HttpContext) {
    try {
      const project = await Project.findOrFail(params.id)

      // if (project.userId !== auth.user?.id) {
      //   return response.unauthorized('Unauthorized delete')
      // }

      await project.delete()
      return response.redirect().toRoute('projects.index')
    } catch (error) {
      return response.internalServerError({ message: 'Failed to delete project', error: error.message })
    }
  }

  /**
   * Update project status
   */
  async updateStatus({ params, request, response /*, auth */ }: HttpContext) {
    try {
      const project = await Project.findOrFail(params.id)

      // if (project.userId !== auth.user?.id) {
      //   return response.unauthorized('Unauthorized status change')
      // }

      const { status } = await request.validateUsing(projectStatusValidator)

      project.status = status
      await project.save()

      return response.redirect().back()
    } catch (error) {
      if ('messages' in error) {
        return response.badRequest({ errors: error.messages })
      }
      return response.internalServerError({ message: 'Failed to update status', error: error.message })
    }
  }
}
