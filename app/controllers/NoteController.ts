import { HttpContext } from '@adonisjs/core/http'
import Note from '#models/note'
import { marked } from 'marked'

export default class NotesController {
  private isInertiaRequest(request: HttpContext['request']) {
    return request.header('x-inertia') === 'true'
  }

  /**
   * Display sorted notes with pinned priority
   */
  async index({ inertia, request }: HttpContext) {
    const { sort = 'created_at', order = 'desc', search = '' } = request.qs()

    const query = Note.query().orderBy('pinned', 'desc')

    if (search) {
      query.where('title', 'LIKE', `%${search}%`)
        .orWhere('content', 'LIKE', `%${search}%`)
    }

    const notes = await query.orderBy(sort, order)

    if (this.isInertiaRequest(request)) {
      return inertia.render('notes/index', {
        notes: notes.map(note => note.serialize()),
        sortOptions: { currentSort: sort, currentOrder: order, searchQuery: search }
      })
    }

    return notes
  }

  /**
   * Show single note
   */
  async show({ params, inertia, request }: HttpContext) {
    const note = await Note.findOrFail(params.id)

    if (this.isInertiaRequest(request)) {
      return inertia.render('notes/show', {
        note: note.serialize()
      })
    }

    return note
  }

  /**
   * Store new note with markdown processing
   */
  async store({ request, response }: HttpContext) {
    const data = request.only(['title', 'content', 'pinned'])
    data.content = marked.parse(data.content)
    const note = await Note.create(data)

    if (this.isInertiaRequest(request)) {
      return response.redirect().back()
    }

    return response.status(201).json(note)
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

    if (this.isInertiaRequest(request)) {
      return response.redirect().back()
    }

    return note
  }

  /**
   * Delete note
   */
  async destroy({ params, response, request }: HttpContext) {
    const note = await Note.findOrFail(params.id)
    await note.delete()

    if (this.isInertiaRequest(request)) {
      return response.redirect().toRoute('notes.index')
    }

    return response.noContent()
  }

  /**
   * Toggle pin status
   */
  async togglePin({ params, response, request }: HttpContext) {
    const note = await Note.findOrFail(params.id)
    note.pinned = !note.pinned
    await note.save()

    if (this.isInertiaRequest(request)) {
      return response.redirect().back()
    }

    return note
  }
}