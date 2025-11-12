import Project from '#models/project'
import { HttpContext } from '@adonisjs/core/http'

export default class ProjectsController {
  /**
   * List all projects with pagination
   */
  async index({ inertia, request }: HttpContext) {
    const page = request.input('page', 1)
    const status = request.input('status')

    const projects = await Project.query()
      .orderBy('createdAt', 'desc')
      .if(status, (query) => query.where('status', status))
      .paginate(page, 10)

    return inertia.render('projects/index', {
      projects: {
        data: projects.toJSON().data,  // Explicit data array
        meta: projects.toJSON().meta    // Explicit pagination meta
      }
    })
  }

  /**
   * Show project creation form
   */
  async create({ inertia }: HttpContext) {
    const statusOptions = ['pending', 'in_progress', 'completed']
    return inertia.render('projects/create', { statusOptions })
  }

  /**
   * Store new project
   */
  async store({ request, response }: HttpContext) {
    const data = request.only(['title', 'description', 'status'])
    await Project.create(data)
    return response.redirect('/projects')
  }

  /**
   * Show single project
   */
  async show({ params, inertia }: HttpContext) {
    const project = await Project.findOrFail(params.id)
    return inertia.render('projects/show', { project })
  }

  /**
   * Show project edit form
   */
  async edit({ params, inertia }: HttpContext) {
    const project = await Project.findOrFail(params.id)
    const statusOptions = ['pending', 'in_progress', 'completed']
    return inertia.render('projects/edit', { project, statusOptions })
  }

  /**
   * Update project
   */
  async update({ params, request, response }: HttpContext) {
    const project = await Project.findOrFail(params.id)
    const data = request.only(['title', 'description', 'status'])

    project.merge(data)
    await project.save()

    return response.redirect('/projects')
  }

  /**
   * Delete project
   */
  async destroy({ params, response }: HttpContext) {
    const project = await Project.findOrFail(params.id)
    await project.delete()
    return response.redirect().toRoute('projects.index')
  }

  /**
   * Update project status
   */
  async updateStatus({ params, request, response }: HttpContext) {
    const project = await Project.findOrFail(params.id)
    const { status } = request.only(['status'])

    const validStatuses = ['pending', 'in_progress', 'completed']
    if (!validStatuses.includes(status)) {
      return response.badRequest({ message: 'Invalid status' })
    }

    project.status = status
    await project.save()

    return response.redirect().back()
  }
}