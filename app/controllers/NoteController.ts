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
import Label from '#models/label' // Import Label model

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
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      const { sort = 'created_at', order = 'desc', search = '', page = 1, limit = 10, pinned, label_id } = request.qs()

      const query = Note.query()
        .where('userId', user.id) // Filter by authenticated user
        .whereNull('deleted_at')
        .preload('labels')
        .orderBy('pinned', 'desc')

      if (search) {
        query.where((q) => {
          q.where('title', 'LIKE', `%${search}%`).orWhere('content', 'LIKE', `%${search}%`)
        })
      }

      if (pinned !== undefined) {
        query.where('pinned', pinned === 'true')
      }

      if (label_id) {
        query.whereHas('labels', (subQuery) => subQuery.where('id', label_id))
      }

      const notes = await query.orderBy(sort, order).paginate(Number(page), Number(limit))

      if (this.isInertiaRequest(request)) {
        return inertia.render('notes/index', {
          notes: notes.serialize().data,
          meta: notes.getMeta(),
          sortOptions: { currentSort: sort, currentOrder: order, searchQuery: search },
        })
      }

      return notes
    } catch (error) {
      // Handle authentication errors properly for Inertia requests
      if (this.isInertiaRequest(request)) {
        // For authentication errors, redirect to login
        if (error.message.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
          return response.redirect('/login')
        }
        // For other errors, redirect back with error message
        return inertia.render('notes/index', {
          notes: [],
          meta: { total: 0, currentPage: 1, lastPage: 1, perPage: 10 },
          sortOptions: { currentSort: 'created_at', currentOrder: 'desc', searchQuery: '' },
          error: 'Failed to fetch notes'
        })
      }
      // For API requests, return JSON error
      return response.status(500).send({ message: 'Failed to fetch notes', error: error.message })
    }
  }

  async show({ params, request, response, inertia, auth }: HttpContext) {
    try {
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      const { note_id } = await request.validateUsing(noteIdValidator, { data: params })
      const note = await Note.query()
        .where('id', note_id)
        .where('userId', user.id) // Ensure user owns the note
        .whereNull('deleted_at')
        .preload('labels')
        .firstOrFail()

      return this.isInertiaRequest(request)
        ? inertia.render('notes/show', { note: note.serialize() })
        : note
    } catch (error) {
      return response.status(404).send({ message: 'Note not found', error: error.message })
    }
  }

  async edit({ params, request, response, inertia, auth }: HttpContext) {
    try {
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      const { note_id } = await request.validateUsing(noteIdValidator, { data: params })
      const note = await Note.query()
        .where('id', note_id)
        .where('userId', user.id) // Ensure user owns the note
        .whereNull('deleted_at')
        .preload('labels')
        .firstOrFail()

      // Fetch all available labels for the form
      const labels = await Label.query().orderBy('name', 'asc')

      return this.isInertiaRequest(request)
        ? inertia.render('notes/edit', {
          note: note.serialize(),
          labels: labels.map(label => label.serialize())
        })
        : { note: note.serialize(), labels: labels.map(label => label.serialize()) }
    } catch (error) {
      return response.status(404).send({ message: 'Note not found', error: error.message })
    }
  }



  async store({ request, response, auth }: HttpContext) {
    try {
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      const payload = await request.validateUsing(createNoteValidator)

      const noteData: Partial<Note> = {
        title: payload.title,
        content: payload.content ? await marked.parse(payload.content) : '',
        pinned: payload.pinned ?? false,
        userId: user.id, // Set the authenticated user as owner
        imageUrl: null,
        imagePublicId: null
      }

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

      const note = await Note.create(noteData)

      // Handle labels with transaction - updated to handle both array and single value
      if (payload.labelIds) {
        try {
          const labelIds = Array.isArray(payload.labelIds)
            ? payload.labelIds
            : [payload.labelIds]

          await this.safeAttachLabels(note, labelIds)
        } catch (labelError) {
          // Rollback note creation if label attachment fails
          await note.delete()
          throw labelError
        }
      }

      if (this.isInertiaRequest(request)) {
        // For Inertia requests, redirect to notes index
        return response.redirect().toRoute('notes.index')
      } else {
        // For API requests, return JSON
        return response.created({
          message: 'Note created successfully',
          note: await note.load('labels')
        })
      }

    } catch (error) {
      logger.error('Note creation failed', {
        error: error.message,
        stack: error.stack
      })

      if (this.isInertiaRequest(request)) {
        // For Inertia requests, redirect back 
        return response.redirect().back()
      } else {
        // For API requests, return JSON error
        return response.status(400).json({
          message: 'Note creation failed',
          error: error.messages?.messages || error.message
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

  // Keep the existing safeAttachLabels method exactly as is
  private async safeAttachLabels(note: Note, labelIds: number[]) {
    try {
      // Verify labels exist first
      const existingLabels = await Label.query()
        .whereIn('id', labelIds)
        .select('id')

      if (existingLabels.length !== labelIds.length) {
        throw new Error('One or more labels do not exist')
      }

      await note.related('labels').attach(labelIds)
    } catch (error) {
      logger.error('Label attachment failed', { noteId: note.id, labelIds })
      throw error // Re-throw for global handler
    }
  }









  async update({ request, response, params, auth }: HttpContext) {
    try {
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      const { note_id } = await request.validateUsing(noteIdValidator, { data: params })
      const payload = await request.validateUsing(updateNoteValidator)
      const note = await Note.query()
        .where('id', note_id)
        .where('userId', user.id) // Ensure user owns the note
        .firstOrFail()

      // Prepare update data object (unchanged)
      const updateData: Partial<Note> = {
        title: payload.title ?? note.title,
        content: payload.content ? await marked.parse(payload.content) : note.content,
        pinned: payload.pinned ?? note.pinned,
      }

      // Handle image changes (unchanged)
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

      // Handle labels if provided - now with proper TypeScript support
      if (payload.labelIds) {
        // First detach all existing labels
        await note.related('labels').detach()

        // Then attach new ones if any exist
        if (payload.labelIds.length > 0) {
          await note.related('labels').attach(payload.labelIds)
        }
      }

      return this.isInertiaRequest(request)
        ? response.redirect(`/notes/${note.id}`)
        : response.ok({
          message: 'Note updated successfully',
          note: await note.load('labels')
        })
    } catch (error) {
      logger.error(error)
      return response.status(400).send({
        message: 'Failed to update note',
        error: error.message
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
        .preload('labels')
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
        labels: note.labels,
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
}
