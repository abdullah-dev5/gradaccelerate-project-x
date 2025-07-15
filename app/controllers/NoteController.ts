import { HttpContext } from '@adonisjs/core/http'
import Note from '#models/note'
import { marked } from 'marked'

export default class NotesController {
  private isJsonRequest(request: HttpContext['request']) {
    // More reliable check for JSON requests
    return (
      request.accepts(['html', 'json']) === 'json' ||
      request.header('accept')?.includes('application/json') ||
      request.header('content-type')?.includes('application/json')
    )
  }

  /**
   * Display sorted notes with pinned priority
   */
  async index({ inertia, request, response }: HttpContext) {
    const { sort = 'created_at', order = 'desc', search = '' } = request.qs()

    const query = Note.query().orderBy('pinned', 'desc')

    if (search) {
      query.where('title', 'LIKE', `%${search}%`)
        .orWhere('content', 'LIKE', `%${search}%`)
    }

    const notes = await query.orderBy(sort, order)

    if (this.isJsonRequest(request)) {
      return response.json(notes) // Explicitly return JSON response
    }

    return inertia.render('notes/index', {
      notes,
      sortOptions: { currentSort: sort, currentOrder: order, searchQuery: search }
    })
  }

  /**
   * Show single note
   */
  async show({ params, inertia, request, response }: HttpContext) {
    const note = await Note.findOrFail(params.id)

    if (this.isJsonRequest(request)) {
      return response.json(note) // Explicitly return JSON response
    }

    return inertia.render('notes/show', { note })
  }

  /**
   * Store new note with markdown processing
   */
  async store({ request, response }: HttpContext) {
    const data = request.only(['title', 'content', 'pinned'])
    data.content = marked.parse(data.content)
    const note = await Note.create(data)

    if (this.isJsonRequest(request)) {
      return response.status(201).json(note)
    }

    return response.redirect().back()
  }

  /**
   * Update note
   */
  async update({ params, request, response }: HttpContext) {
    const note = await Note.findOrFail(params.id)
    const data = request.only(['title', 'content', 'pinned'])

    if (data.content) {
      data.content = marked.parse(data.content)
    }

    await note.merge(data).save()

    if (this.isJsonRequest(request)) {
      return response.json(note) // Explicitly return JSON response
    }

    return response.redirect().back()
  }

  /**
   * Delete note
   */
  async destroy({ params, response, request }: HttpContext) {
    const note = await Note.findOrFail(params.id)
    await note.delete()

    if (this.isJsonRequest(request)) {
      return response.noContent()
    }

    return response.redirect().toRoute('notes.index')
  }

  /**
   * Toggle pin status
   */
  async togglePin({ params, response, request }: HttpContext) {
    const note = await Note.findOrFail(params.id)
    note.pinned = !note.pinned
    await note.save()

    if (this.isJsonRequest(request)) {
      return response.json(note) // Explicitly return JSON response
    }

    return response.redirect().back()
  }
}