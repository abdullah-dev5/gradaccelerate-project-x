import { HttpContext } from '@adonisjs/core/http'
import Note from '#models/note'
import { marked } from 'marked'
import { randomUUID } from 'node:crypto'
import app from '@adonisjs/core/services/app'
import cloudinary from '#config/cloudinary'
import { DateTime } from 'luxon'
import fs from 'node:fs' // Import Node.js file system module
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
  async indexPage(_context: HttpContext) {
    return this.index(_context)
  }

  async index({ request, inertia, response, auth }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()
      const {
        sort = 'created_at',
        order = 'desc',
        search = '',
        page = 1,
        limit = 10,
        pinned,
      } = request.qs()

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
          notes: notes.serialize().data.map((note) => ({
            id: note.id,
            title: note.title,
            content: note.content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            pinned: note.pinned,
            imageUrl: note.imageUrl,
            gif_url: note.gif_url,
            gif_slug: note.gif_slug,
            labels: note.labels,
            userId: note.userId,
          })),
          meta: notes.getMeta(),
          sortOptions: { currentSort: sort, currentOrder: order, searchQuery: search },
        })
      }
      return response.ok(notes)
    } catch (error) {
      if (
        request.header('x-inertia') === 'true' ||
        request.header('accept')?.includes('text/html')
      ) {
        if (error.message.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
          return response.redirect('/login')
        }
        return inertia.render('notes/index', {
          notes: [],
          meta: {
            total: 0,
            per_page: 10,
            current_page: 1,
            last_page: 1,
            first_page: 1,
            first_page_url: null,
            last_page_url: null,
            next_page_url: null,
            previous_page_url: null,
          },
          sortOptions: { currentSort: 'created_at', currentOrder: 'desc', searchQuery: '' },
          error: 'Failed to fetch notes',
        })
      }
      return response.status(500).json({
        message: 'Failed to fetch notes',
        error: error.message,
      })
    }
  }

  async show({ params, request, response, inertia, auth }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()
      const noteId = params.id
      const note = await Note.query()
        .where('id', noteId)
        .where('userId', user.id)
        .whereNull('deleted_at')
        // .preload('labels') // label logic removed
        .firstOrFail()

      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        return inertia.render('notes/show', {
          note: {
            id: note.id,
            title: note.title,
            content: note.content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            pinned: note.pinned,
            imageUrl: note.imageUrl,
            gif_url: note.gif_url,
            gif_slug: note.gif_slug,
            labels: note.labels,
            userId: note.userId,
            shareUuid: note.shareUuid,
          },
        })
      }
      return response.ok(note)
    } catch (error) {
      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
          return inertia.render('errors/unauthorized', {
            message: 'You need to be authenticated to view this note.',
            redirectUrl: '/login',
          })
        }
        return inertia.render('errors/not_found', {
          error: error.message || 'Note not found',
          message: 'This note may have been deleted or you do not have permission to view it.',
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
      const noteId = params.id
      const note = await Note.query()
        .where('id', noteId)
        .where('userId', user.id)
        .whereNull('deleted_at')
        // .preload('labels') // label logic removed
        .firstOrFail()

      // label logic removed

      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        return inertia.render('notes/edit', {
          note: {
            id: note.id,
            title: note.title,
            content: note.content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            pinned: note.pinned,
            imageUrl: note.imageUrl,
            gif_url: note.gif_url,
            gif_slug: note.gif_slug,
            labels: note.labels,
            userId: note.userId,
          },
        })
      }
      return response.ok({ note: note.serialize() })
    } catch (error) {
      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
          return inertia.render('errors/unauthorized', {
            message: 'You need to be authenticated to edit this note.',
            redirectUrl: '/login',
          })
        }
        return inertia.render('errors/not_found', {
          error: error.message || 'Note not found',
          message: 'This note may have been deleted or you do not have permission to edit it.',
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
      // ✅ FIXED: Ensure proper authentication
      await auth.authenticate()
      const user = auth.getUserOrFail()

      if (!user || !user.id) {
        logger.error('User authentication failed - no user or user ID')
        if (this.isInertiaRequest(request)) {
          return response.redirect('/login')
        } else {
          return response.unauthorized({ message: 'Authentication required' })
        }
      }

      const payload = await request.validateUsing(createNoteValidator)

      // Debug: log incoming payload and user
      logger.info('DEBUG NOTE CREATION', {
        userId: user.id,
        userEmail: user.email,
        payload: payload,
        rawLabels: request.input('labels'),
        allInputs: request.all(),
      })
      console.log('DEBUG NOTE CREATION - User:', user.id, user.email)
      console.log('DEBUG NOTE CREATION - Payload:', JSON.stringify(payload))
      console.log('DEBUG NOTE CREATION - Raw labels input:', request.input('labels'))
      console.log('DEBUG NOTE CREATION - All inputs:', request.all())

      const noteData: Partial<Note> = {
        title: payload.title,
        content: payload.content ? await marked.parse(payload.content) : '',
        pinned: payload.pinned ?? false,
        userId: user.id, // ✅ FIXED: Ensure user_id is set
        imageUrl: payload.imageUrl || null, // Use the uploaded image URL from payload
        imagePublicId: null, // Will be set if we need to upload a new image
        gif_url: payload.gif_url || null,
        gif_slug: payload.gif_slug || null,
        labels: payload.labels || null, // ✅ FIXED: Handle undefined labels
      }

      // Debug: log noteData before create
      logger.info('DEBUG NOTE DATA', { noteData })
      console.log('DEBUG NOTE DATA:', JSON.stringify(noteData))

      // Handle image upload if a new file is provided (for updates)
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
      } else if (payload.imageUrl) {
        // Use the already uploaded image URL
        logger.info('Using existing image URL', { url: payload.imageUrl })
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
        // ✅ FIXED: Ensure user_id is explicitly set
        note = await Note.create({
          ...noteData,
          userId: user.id, // Double-check user_id is set
        })

        logger.info('DEBUG NOTE CREATED SUCCESSFULLY', {
          noteId: note.id,
          userId: note.userId,
          title: note.title,
        })
        console.log('DEBUG NOTE CREATED SUCCESSFULLY:', {
          id: note.id,
          userId: note.userId,
          title: note.title,
        })
      } catch (err) {
        logger.error('ERROR CREATING NOTE', {
          error: err.message,
          userId: user.id,
          noteData: noteData,
        })
        console.log('ERROR CREATING NOTE:', err.message)
        throw err
      }

      // ✅ FIXED: Proper response handling for Inertia
      if (this.isInertiaRequest(request)) {
        // For Inertia requests, redirect to notes page
        return response.redirect('/notes')
      } else {
        // For API requests, return JSON with complete note data
        return response.created({
          message: 'Note created successfully',
          note: {
            id: note.id,
            title: note.title,
            content: note.content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            pinned: note.pinned,
            imageUrl: note.imageUrl,
            gif_url: note.gif_url,
            gif_slug: note.gif_slug,
            labels: note.labels,
            userId: note.userId,
          },
        })
      }
    } catch (error) {
      logger.error('Note creation failed', {
        error: error.message,
        stack: error.stack,
        userId: auth.user?.id || 'unknown',
      })

      // ✅ FIXED: Better error handling for Inertia
      if (this.isInertiaRequest(request)) {
        if (error.message?.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
          return response.redirect('/login')
        }

        // ✅ FIXED: Return proper Inertia response for validation errors
        if (error.messages) {
          // For Inertia requests, redirect back with validation errors
          return response.redirect().back()
        }

        // Generic error for Inertia - redirect back
        return response.redirect().back()
      } else {
        // For API requests, return JSON error
        return response.status(400).json({
          message: 'Note creation failed',
          error: error.messages?.messages || error.message,
          debug: error,
        })
      }
    }
  }

  // Keep the existing uploadToCloudinary method exactly as is
  private async uploadToCloudinary(image: MultipartFile) {
    const fileName = `${cuid()}.${image.extname}` // Use extname instead of clientName
    const uploadPath = app.tmpPath('uploads', fileName)

    logger.info('Starting Cloudinary upload', {
      fileName,
      uploadPath,
      originalSize: image.size,
      extname: image.extname,
    })

    // Validate file size before processing
    if (image.size > 5 * 1024 * 1024) {
      // 5MB
      throw new Error('File size exceeds 5MB limit')
    }

    try {
      await image.move(app.tmpPath('uploads'), {
        name: fileName,
        overwrite: false,
      })

      logger.info('File moved to temp directory', { uploadPath })

      const uploadOptions = {
        folder: process.env.CLOUDINARY_FOLDER || 'notes',
        public_id: `note_${Date.now()}`,
        resource_type: 'auto' as const, // ✅ FIXED: Proper type casting
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        timeout: 30000, // 30 second timeout
      }

      logger.info('Uploading to Cloudinary', uploadOptions)

      const result = await cloudinary.uploader.upload(uploadPath, uploadOptions)

      logger.info('Cloudinary upload successful', {
        url: result.secure_url,
        publicId: result.public_id,
        bytes: result.bytes,
      })

      return result
    } catch (uploadError) {
      logger.error('Cloudinary upload failed', {
        error: uploadError.message,
        stack: uploadError.stack,
        fileName,
        uploadPath,
      })
      throw uploadError
    } finally {
      // Cleanup temp file after upload
      try {
        await fs.promises.unlink(uploadPath)
        logger.info('Temp file cleaned up', { uploadPath })
      } catch (cleanupError) {
        logger.warn('Failed to cleanup temp file', {
          uploadPath,
          error: cleanupError.message,
        })
      }
    }
  }

  async update({ request, response, params, auth }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()
      const { id: noteId } = await request.validateUsing(noteIdValidator, { data: params })
      const payload = await request.validateUsing(updateNoteValidator)
      const note = await Note.query().where('id', noteId).where('userId', user.id).firstOrFail()

      const updateData: Partial<Note> = {
        title: payload.title ?? note.title,
        content: payload.content ? await marked.parse(payload.content) : note.content,
        pinned: payload.pinned ?? note.pinned,
        imageUrl: payload.imageUrl ?? note.imageUrl, // Handle imageUrl updates
        // ✅ FIXED: Handle GIF removal properly - only update if explicitly provided
        gif_url: payload.gif_url !== undefined ? payload.gif_url : note.gif_url,
        gif_slug: payload.gif_slug !== undefined ? payload.gif_slug : note.gif_slug,
        // ✅ FIXED: Only update labels if they are explicitly provided and not null
        labels: payload.labels !== undefined ? payload.labels : note.labels,
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

      // For Inertia requests, redirect to the note show page
      if (this.isInertiaRequest(request)) {
        return response.redirect(`/notes/${note.id}`)
      }

      // For API requests, return JSON response
      return response.ok({
        message: 'Note updated successfully',
        note: {
          id: note.id,
          title: note.title,
          content: note.content,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          pinned: note.pinned,
          imageUrl: note.imageUrl,
          gif_url: note.gif_url,
          gif_slug: note.gif_slug,
          labels: note.labels,
          userId: note.userId,
        },
      })
    } catch (error) {
      logger.error(error)
      // For Inertia requests, redirect back
      if (this.isInertiaRequest(request)) {
        return response.redirect().back()
      }

      // For API requests, return JSON error
      return response.status(400).send({
        message: 'Failed to update note',
        error: error.messages?.messages || error.message,
      })
    }
  }

  async destroy({ request, params, response, auth }: HttpContext) {
    try {
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      const { id: noteId } = await request.validateUsing(noteIdValidator, { data: params })
      const note = await Note.query()
        .where('id', noteId)
        .where('userId', user.id) // Ensure user owns the note
        .firstOrFail()

      note.deletedAt = DateTime.now()
      await note.save()

      return this.isInertiaRequest(request)
        ? response.redirect('/notes')
        : response.ok({
            message: 'Note moved to trash',
            success: true,
            noteId: noteId,
          })
    } catch (error) {
      return response.status(400).send({ message: 'Failed to delete note', error: error.message })
    }
  }

  async restore({ request, params, response, auth }: HttpContext) {
    try {
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      const { id: noteId } = await request.validateUsing(noteIdValidator, { data: params })
      const note = await Note.query()
        .where('id', noteId)
        .where('userId', user.id) // Ensure user owns the note
        .firstOrFail()

      note.deletedAt = null
      await note.save()

      return response.ok({
        message: 'Note restored successfully',
        note: {
          id: note.id,
          title: note.title,
          content: note.content,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          pinned: note.pinned,
          imageUrl: note.imageUrl,
          gif_url: note.gif_url,
          gif_slug: note.gif_slug,
          labels: note.labels,
          userId: note.userId,
        },
      })
    } catch (error) {
      return response.status(400).send({ message: 'Restore failed', error: error.message })
    }
  }

  async togglePin({ request, response, params, auth }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()
      const { id: noteId } = await request.validateUsing(noteIdValidator, { data: params })

      const note = await Note.query()
        .where('id', noteId)
        .where('userId', user.id)
        .whereNull('deleted_at')
        .firstOrFail()

      note.pinned = !note.pinned
      await note.save()

      // For Inertia requests, redirect back to refresh the page
      if (this.isInertiaRequest(request)) {
        return response.redirect().back()
      }

      // For API requests, return JSON
      return response.ok({
        success: true,
        message: 'Pin status updated',
        note: note.serialize(),
      })
    } catch (error) {
      if (this.isInertiaRequest(request)) {
        return response.redirect().back()
      }
      return response.status(400).send({ message: 'Failed to toggle pin', error: error.message })
    }
  }

  // ✅ DEBUG: Simple test endpoint to debug upload issues
  async testUpload({ request, response, auth }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()

      return response.ok({
        message: 'Test endpoint working',
        userId: user.id,
        hasFile: !!request.file('image'),
        contentType: request.header('content-type'),
        allFiles: request.allFiles(),
        body: request.all(),
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Test endpoint error',
        error: error.message,
        stack: error.stack,
      })
    }
  }

  async uploadImage({ request, response, auth }: HttpContext) {
    try {
      // ✅ FIXED: Add authentication to image upload
      await auth.authenticate()
      const user = auth.getUserOrFail()

      logger.info('Image upload request received', {
        userId: user.id,
        hasImage: !!request.file('image'),
        contentType: request.header('content-type'),
        allFiles: Object.keys(request.allFiles()),
      })

      // ✅ DEBUG: Try to get the image file directly first
      const imageFile = request.file('image')
      if (!imageFile) {
        logger.warn('No image file found in request')
        return response.status(400).send({ message: 'No image file provided' })
      }

      logger.info('Image file found', {
        fileName: imageFile.clientName,
        size: imageFile.size,
        extname: imageFile.extname,
        mimeType: imageFile.type,
        isValid: imageFile.isValid,
        hasErrors: imageFile.hasErrors,
        errors: imageFile.errors,
      })

      // ✅ DEBUG: Skip validation for now to test direct upload
      // const { image } = await request.validateUsing(uploadImageValidator)

      // Use the existing uploadToCloudinary method for consistency
      const uploadResult = await this.uploadToCloudinary(imageFile)

      logger.info('Image uploaded successfully to Cloudinary', {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        bytes: uploadResult.bytes,
      })

      return response.ok({
        message: 'Image uploaded successfully',
        imageUrl: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        asset_id: uploadResult.asset_id,
        bytes: uploadResult.bytes,
      })
    } catch (error) {
      logger.error('Image upload failed', {
        error: error.message,
        stack: error.stack,
        userId: auth.user?.id || 'unknown',
        errorCode: error.code,
        errorStatus: error.status,
        errorName: error.name,
      })
      return response.status(500).send({
        message: 'Image upload failed',
        error: error.message,
      })
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
      const { id: noteId } = await request.validateUsing(noteIdValidator, { data: params })

      // Find note and ensure user owns it
      const note = await Note.query()
        .where('id', noteId)
        .where('userId', user.id)
        .whereNull('deleted_at')
        .firstOrFail()

      // Generate unique UUID for sharing
      note.shareUuid = randomUUID()
      await note.save()

      const shareUrl = `/notes/shared/${note.shareUuid}`

      // For Inertia requests, redirect back to refresh the page
      if (this.isInertiaRequest(request)) {
        return response.redirect().back()
      }

      // For API/XMLHttpRequest requests, return JSON response
      return response.ok({
        message: 'Share link generated successfully',
        shareUrl,
        shareUuid: note.shareUuid,
      })
    } catch (error) {
      logger.error('Failed to generate share link:', {
        error: error.message,
        userId: auth.user?.id,
        noteId: params.id,
      })

      // For Inertia requests, redirect back with error
      if (this.isInertiaRequest(request)) {
        return response.redirect().back()
      }

      // For API requests, return JSON error
      return response.status(400).send({
        message: 'Failed to generate share link',
        error: error.message,
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

      logger.info('Attempting to view shared note with token:', { token })

      // Find note by share UUID, ensure it's not deleted
      const note = await Note.query()
        .where('shareUuid', token)
        .whereNull('deleted_at')
        .preload('user', (userQuery) => {
          userQuery.select('id', 'fullName', 'email') // Use fullName instead of username
        })
        .firstOrFail()

      logger.info('Found shared note:', { noteId: note.id, title: note.title })

      // Process content if it's markdown - handle both marked and marked.parse
      let processedContent: string = note.content || ''
      try {
        if (marked.parse && typeof marked.parse === 'function') {
          // marked.parse is async and returns a Promise<string>
          const parsedContent = await marked.parse(note.content || '')
          processedContent = parsedContent as string
        } else if (typeof marked === 'function') {
          processedContent = marked(note.content || '') as string
        }
      } catch (markdownError) {
        logger.warn('Markdown processing failed, using raw content:', markdownError)
        processedContent = note.content || ''
      }

      // Prepare note data for sharing (remove sensitive information)
      const sharedNoteData = {
        id: note.id,
        title: note.title,
        content: note.content,
        processedContent,
        imageUrl: note.imageUrl,
        gif_url: note.gif_url,
        gif_slug: note.gif_slug,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        user: {
          fullName: note.user.fullName,
          email: note.user.email,
        },
        isShared: true, // Flag to indicate this is a shared view
        shareUuid: note.shareUuid,
      }

      logger.info('Prepared shared note data:', { noteId: note.id, hasUser: !!note.user })

      // Always render the Inertia page for browser requests
      // Only return JSON for explicit API requests (with Accept: application/json header)
      const acceptsJson = request.header('accept')?.includes('application/json')
      const isApiRequest = request.header('x-requested-with') === 'XMLHttpRequest' && acceptsJson

      if (isApiRequest) {
        return response.ok({
          note: sharedNoteData,
          isReadOnly: true,
        })
      }

      // Default to Inertia rendering for all browser requests
      return inertia.render('notes/shared', {
        note: sharedNoteData,
        isReadOnly: true, // Ensure frontend knows this is read-only
      })
    } catch (error) {
      logger.error('Failed to retrieve shared note:', {
        error: error.message,
        stack: error.stack,
        token: params.token,
        headers: request.headers(),
      })

      // For browser requests, show custom 404 page
      const acceptsJson = request.header('accept')?.includes('application/json')
      const isApiRequest = request.header('x-requested-with') === 'XMLHttpRequest' && acceptsJson

      if (isApiRequest) {
        return response.status(404).send({
          message: 'Shared note not found or has been removed',
          error: error.message,
        })
      }

      return inertia.render('errors/404', {
        message: 'Shared note not found or has been removed',
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
      const { id: noteId } = await request.validateUsing(noteIdValidator, { data: params })

      // Find note and ensure user owns it
      const note = await Note.query()
        .where('id', noteId)
        .where('userId', user.id)
        .whereNull('deleted_at')
        .firstOrFail()

      // Remove share UUID
      note.shareUuid = null
      await note.save()

      // For Inertia requests, redirect back to refresh the page
      if (this.isInertiaRequest(request)) {
        return response.redirect().back()
      }

      // For API requests, return JSON response
      return response.ok({
        message: 'Share link revoked successfully',
        note: {
          id: note.id,
          title: note.title,
          content: note.content,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          pinned: note.pinned,
          imageUrl: note.imageUrl,
          gif_url: note.gif_url,
          gif_slug: note.gif_slug,
          labels: note.labels,
          userId: note.userId,
        },
      })
    } catch (error) {
      logger.error('Failed to revoke share link:', {
        error: error.message,
        userId: auth.user?.id,
        noteId: params.id,
      })

      // For Inertia requests, redirect back with error
      if (this.isInertiaRequest(request)) {
        return response.redirect().back()
      }

      // For API requests, return JSON error
      return response.status(400).send({
        message: 'Failed to revoke share link',
        error: error.message,
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
      const { id: noteId } = await request.validateUsing(noteIdValidator, { data: params })

      // Find note and ensure user owns it
      const note = await Note.query()
        .where('id', noteId)
        .where('userId', user.id)
        .whereNull('deleted_at')
        .firstOrFail()

      const shareData = {
        isShared: !!note.shareUuid,
        shareUrl: note.shareUuid ? `/notes/shared/${note.shareUuid}` : null,
        shareUuid: note.shareUuid,
      }

      // For Inertia requests, redirect back to refresh the page
      if (this.isInertiaRequest(request)) {
        return response.redirect().back()
      }

      // For API requests, return JSON response
      return response.ok(shareData)
    } catch (error) {
      logger.error('Failed to get share status:', error)

      // For Inertia requests, redirect back with error
      if (this.isInertiaRequest(request)) {
        return response.redirect().back()
      }

      // For API requests, return JSON error
      return response.status(400).send({
        message: 'Failed to get share status',
        error: error.message,
      })
    }
  }

  public async searchGifs({ request, response, auth }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()

      const apiKey = env.get('KLIPY_API_KEY')
      const { data } = await axios.get(`https://api.klipy.com/api/v1/${apiKey}/gifs/search`, {
        params: {
          q: request.input('q'),
          page: request.input('page', 1),
          per_page: request.input('limit', 5),
          content_filter: 'high',
          customer_id: user.id,
        },
      })

      if (data?.result && Array.isArray(data?.data?.data)) {
        return response.ok({
          data: data.data.data.map((gif: any) => ({
            id: gif.id,
            slug: gif.slug,
            url: gif.file?.md?.gif?.url || gif.file?.hd?.gif?.url || '',
            preview: gif.blur_preview || gif.file?.sm?.gif?.url || '',
            title: gif.title,
            width: gif.file?.md?.gif?.width || 300,
            height: gif.file?.md?.gif?.height || 200,
          })),
        })
      }

      return response.status(502).json({
        message: 'Unexpected Klipy API response',
        raw: data,
      })
    } catch (error) {
      logger.error('Klipy API failed', error)
      return response.status(error.response?.status || 500).json({
        message: 'Failed to search GIFs',
        error: error.response?.data?.message || error.message,
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

      const { gif_url: gifUrl, gif_slug: gifSlug } = request.only(['gif_url', 'gif_slug'])

      const note = await Note.query().where('id', params.id).where('userId', user.id).firstOrFail()

      note.gif_url = gifUrl
      note.gif_slug = gifSlug
      await note.save()

      // Track view in Klipy
      try {
        await axios.post(
          `https://api.klipy.com/api/v1/${env.get('KLIPY_API_KEY')}/gifs/view/${gifSlug}`,
          { customer_id: user.id }
        )
      } catch (trackError) {
        logger.warn('GIF view tracking failed', trackError)
      }

      return response.ok({
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        pinned: note.pinned,
        imageUrl: note.imageUrl,
        gif_url: note.gif_url,
        gif_slug: note.gif_slug,
        labels: note.labels,
        userId: note.userId,
      })
    } catch (error) {
      logger.error('GIF attachment failed', error)
      return response.status(error.response?.status || 500).json({
        message: 'Failed to attach GIF',
        error: error.response?.data?.message || error.message,
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

      const note = await Note.query().where('id', params.id).where('userId', user.id).firstOrFail()

      note.gif_url = null
      note.gif_slug = null
      await note.save()

      return response.ok({
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        pinned: note.pinned,
        imageUrl: note.imageUrl,
        gif_url: note.gif_url,
        gif_slug: note.gif_slug,
        labels: note.labels,
        userId: note.userId,
      })
    } catch (error) {
      logger.error('GIF removal failed', error)
      return response.status(500).json({
        message: 'Failed to remove GIF',
        error: error.message,
      })
    }
  }
}
