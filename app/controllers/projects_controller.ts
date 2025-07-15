import Project from '#models/projects'
import { HttpContext } from '@adonisjs/core/http'

export default class ProjectsController {
  /**
   * List all projects with pagination
   */
  async index({ inertia, request }: HttpContext) {
    const page = request.input('page', 1)
    const projects = await Project.query()
      .orderBy('created_at', 'desc')
      .paginate(page, 10)

    return inertia.render('projects/index', { projects })
  }

  /**
   * Show project creation form
   */
  async create({ inertia }: HttpContext) {
    return inertia.render('projects/create')
  }

  /**
   * Store new project
   */
  async store({ request, response }: HttpContext) {
    const data = request.only(['title', 'description', 'status'])
    await Project.create(data)
    return response.redirect().toRoute('projects.index')
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
    return inertia.render('projects/edit', { project })
  }

  /**
   * Update project
   */
  async update({ params, request, response }: HttpContext) {
    const project = await Project.findOrFail(params.id)
    const data = request.only(['title', 'description', 'status'])

    project.merge(data)
    await project.save()

    return response.redirect().toRoute('projects.index')
  }

  /**
   * Delete project
   */
  async destroy({ params, response }: HttpContext) {
    const project = await Project.findOrFail(params.id)
    await project.delete()
    return response.redirect().toRoute('projects.index')
  }
}
