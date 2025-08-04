import { HttpContext } from '@adonisjs/core/http'
import Note from '#models/note'
import { marked } from 'marked'
import { randomUUID } from 'node:crypto'
import app from '@adonisjs/core/services/app'
import cloudinary from '#config/cloudinary'
import { DateTime } from 'luxon'
//import fs from 'fs-extra'// used for store method only in developement purpose
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



  //developement purpose only later will be removed
  // async store({ request, response }: HttpContext) {
  //   try {
  //     const payload = await request.validateUsing(createNoteValidator)
  //     console.log('Received payload:', payload)

  //     // Debug: Log all files received
  //     console.log('All files:', request.allFiles())

  //     const noteData: Partial<Note> = {
  //       title: payload.title,
  //       content: payload.content ? await marked.parse(payload.content) : undefined,
  //       pinned: payload.pinned ?? false,
  //     }

  //     // Handle image upload if present
  //     if (payload.image) {
  //       console.log('Processing image upload...')

  //       // Ensure uploads directory exists
  //       await fs.ensureDir(app.tmpPath('uploads'))

  //       const fileName = `${randomUUID()}_${payload.image.clientName}`
  //       const filePath = app.tmpPath('uploads', fileName)

  //       // Debug: Log before file move
  //       console.log('Moving file to:', filePath)

  //       await payload.image.move(app.tmpPath('uploads'), {
  //         name: fileName,
  //         overwrite: true
  //       })

  //       // Debug: Verify file exists after move
  //       console.log('File exists after move?', await fs.exists(filePath))

  //       const result = await cloudinary.uploader.upload(filePath, {
  //         folder: 'notes',
  //         public_id: `note_${Date.now()}`,
  //         resource_type: 'auto',
  //       })

  //       console.log('Cloudinary upload result:', result)

  //       noteData.imageUrl = result.secure_url
  //       noteData.imagePublicId = result.public_id
  //     }

  //     const note = await Note.create(noteData)

  //     if (payload.labelIds?.length) {
  //       await note.related('labels').attach(payload.labelIds)
  //     }

  //     return this.isInertiaRequest(request)
  //       ? response.redirect().back()
  //       : response.created({ message: 'Note created successfully', note })
  //   } catch (error) {
  //     console.error('Full error:', error)
  //     return response.status(400).send({
  //       message: 'Note creation failed',
  //       error: error.message,
  //       stack: error.stack // Only for development
  //     })
  //   }
  // }


  //this is prod ready 
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

      // Handle image upload
      if (payload.image) {
        const uploadResult = await this.uploadToCloudinary(payload.image)
        noteData.imageUrl = uploadResult.secure_url
        noteData.imagePublicId = uploadResult.public_id
      }

      const note = await Note.create(noteData)

      // Handle labels transactionally
      if (payload.labelIds?.length) {
        await this.safeAttachLabels(note, payload.labelIds)
      }

      return response.created({
        message: 'Note created successfully',
        note: await note.load('labels')
      })

    } catch (error) {
      logger.error(error, 'Note creation failed')
      return response.status(400).json({
        message: 'Note creation failed',
        error: error.message
      })
    }
  }

  private async uploadToCloudinary(image: MultipartFile) {
    const fileName = `${cuid()}_${image.clientName}`
    const uploadPath = app.tmpPath('uploads', fileName)

    await image.move(app.tmpPath('uploads'), {
      name: fileName,
      overwrite: false // Prevent overwrite attacks
    })

    return cloudinary.uploader.upload(uploadPath, {
      folder: process.env.CLOUDINARY_FOLDER || 'notes',
      public_id: `note_${Date.now()}`,
      resource_type: 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] // Explicit allowlist
    })
  }

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
        ? response.redirect().back()
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
        : response.ok({ message: 'Note moved to trash' })
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

  async generateShareLink({ params, request, response }: HttpContext) {
    try {
      const { note_id } = await request.validateUsing(noteIdValidator, { data: params })
      const note = await Note.findOrFail(note_id)

      note.shareUuid = randomUUID()
      await note.save()

      return response.ok({ message: 'Share link generated', url: `/notes/shared/${note.shareUuid}` })
    } catch (error) {
      return response.status(400).send({ message: 'Failed to generate share link', error: error.message })
    }
  }

  async viewSharedNote({ params, response }: HttpContext) {
    try {
      const note = await Note.query()
        .where('share_uuid', params.uuid)
        .whereNull('deleted_at')
        .preload('labels')
        .firstOrFail()

      return response.ok(note)
    } catch (error) {
      return response.status(404).send({ message: 'Shared note not found', error: error.message })
    }
  }
}
