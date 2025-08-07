import { HttpContext } from '@adonisjs/core/http'
import Note from '#models/note'
import { marked } from 'marked'
import { randomUUID } from 'node:crypto'
import app from '@adonisjs/core/services/app'
import cloudinary from '#config/cloudinary'
import { DateTime } from 'luxon'
import fs from 'fs' // Import Node.js file system module
import logger from '@adonisjs/core/services/logger'
import { createNoteValidator } from '#validators/notes/create_note_validator'
import { updateNoteValidator } from '#validators/notes/update_note_validator'
import { noteIdValidator } from '#validators/notes/note_id_validator'
import { uploadImageValidator } from '#validators/notes/upload_image_validator'
import { shareTokenValidator } from '#validators/notes/share_token_validator'
import { cuid } from '@adonisjs/core/helpers'
import type { MultipartFile } from '@adonisjs/core/types/bodyparser' // Import MultipartFile type
// ...label logic removed...
import env from '#start/env'
import axios from 'axios'



export default class NotesController {
  private isInertiaRequest(request: HttpContext['request']) {
    return request.header('x-inertia') === 'true'
  }

  // Alias method for backward compatibility - redirect to index
  async indexPage(context: HttpContext) {
    return this.index(context);
  }

  async index({ request, inertia, response, auth }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()
      const { sort = 'created_at', order = 'desc', search = '', page = 1, limit = 10, pinned } = request.qs()

      const query = Note.query()
        .where('userId', user.id)
        .whereNull('deleted_at')
        // .preload('labels') // label logic removed
        .orderBy('pinned', 'desc')

      if (search) {
        query.where((q) => {
          q.where('title', 'LIKE', `%${search}%`).orWhere('content', 'LIKE', `%${search}%`)
        })
      }
      if (pinned !== undefined) {
        query.where('pinned', pinned === 'true')
      }
      // label logic removed

      const notes = await query.orderBy(sort, order).paginate(Number(page), Number(limit))

      // Always render Inertia page for browser requests (even if not X-Inertia)
      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        return inertia.render('notes/index', {
          notes: notes.serialize().data,
          meta: notes.getMeta(),
          sortOptions: { currentSort: sort, currentOrder: order, searchQuery: search },
        })
      }
      return response.ok(notes)
    } catch (error) {
      // JWT or session expired, or not authenticated
      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
          return response.redirect('/login')
        }
        // Render a consistent error page for Inertia
        return inertia.render('errors/server_error', {
          error: error.message || 'Failed to fetch notes'
        })
      }
      // For API requests, return JSON error
      if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
        return response.unauthorized({ message: 'Unauthorized', error: error.message })
      }
      return response.status(500).send({ message: 'Failed to fetch notes', error: error.message })
    }
  }

  async show({ params, request, response, inertia, auth }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()
      const { note_id } = await request.validateUsing(noteIdValidator, { data: params })
      const note = await Note.query()
        .where('id', note_id)
        .where('userId', user.id)
        .whereNull('deleted_at')
        // .preload('labels') // label logic removed
        .firstOrFail()

      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        return inertia.render('notes/show', { note: note.serialize() })
      }
      return response.ok(note)
    } catch (error) {
      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
          return response.redirect('/login')
        }
        return inertia.render('errors/not_found', {
          error: error.message || 'Note not found'
        })
      }
      if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
        return response.unauthorized({ message: 'Unauthorized', error: error.message })
      }
      return response.status(404).send({ message: 'Note not found', error: error.message })
    }
  }

  async edit({ params, request, response, inertia, auth }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()
      const { note_id } = await request.validateUsing(noteIdValidator, { data: params })
      const note = await Note.query()
        .where('id', note_id)
        .where('userId', user.id)
        .whereNull('deleted_at')
        // .preload('labels') // label logic removed
        .firstOrFail()

      // label logic removed

      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        return inertia.render('notes/edit', {
          note: note.serialize(),
          // label logic removed
        })
      }
      return response.ok({ note: note.serialize() })
    } catch (error) {
      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
          return response.redirect('/login')
        }
        return inertia.render('errors/not_found', {
          error: error.message || 'Note not found'
        })
      }
      if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
        return response.unauthorized({ message: 'Unauthorized', error: error.message })
      }
      return response.status(404).send({ message: 'Note not found', error: error.message })
    }
  }


  async store({ request, response, auth }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()
      const payload = await request.validateUsing(createNoteValidator)

      // Debug: log incoming payload
      logger.info('DEBUG NOTE PAYLOAD', { payload })
      console.log('DEBUG NOTE PAYLOAD', JSON.stringify(payload))

      const noteData: Partial<Note> = {
        title: payload.title,
        content: payload.content ? await marked.parse(payload.content) : '',
        pinned: payload.pinned ?? false,
        userId: user.id,
        imageUrl: null,
        imagePublicId: null,
        gif_url: payload.gif_url || null, // DB column is gif_url
        gif_slug: payload.gif_slug || null, // DB column is gif_slug
        labels: payload.labels || [],
      }

      // Debug: log noteData before create
      logger.info('DEBUG NOTE DATA', { noteData })
      console.log('DEBUG NOTE DATA', JSON.stringify(noteData))

      // Handle image upload with cleanup on failure
      if (payload.image) {
        try {
          const uploadResult = await this.uploadToCloudinary(payload.image)
          noteData.imageUrl = uploadResult.secure_url
          noteData.imagePublicId = uploadResult.public_id
          logger.info('Image uploaded successfully', { url: noteData.imageUrl })
        } catch (uploadError) {
          logger.error('Image upload failed', uploadError)
          throw new Error('Failed to process image upload')
        }
      }

      // Handle GIF tracking if provided
      if (payload.gif_slug) {
        try {
          await axios.post(
            `https://api.klipy.com/api/v1/${env.get('KLIPY_API_KEY')}/gifs/view/${payload.gif_slug}`,
            { customer_id: user.id }
          )
        } catch (trackError) {
          logger.warn('GIF view tracking failed', trackError)
        }
      }

      let note = null
      try {
        note = await Note.create(noteData)
        logger.info('DEBUG NOTE CREATED', { note })
        console.log('DEBUG NOTE CREATED', JSON.stringify(note))
      } catch (err) {
        logger.error('ERROR CREATING NOTE', { err })
        console.log('ERROR CREATING NOTE', err)
        throw err
      }

      // Debug: log note after create
      logger.info('DEBUG NOTE CREATED', { note })



      if (this.isInertiaRequest(request)) {
        return response.redirect().toRoute('notes.index')
      } else {
        return response.created({
          message: 'Note created successfully',
          note: note.serialize()
        })
      }

    } catch (error) {
      logger.error('Note creation failed', {
        error: error.message,
        stack: error.stack,
        full: error
      })

      // Debug: send error details in response for frontend
      if (this.isInertiaRequest(request)) {
        return response.redirect().back()
      } else {
        return response.status(400).json({
          message: 'Note creation failed',
          error: error.messages?.messages || error.message,
          debug: error
        })
      }
    }
  }


  // Keep the existing uploadToCloudinary method exactly as is
  private async uploadToCloudinary(image: MultipartFile) {
    const fileName = `${cuid()}.${image.extname}` // Use extname instead of clientName
    const uploadPath = app.tmpPath('uploads', fileName)

    // Validate file size before processing
    if (image.size > 5 * 1024 * 1024) { // 5MB
      throw new Error('File size exceeds 5MB limit')
    }

    await image.move(app.tmpPath('uploads'), {
      name: fileName,
      overwrite: false
    })

    try {
      return await cloudinary.uploader.upload(uploadPath, {
        folder: process.env.CLOUDINARY_FOLDER || 'notes',
        public_id: `note_${Date.now()}`,
        resource_type: 'auto',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        timeout: 30000 // 30 second timeout
      })
    } finally {
      // Cleanup temp file after upload
      await fs.promises.unlink(uploadPath).catch(() => { })
    }
  }








  async update({ request, response, params, auth, inertia }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()
      const { note_id } = await request.validateUsing(noteIdValidator, { data: params })
      const payload = await request.validateUsing(updateNoteValidator)
      const note = await Note.query()
        .where('id', note_id)
        .where('userId', user.id)
        .firstOrFail()

      const updateData: Partial<Note> = {
        title: payload.title ?? note.title,
        content: payload.content ? await marked.parse(payload.content) : note.content,
        pinned: payload.pinned ?? note.pinned,
        gif_url: payload.gif_url ?? note.gif_url,
        gif_slug: payload.gif_slug ?? note.gif_slug,
        labels: payload.labels ?? note.labels,
      }

      // Handle GIF tracking if new GIF is provided
      if (payload.gif_slug && payload.gif_slug !== note.gif_slug) {
        try {
          await axios.post(
            `https://api.klipy.com/api/v1/${env.get('KLIPY_API_KEY')}/gifs/view/${payload.gif_slug}`,
            { customer_id: user.id }
          )
        } catch (trackError) {
          logger.warn('GIF view tracking failed', trackError)
        }
      }

      // Handle image changes (existing unchanged code)
      if (payload.image) {
        const fileName = `${randomUUID()}_${payload.image.clientName}`
        await payload.image.move(app.tmpPath('uploads'), { name: fileName })

        const result = await cloudinary.uploader.upload(app.tmpPath('uploads', fileName), {
          folder: 'notes',
          public_id: `note_${Date.now()}`,
          resource_type: 'auto',
        })

        if (note.imagePublicId) {
          try {
            await cloudinary.uploader.destroy(note.imagePublicId)
          } catch (error) {
            logger.error('Failed to delete old image:', error)
          }
        }

        updateData.imageUrl = result.secure_url
        updateData.imagePublicId = result.public_id
      } else if (payload.removeImage) {
        if (note.imagePublicId) {
          try {
            await cloudinary.uploader.destroy(note.imagePublicId)
          } catch (error) {
            logger.error('Failed to delete image:', error)
          }
        }
        updateData.imageUrl = null
        updateData.imagePublicId = null
      }

      // Update note with all changes
      note.merge(updateData)
      await note.save()



      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        return response.redirect(`/notes/${note.id}`)
      }
      return response.ok({
        message: 'Note updated successfully',
        note: note.serialize()
      })
    } catch (error) {
      logger.error(error)
      // Always return a valid Inertia response for browser/Inertia requests
      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        // If validation error, redirect back with errors (or render error page)
        if (error.messages?.messages) {
          // You can customize this to render a validation error page or redirect back
          return response.redirect().back()
        }
        return inertia.render('errors/server_error', {
          error: error.message || 'Failed to update note'
        })
      }
      // For API requests, return JSON error
      return response.status(400).send({
        message: 'Failed to update note',
        error: error.messages?.messages || error.message
      })
    }
  }








  async destroy({ request, params, response, auth }: HttpContext) {
    try {
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      const { note_id } = await request.validateUsing(noteIdValidator, { data: params })
      const note = await Note.query()
        .where('id', note_id)
        .where('userId', user.id) // Ensure user owns the note
        .firstOrFail()

      note.deletedAt = DateTime.now()
      await note.save()

      return this.isInertiaRequest(request)
        ? response.redirect().toRoute('notes.index')
        : response.ok({ message: 'Note moved to trash', success: true })
    } catch (error) {
      return response.status(400).send({ message: 'Failed to delete note', error: error.message })
    }
  }

  async restore({ request, params, response, auth }: HttpContext) {
    try {
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      const { note_id } = await request.validateUsing(noteIdValidator, { data: params })
      const note = await Note.query()
        .where('id', note_id)
        .where('userId', user.id) // Ensure user owns the note
        .firstOrFail()

      note.deletedAt = null
      await note.save()

      return response.ok({ message: 'Note restored successfully', note })
    } catch (error) {
      return response.status(400).send({ message: 'Restore failed', error: error.message })
    }
  }

  async togglePin({ request, response, params, auth }: HttpContext) {
    try {
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      const { note_id } = await request.validateUsing(noteIdValidator, { data: params })
      const note = await Note.query()
        .where('id', note_id)
        .where('userId', user.id) // Ensure user owns the note
        .firstOrFail()

      note.pinned = !note.pinned
      await note.save()

      return this.isInertiaRequest(request)
        ? response.redirect().back()
        : response.ok({ message: 'Pin status updated', note })
    } catch (error) {
      return response.status(400).send({ message: 'Failed to toggle pin', error: error.message })
    }
  }

  async uploadImage({ request, response }: HttpContext) {
    const { image } = await request.validateUsing(uploadImageValidator)

    if (!image) {
      return response.status(400).send({ message: 'No image provided' })
    }

    try {
      const fileName = `${randomUUID()}_${image.clientName}`
      await image.move(app.tmpPath('uploads'), { name: fileName })

      const result = await cloudinary.uploader.upload(app.tmpPath('uploads', fileName), {
        folder: 'notes',
        public_id: `note_${Date.now()}`,
        resource_type: 'auto',
        timeout: 10000,
      })

      return response.ok({
        message: 'Image uploaded successfully',
        url: result.secure_url,
        public_id: result.public_id,
        asset_id: result.asset_id,
        bytes: result.bytes,
      })
    } catch (error) {
      return response.status(500).send({ message: 'Image upload failed', error: error.message })
    }
  }



  /**
   * Generate a unique share link for a note
   * Creates a UUID token that allows public access to the note
   */
  async generateShareLink({ params, request, response, auth }: HttpContext) {
    try {
      await auth.authenticate() // Ensure user is authenticated
      const user = auth.getUserOrFail()
      const { note_id } = await request.validateUsing(noteIdValidator, { data: params })

      // Find note and ensure user owns it
      const note = await Note.query()
        .where('id', note_id)
        .where('userId', user.id)
        .whereNull('deleted_at')
        .firstOrFail()

      // Generate unique UUID for sharing
      note.shareUuid = randomUUID()
      await note.save()

      const shareUrl = `/notes/shared/${note.shareUuid}`

      if (this.isInertiaRequest(request)) {
        return response.ok({
          message: 'Share link generated successfully',
          shareUrl,
          shareUuid: note.shareUuid
        })
      }

      return response.ok({
        message: 'Share link generated successfully',
        url: shareUrl,
        shareUuid: note.shareUuid
      })
    } catch (error) {
      logger.error('Failed to generate share link:', error)

      if (this.isInertiaRequest(request)) {
        return response.status(400).send({
          message: 'Failed to generate share link',
          error: error.message
        })
      }

      return response.status(400).send({
        message: 'Failed to generate share link',
        error: error.message
      })
    }
  }

  /**
   * View a shared note by its UUID token
   * This endpoint is publicly accessible and does not require authentication
   */
  async viewSharedNote({ params, request, response, inertia }: HttpContext) {
    try {
      const { token } = await request.validateUsing(shareTokenValidator, { data: params })

      // Find note by share UUID, ensure it's not deleted
      const note = await Note.query()
        .where('shareUuid', token)
        .whereNull('deleted_at')

        .preload('user', (userQuery) => {
          userQuery.select('id', 'fullName', 'email') // Use fullName instead of username
        })
        .firstOrFail()

      // Process content if it's markdown
      const processedContent = marked(note.content || '')

      // Prepare note data for sharing (remove sensitive information)
      const sharedNoteData = {
        id: note.id,
        title: note.title,
        content: note.content,
        processedContent,
        imageUrl: note.imageUrl,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,

        user: {
          fullName: note.user.fullName,
          email: note.user.email
        },
        isShared: true, // Flag to indicate this is a shared view
        shareUuid: note.shareUuid
      }

      // Always render the Inertia page for browser requests
      // Only return JSON for explicit API requests (with Accept: application/json header)
      const acceptsJson = request.header('accept')?.includes('application/json')
      const isApiRequest = request.header('x-requested-with') === 'XMLHttpRequest' && acceptsJson

      if (isApiRequest) {
        return response.ok({
          note: sharedNoteData,
          isReadOnly: true
        })
      }

      // Default to Inertia rendering for all browser requests
      return inertia.render('notes/shared', {
        note: sharedNoteData,
        isReadOnly: true // Ensure frontend knows this is read-only
      })
    } catch (error) {
      logger.error('Failed to retrieve shared note:', error)

      // For browser requests, show custom 404 page
      const acceptsJson = request.header('accept')?.includes('application/json')
      const isApiRequest = request.header('x-requested-with') === 'XMLHttpRequest' && acceptsJson

      if (isApiRequest) {
        return response.status(404).send({
          message: 'Shared note not found or has been removed',
          error: error.message
        })
      }

      return inertia.render('errors/404', {
        message: 'Shared note not found or has been removed'
      })
    }
  }

  /**
   * Revoke sharing for a note by removing the share UUID
   */
  async revokeShareLink({ params, request, response, auth }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()
      const { note_id } = await request.validateUsing(noteIdValidator, { data: params })

      // Find note and ensure user owns it
      const note = await Note.query()
        .where('id', note_id)
        .where('userId', user.id)
        .whereNull('deleted_at')
        .firstOrFail()

      // Remove share UUID
      note.shareUuid = null
      await note.save()

      if (this.isInertiaRequest(request)) {
        return response.ok({
          message: 'Share link revoked successfully'
        })
      }

      return response.ok({
        message: 'Share link revoked successfully',
        note: note.serialize()
      })
    } catch (error) {
      logger.error('Failed to revoke share link:', error)

      return response.status(400).send({
        message: 'Failed to revoke share link',
        error: error.message
      })
    }
  }

  /**
   * Get the current share status and URL for a note
   */
  async getShareStatus({ params, request, response, auth }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()
      const { note_id } = await request.validateUsing(noteIdValidator, { data: params })

      // Find note and ensure user owns it
      const note = await Note.query()
        .where('id', note_id)
        .where('userId', user.id)
        .whereNull('deleted_at')
        .firstOrFail()

      const shareData = {
        isShared: !!note.shareUuid,
        shareUrl: note.shareUuid ? `/notes/shared/${note.shareUuid}` : null,
        shareUuid: note.shareUuid
      }

      if (this.isInertiaRequest(request)) {
        return response.ok(shareData)
      }

      return response.ok(shareData)
    } catch (error) {
      logger.error('Failed to get share status:', error)

      return response.status(400).send({
        message: 'Failed to get share status',
        error: error.message
      })
    }
  }











  public async searchGifs({ request, response, auth }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()

      const apiKey = env.get('KLIPY_API_KEY')
      const { data } = await axios.get(
        `https://api.klipy.com/api/v1/${apiKey}/gifs/search`,
        {
          params: {
            q: request.input('q'),
            page: request.input('page', 1),
            per_page: request.input('limit', 5),
            content_filter: 'high',
            customer_id: user.id
          }
        }
      )

      if (data?.result && Array.isArray(data?.data?.data)) {
        return response.ok({
          data: data.data.data.map((gif: any) => ({
            id: gif.id,
            slug: gif.slug,
            url: gif.file?.md?.gif?.url || gif.file?.hd?.gif?.url || '',
            preview: gif.blur_preview || gif.file?.sm?.gif?.url || '',
            title: gif.title,
            width: gif.file?.md?.gif?.width || 300,
            height: gif.file?.md?.gif?.height || 200
          }))
        })
      }

      return response.status(502).json({
        message: 'Unexpected Klipy API response',
        raw: data
      })

    } catch (error) {
      logger.error('Klipy API failed', error)
      return response.status(error.response?.status || 500).json({
        message: 'Failed to search GIFs',
        error: error.response?.data?.message || error.message
      })
    }
  }

  /**
   * Attach GIF to note
   */
  public async attachGif({ params, request, response, auth }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()

      const { gif_url, gif_slug } = request.only(['gif_url', 'gif_slug'])

      const note = await Note.query()
        .where('id', params.id)
        .where('userId', user.id)
        .firstOrFail()

      note.gif_url = gif_url
      note.gif_slug = gif_slug
      await note.save()

      // Track view in Klipy
      try {
        await axios.post(
          `https://api.klipy.com/api/v1/${env.get('KLIPY_API_KEY')}/gifs/view/${gif_slug}`,
          { customer_id: user.id }
        )
      } catch (trackError) {
        logger.warn('GIF view tracking failed', trackError)
      }

      return response.ok(note.serialize())

    } catch (error) {
      logger.error('GIF attachment failed', error)
      return response.status(error.response?.status || 500).json({
        message: 'Failed to attach GIF',
        error: error.response?.data?.message || error.message
      })
    }
  }

  /**
   * Remove GIF from note
   */
  public async removeGif({ params, response, auth }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()

      const note = await Note.query()
        .where('id', params.id)
        .where('userId', user.id)
        .firstOrFail()

      note.gif_url = null
      note.gif_slug = null
      await note.save()

      return response.ok(note.serialize())

    } catch (error) {
      logger.error('GIF removal failed', error)
      return response.status(500).json({
        message: 'Failed to remove GIF',
        error: error.message
      })
    }
  }




}
