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
import { cuid } from '@adonisjs/core/helpers'
import type { MultipartFile } from '@adonisjs/core/types/bodyparser' // Import MultipartFile type
import Label from '#models/label' // Import Label model

export default class NotesController {
  private isInertiaRequest(request: HttpContext['request']) {
    return request.header('x-inertia') === 'true'
  }

  async index({ request, inertia, response }: HttpContext) {
    try {
      const { sort = 'created_at', order = 'desc', search = '', page = 1, limit = 10, pinned, label_id } = request.qs()

      const query = Note.query()
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
      return response.status(500).send({ message: 'Failed to fetch notes', error: error.message })
    }
  }

  async show({ params, request, response, inertia }: HttpContext) {
    try {
      const { note_id } = await request.validateUsing(noteIdValidator, { data: params })
      const note = await Note.query()
        .where('id', note_id)
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

  async edit({ params, request, response, inertia }: HttpContext) {
    try {
      const { note_id } = await request.validateUsing(noteIdValidator, { data: params })
      const note = await Note.query()
        .where('id', note_id)
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



  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createNoteValidator)

      const noteData: Partial<Note> = {
        title: payload.title,
        content: payload.content ? await marked.parse(payload.content) : '',
        pinned: payload.pinned ?? false,
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









  async update({ request, response, params }: HttpContext) {
    try {
      const { note_id } = await request.validateUsing(noteIdValidator, { data: params })
      const payload = await request.validateUsing(updateNoteValidator)
      const note = await Note.findOrFail(note_id)

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








  async destroy({ request, params, response }: HttpContext) {
    try {
      const { note_id } = await request.validateUsing(noteIdValidator, { data: params })
      const note = await Note.findOrFail(note_id)

      note.deletedAt = DateTime.now()
      await note.save()

      return this.isInertiaRequest(request)
        ? response.redirect().toRoute('notes.index')
        : response.ok({ message: 'Note moved to trash', success: true })
    } catch (error) {
      return response.status(400).send({ message: 'Failed to delete note', error: error.message })
    }
  }

  async restore({ request, params, response }: HttpContext) {
    try {
      const { note_id } = await request.validateUsing(noteIdValidator, { data: params })
      const note = await Note.findOrFail(note_id)

      note.deletedAt = null
      await note.save()

      return response.ok({ message: 'Note restored successfully', note })
    } catch (error) {
      return response.status(400).send({ message: 'Restore failed', error: error.message })
    }
  }

  async togglePin({ request, response, params }: HttpContext) {
    try {
      const { note_id } = await request.validateUsing(noteIdValidator, { data: params })
      const note = await Note.findOrFail(note_id)

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



  // future feature to generate share link for notes
  // This method generates a unique share link for a note 
  // async generateShareLink({ params, request, response }: HttpContext) {
  //   try {
  //     const { note_id } = await request.validateUsing(noteIdValidator, { data: params })
  //     const note = await Note.findOrFail(note_id)

  //     note.shareUuid = randomUUID()
  //     await note.save()

  //     return response.ok({ message: 'Share link generated', url: `/notes/shared/${note.shareUuid}` })
  //   } catch (error) {
  //     return response.status(400).send({ message: 'Failed to generate share link', error: error.message })
  //   }
  // }
  // // This method retrieves a shared note by its UUID
  // async viewSharedNote({ params, response }: HttpContext) {
  //   try {
  //     const note = await Note.query()
  //       .where('share_uuid', params.uuid)
  //       .whereNull('deleted_at')
  //       .preload('labels')
  //       .firstOrFail()

  //     return response.ok(note)
  //   } catch (error) {
  //     return response.status(404).send({ message: 'Shared note not found', error: error.message })
  //   }
  // }
}
