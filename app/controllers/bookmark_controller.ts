  import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Bookmark from '#models/bookmark'
import User from '#models/user'
import Label from '#models/label'
import OpenGraphService from '#services/open_graph_service'
import GeminiAIService from '#services/gemini_ai_service'
import { createBookmarkValidator, updateBookmarkValidator, bookmarkIdValidator, bookmarkSearchValidator } from '#validators/bookmarks/create_bookmark_validator'

@inject()
export default class BookmarkController {
  /**
   * Display a list of bookmarks
   */
  async index({ auth, request, inertia }: HttpContext) {
    try {
      console.log('📚 [BookmarkController] Starting index method...')
      const user = auth.user!
      console.log(`👤 [BookmarkController] User: ${user.id} (${user.email})`)
      
      const query = request.qs()
      console.log(`🔍 [BookmarkController] Query parameters:`, query)

      // Validate search parameters
      console.log('✅ [BookmarkController] Validating search parameters...')
      const { search, sort, order, page, limit, status, isFavorite, labels } = 
        await bookmarkSearchValidator.validate(query)
      console.log(`✅ [BookmarkController] Validated parameters:`, { search, sort, order, page, limit, status, isFavorite, labels })

      // Build query
      console.log('🔨 [BookmarkController] Building database query...')
      let bookmarksQuery = Bookmark.query()
        .where('user_id', user.id)
        .where('status', '!=', 'deleted')
        .preload('labels')

      // Apply filters
      if (search) {
        console.log(`🔍 [BookmarkController] Applying search filter: ${search}`)
        bookmarksQuery = bookmarksQuery.where((query) => {
          query
            .where('title', 'like', `%${search}%`)
            .orWhere('description', 'like', `%${search}%`)
            .orWhere('url', 'like', `%${search}%`)
        })
      }

      if (status) {
        console.log(`🏷️ [BookmarkController] Applying status filter: ${status}`)
        bookmarksQuery = bookmarksQuery.where('status', status)
      }

      if (isFavorite !== undefined) {
        console.log(`⭐ [BookmarkController] Applying favorite filter: ${isFavorite}`)
        bookmarksQuery = bookmarksQuery.where('is_favorite', isFavorite)
      }

      if (labels && labels.length > 0) {
        console.log(`🏷️ [BookmarkController] Applying labels filter: ${JSON.stringify(labels)}`)
        bookmarksQuery = bookmarksQuery.whereHas('labels', (labelsQuery) => {
          labelsQuery.whereIn('id', labels)
        })
      }

      // Apply sorting
      const sortField = sort || 'created_at'
      const sortOrder = order || 'desc'
      console.log(`📊 [BookmarkController] Applying sorting: ${sortField} ${sortOrder}`)
      bookmarksQuery = bookmarksQuery.orderBy(sortField, sortOrder)

      // Apply pagination
      const pageNumber = page || 1
      const limitNumber = limit || 20
      console.log(`📄 [BookmarkController] Applying pagination: page ${pageNumber}, limit ${limitNumber}`)
      const bookmarks = await bookmarksQuery.paginate(pageNumber, limitNumber)
      console.log(`✅ [BookmarkController] Retrieved ${bookmarks.total} bookmarks (showing ${bookmarks.all().length})`)

      // Get labels for filtering
      console.log('🏷️ [BookmarkController] Fetching user labels...')
      const allLabels = await Label.query()
        .where('user_id', user.id)
        .orderBy('name')
      console.log(`✅ [BookmarkController] Retrieved ${allLabels.length} labels`)

      const responseData = {
        bookmarks: bookmarks.toJSON(),
        labels: allLabels,
        filters: { search, sort, order, status, isFavorite, labels },
      }
      
      console.log('✅ [BookmarkController] Rendering bookmarks index page...')
      return inertia.render('bookmarks/index', responseData)
    } catch (error) {
      console.error('❌ [BookmarkController] Error in index method:', error)
      throw error
    }
  }

  /**
   * API endpoint for getting bookmarks (returns JSON)
   */
  async apiIndex({ auth, request, response }: HttpContext) {
    try {
      console.log('📚 [BookmarkController] Starting API index method...')
      const user = auth.user!
      console.log(`👤 [BookmarkController] User: ${user.id} (${user.email})`)
      
      const query = request.qs()
      console.log(`🔍 [BookmarkController] API Query parameters:`, query)

      // Validate search parameters
      console.log('✅ [BookmarkController] Validating API search parameters...')
      const { search, sort, order, page, limit, status, isFavorite, labels } = 
        await bookmarkSearchValidator.validate(query)
      console.log(`✅ [BookmarkController] API Validated parameters:`, { search, sort, order, page, limit, status, isFavorite, labels })

      // Build query
      console.log('🔨 [BookmarkController] Building API database query...')
      let bookmarksQuery = Bookmark.query()
        .where('user_id', user.id)
        .where('status', '!=', 'deleted')

      // Apply filters
      if (search) {
        console.log(`🔍 [BookmarkController] Applying API search filter: ${search}`)
        bookmarksQuery = bookmarksQuery.where((query) => {
          query
            .where('title', 'like', `%${search}%`)
            .orWhere('description', 'like', `%${search}%`)
            .orWhere('url', 'like', `%${search}%`)
        })
      }

      if (status) {
        console.log(`🏷️ [BookmarkController] Applying API status filter: ${status}`)
        bookmarksQuery = bookmarksQuery.where('status', status)
      }

      if (isFavorite !== undefined) {
        console.log(`⭐ [BookmarkController] Applying API favorite filter: ${isFavorite}`)
        bookmarksQuery = bookmarksQuery.where('is_favorite', isFavorite)
      }

      if (labels && labels.length > 0) {
        console.log(`🏷️ [BookmarkController] Applying API labels filter: ${JSON.stringify(labels)}`)
        bookmarksQuery = bookmarksQuery.whereHas('labels', (labelsQuery) => {
          labelsQuery.whereIn('id', labels)
        })
      }

      // Apply sorting
      const sortField = sort || 'created_at'
      const sortOrder = order || 'desc'
      console.log(`📊 [BookmarkController] Applying API sorting: ${sortField} ${sortOrder}`)
      bookmarksQuery = bookmarksQuery.orderBy(sortField, sortOrder)

      // Apply pagination
      const pageNumber = page || 1
      const limitNumber = limit || 20
      console.log(`📄 [BookmarkController] Applying API pagination: page ${pageNumber}, limit ${limitNumber}`)
      const bookmarks = await bookmarksQuery.paginate(pageNumber, limitNumber)
      console.log(`✅ [BookmarkController] API Retrieved ${bookmarks.total} bookmarks (showing ${bookmarks.all().length})`)

      console.log('✅ [BookmarkController] Returning API JSON response...')
      return response.json(bookmarks.toJSON())
    } catch (error) {
      console.error('❌ [BookmarkController] Error in API index method:', error)
      return response.status(500).json({
        error: 'Failed to fetch bookmarks',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Show the form for creating a new bookmark
   */
  async create({ inertia }: HttpContext) {
    try {
      console.log('➕ [BookmarkController] Starting create method...')
      console.log('✅ [BookmarkController] Rendering bookmark create page...')
      return inertia.render('bookmarks/create')
    } catch (error) {
      console.error('❌ [BookmarkController] Error in create method:', error)
      throw error
    }
  }

  /**
   * Validate URL and extract Open Graph data
   */
  async validateUrl({ request, response }: HttpContext) {
    try {
      console.log('🔍 [BookmarkController] Starting validateUrl method...')
      const { url } = request.body()
      console.log(`🔗 [BookmarkController] Validating URL: ${url}`)
      
      if (!url) {
        console.log('❌ [BookmarkController] No URL provided in request body')
        return response.status(400).json({ 
          isValid: false, 
          error: 'URL is required' 
        })
      }

      console.log('🔍 [BookmarkController] Calling OpenGraphService.validateUrl...')
      const result = await OpenGraphService.validateUrl(url)
      console.log(`✅ [BookmarkController] URL validation result:`, result)
      
      return response.json(result)
    } catch (error) {
      console.error('❌ [BookmarkController] Error in validateUrl method:', error)
      return response.status(500).json({
        isValid: false,
        error: 'Failed to validate URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Store a newly created bookmark
   */
  async store({ auth, request, response }: HttpContext) {
    try {
      console.log('💾 [BookmarkController] Starting store method...')
      const user = auth.user!
      console.log(`👤 [BookmarkController] User: ${user.id} (${user.email})`)
      
      console.log('✅ [BookmarkController] Validating request body...')
      const data = await createBookmarkValidator.validate(request.body())
      console.log(`✅ [BookmarkController] Validated data:`, data)

      try {
        // Extract Open Graph data
        console.log('🔍 [BookmarkController] Extracting Open Graph data...')
        const openGraphData = await OpenGraphService.extractData(data.url)
        console.log(`✅ [BookmarkController] Open Graph data extracted:`, openGraphData)

        // Create bookmark with extracted data
        console.log('💾 [BookmarkController] Creating bookmark in database...')
        const bookmark = await Bookmark.create({
          userId: user.id,
          url: data.url,
          title: data.title || openGraphData.title,
          description: data.description || openGraphData.description,
          imageUrl: data.imageUrl || openGraphData.imageUrl,
          siteName: data.siteName || openGraphData.siteName,
          isFavorite: data.isFavorite || false,
          status: 'active',
        })
        console.log(`✅ [BookmarkController] Bookmark created with ID: ${bookmark.id}`)

        // Generate AI content asynchronously
        console.log('🤖 [BookmarkController] Starting AI content generation in background...')
        this.generateAIContentAsync(bookmark, openGraphData)

        // Handle labels if provided
        if (data.labels && data.labels.length > 0) {
          console.log(`🏷️ [BookmarkController] Attaching ${data.labels.length} labels...`)
          await this.attachLabels(bookmark, data.labels)
          console.log('✅ [BookmarkController] Labels attached successfully')
        }

        console.log('✅ [BookmarkController] Redirecting to bookmarks index...')
        return response.redirect('/bookmarks')
      } catch (error) {
        console.error('❌ [BookmarkController] Error creating bookmark:', error)
        return response.status(500).json({
          error: 'Failed to create bookmark',
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    } catch (error) {
      console.error('❌ [BookmarkController] Error in store method:', error)
      throw error
    }
  }

  /**
   * Display the specified bookmark
   */
  async show({ auth, params, inertia, response }: HttpContext) {
    try {
      console.log('👁️ [BookmarkController] Starting show method...')
      const user = auth.user!
      console.log(`👤 [BookmarkController] User: ${user.id} (${user.email})`)
      
      console.log('✅ [BookmarkController] Validating bookmark ID...')
      const { id } = await bookmarkIdValidator.validate(params)
      console.log(`🔍 [BookmarkController] Looking for bookmark ID: ${id}`)

      const bookmark = await Bookmark.query()
        .where('id', id)
        .where('user_id', user.id)
        .where('status', '!=', 'deleted')
        .preload('labels')
        .first()

      if (!bookmark) {
        console.log(`❌ [BookmarkController] Bookmark not found: ${id}`)
        return response.notFound({ error: 'Bookmark not found' })
      }

      console.log(`✅ [BookmarkController] Bookmark found: ${bookmark.title}`)
      console.log('✅ [BookmarkController] Rendering bookmark show page...')
      return inertia.render('bookmarks/show', { bookmark })
    } catch (error) {
      console.error('❌ [BookmarkController] Error in show method:', error)
      throw error
    }
  }

  /**
   * Show the form for editing the specified bookmark
   */
  async edit({ auth, params, inertia, response }: HttpContext) {
    try {
      console.log('✏️ [BookmarkController] Starting edit method...')
      const user = auth.user!
      console.log(`👤 [BookmarkController] User: ${user.id} (${user.email})`)
      
      console.log('✅ [BookmarkController] Validating bookmark ID...')
      const { id } = await bookmarkIdValidator.validate(params)
      console.log(`🔍 [BookmarkController] Looking for bookmark ID: ${id}`)

      const bookmark = await Bookmark.query()
        .where('id', id)
        .where('user_id', user.id)
        .where('status', '!=', 'deleted')
        .preload('labels')
        .first()

      if (!bookmark) {
        console.log(`❌ [BookmarkController] Bookmark not found: ${id}`)
        return response.notFound({ error: 'Bookmark not found' })
      }

      console.log(`✅ [BookmarkController] Bookmark found: ${bookmark.title}`)

      // Get all available labels for the user
      console.log('🏷️ [BookmarkController] Fetching user labels...')
      const allLabels = await Label.query()
        .where('user_id', user.id)
        .orderBy('name')
      console.log(`✅ [BookmarkController] Retrieved ${allLabels.length} labels`)

      console.log('✅ [BookmarkController] Rendering bookmark edit page...')
      return inertia.render('bookmarks/edit', { bookmark, allLabels })
    } catch (error) {
      console.error('❌ [BookmarkController] Error in edit method:', error)
      throw error
    }
  }

  /**
   * Update the specified bookmark
   */
  async update({ auth, params, request, response }: HttpContext) {
    try {
      console.log('🔄 [BookmarkController] Starting update method...')
      const user = auth.user!
      console.log(`👤 [BookmarkController] User: ${user.id} (${user.email})`)
      
      console.log('✅ [BookmarkController] Validating bookmark ID...')
      const { id } = await bookmarkIdValidator.validate(params)
      console.log(`🔍 [BookmarkController] Looking for bookmark ID: ${id}`)
      
      console.log('✅ [BookmarkController] Validating request body...')
      const data = await updateBookmarkValidator.validate(request.body())
      console.log(`✅ [BookmarkController] Validated update data:`, data)

      const bookmark = await Bookmark.query()
        .where('id', id)
        .where('user_id', user.id)
        .where('status', '!=', 'deleted')
        .first()

      if (!bookmark) {
        console.log(`❌ [BookmarkController] Bookmark not found: ${id}`)
        return response.notFound({ error: 'Bookmark not found' })
      }

      console.log(`✅ [BookmarkController] Bookmark found: ${bookmark.title}`)

      try {
        // Update bookmark
        console.log('💾 [BookmarkController] Updating bookmark...')
        bookmark.merge(data)
        await bookmark.save()
        console.log('✅ [BookmarkController] Bookmark updated successfully')

        // Handle labels if provided
        if (data.labels) {
          console.log(`🏷️ [BookmarkController] Updating ${data.labels.length} labels...`)
          await this.updateLabels(bookmark, data.labels)
          console.log('✅ [BookmarkController] Labels updated successfully')
        }

        console.log('✅ [BookmarkController] Redirecting to bookmark show page...')
        return response.redirect(`/bookmarks/${bookmark.id}`)
      } catch (error) {
        console.error('❌ [BookmarkController] Error updating bookmark:', error)
        return response.status(500).json({
          error: 'Failed to update bookmark',
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    } catch (error) {
      console.error('❌ [BookmarkController] Error in update method:', error)
      throw error
    }
  }

  /**
   * Remove the specified bookmark
   */
  async destroy({ auth, params, response }: HttpContext) {
    try {
      console.log('🗑️ [BookmarkController] Starting destroy method...')
      const user = auth.user!
      console.log(`👤 [BookmarkController] User: ${user.id} (${user.email})`)
      
      console.log('✅ [BookmarkController] Validating bookmark ID...')
      const { id } = await bookmarkIdValidator.validate(params)
      console.log(`🔍 [BookmarkController] Looking for bookmark ID: ${id}`)

      const bookmark = await Bookmark.query()
        .where('id', id)
        .where('user_id', user.id)
        .where('status', '!=', 'deleted')
        .first()

      if (!bookmark) {
        console.log(`❌ [BookmarkController] Bookmark not found: ${id}`)
        return response.notFound({ error: 'Bookmark not found' })
      }

      console.log(`✅ [BookmarkController] Bookmark found: ${bookmark.title}`)

      try {
        console.log('🗑️ [BookmarkController] Soft deleting bookmark...')
        await bookmark.softDelete()
        console.log('✅ [BookmarkController] Bookmark deleted successfully')
        return response.json({ message: 'Bookmark deleted successfully' })
      } catch (error) {
        console.error('❌ [BookmarkController] Error deleting bookmark:', error)
        return response.status(500).json({
          error: 'Failed to delete bookmark',
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    } catch (error) {
      console.error('❌ [BookmarkController] Error in destroy method:', error)
      throw error
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite({ auth, params, response }: HttpContext) {
    try {
      console.log('⭐ [BookmarkController] Starting toggleFavorite method...')
      const user = auth.user!
      console.log(`👤 [BookmarkController] User: ${user.id} (${user.email})`)
      
      console.log('✅ [BookmarkController] Validating bookmark ID...')
      const { id } = await bookmarkIdValidator.validate(params)
      console.log(`🔍 [BookmarkController] Looking for bookmark ID: ${id}`)

      const bookmark = await Bookmark.query()
        .where('id', id)
        .where('user_id', user.id)
        .where('status', '!=', 'deleted')
        .first()

      if (!bookmark) {
        console.log(`❌ [BookmarkController] Bookmark not found: ${id}`)
        return response.notFound({ error: 'Bookmark not found' })
      }

      console.log(`✅ [BookmarkController] Bookmark found: ${bookmark.title}`)
      console.log(`⭐ [BookmarkController] Current favorite status: ${bookmark.isFavorite}`)

      try {
        console.log('🔄 [BookmarkController] Toggling favorite status...')
        await bookmark.toggleFavorite()
        console.log(`✅ [BookmarkController] Favorite status updated to: ${bookmark.isFavorite}`)
        
        return response.json({ 
          message: 'Favorite status updated',
          isFavorite: bookmark.isFavorite 
        })
      } catch (error) {
        console.error('❌ [BookmarkController] Error toggling favorite:', error)
        return response.status(500).json({
          error: 'Failed to update favorite status',
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    } catch (error) {
      console.error('❌ [BookmarkController] Error in toggleFavorite method:', error)
      throw error
    }
  }

  /**
   * Archive bookmark
   */
  async archive({ auth, params, response }: HttpContext) {
    try {
      console.log('📦 [BookmarkController] Starting archive method...')
      const user = auth.user!
      console.log(`👤 [BookmarkController] User: ${user.id} (${user.email})`)
      
      console.log('✅ [BookmarkController] Validating bookmark ID...')
      const { id } = await bookmarkIdValidator.validate(params)
      console.log(`🔍 [BookmarkController] Looking for bookmark ID: ${id}`)

      const bookmark = await Bookmark.query()
        .where('id', id)
        .where('user_id', user.id)
        .where('status', '!=', 'deleted')
        .first()

      if (!bookmark) {
        console.log(`❌ [BookmarkController] Bookmark not found: ${id}`)
        return response.notFound({ error: 'Bookmark not found' })
      }

      console.log(`✅ [BookmarkController] Bookmark found: ${bookmark.title}`)
      console.log(`📦 [BookmarkController] Current status: ${bookmark.status}`)

      try {
        console.log('📦 [BookmarkController] Archiving bookmark...')
        await bookmark.archive()
        console.log('✅ [BookmarkController] Bookmark archived successfully')
        return response.json({ message: 'Bookmark archived successfully' })
      } catch (error) {
        console.error('❌ [BookmarkController] Error archiving bookmark:', error)
        return response.status(500).json({
          error: 'Failed to archive bookmark',
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    } catch (error) {
      console.error('❌ [BookmarkController] Error in archive method:', error)
      throw error
    }
  }

  /**
   * Generate TL;DR summary using AI
   */
  async generateSummary({ auth, params, response }: HttpContext) {
    try {
      console.log('📖 [BookmarkController] Starting generateSummary method...')
      const user = auth.user!
      console.log(`👤 [BookmarkController] User: ${user.id} (${user.email})`)
      
      console.log('✅ [BookmarkController] Validating bookmark ID...')
      const { id } = await bookmarkIdValidator.validate(params)
      console.log(`🔍 [BookmarkController] Looking for bookmark ID: ${id}`)

      const bookmark = await Bookmark.query()
        .where('id', id)
        .where('user_id', user.id)
        .where('status', '!=', 'deleted')
        .first()

      if (!bookmark) {
        console.log(`❌ [BookmarkController] Bookmark not found: ${id}`)
        return response.notFound({ error: 'Bookmark not found' })
      }

      console.log(`✅ [BookmarkController] Bookmark found: ${bookmark.title}`)

      try {
        // Extract content for AI processing
        console.log('📝 [BookmarkController] Extracting content for AI processing...')
        const content = await OpenGraphService.extractTextContent(bookmark.url)
        
        if (!content) {
          console.log('❌ [BookmarkController] No content available for summarization')
          return response.status(400).json({ error: 'No content available for summarization' })
        }

        console.log(`📄 [BookmarkController] Content extracted (${content.length} chars): ${content.substring(0, 150)}...`)

        // Generate summary using AI
        console.log('🤖 [BookmarkController] Generating summary using Gemini AI...')
        const summary = await GeminiAIService.generateSummary(content)
        console.log(`✅ [BookmarkController] AI summary generated: ${summary}`)
        
        // Update bookmark with AI summary
        console.log('💾 [BookmarkController] Updating bookmark with AI summary...')
        bookmark.aiGeneratedSummary = summary
        await bookmark.save()
        console.log('✅ [BookmarkController] Bookmark updated with AI summary')

        return response.json({ 
          summary,
          message: 'Summary generated successfully' 
        })
      } catch (error) {
        console.error('❌ [BookmarkController] Error generating summary:', error)
        return response.status(500).json({
          error: 'Failed to generate summary',
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    } catch (error) {
      console.error('❌ [BookmarkController] Error in generateSummary method:', error)
      throw error
    }
  }

  /**
   * Regenerate AI labels
   */
  async regenerateLabels({ auth, params, response }: HttpContext) {
    try {
      console.log('🏷️ [BookmarkController] Starting regenerateLabels method...')
      const user = auth.user!
      console.log(`👤 [BookmarkController] User: ${user.id} (${user.email})`)
      
      console.log('✅ [BookmarkController] Validating bookmark ID...')
      const { id } = await bookmarkIdValidator.validate(params)
      console.log(`🔍 [BookmarkController] Looking for bookmark ID: ${id}`)

      const bookmark = await Bookmark.query()
        .where('id', id)
        .where('user_id', user.id)
        .where('status', '!=', 'deleted')
        .first()

      if (!bookmark) {
        console.log(`❌ [BookmarkController] Bookmark not found: ${id}`)
        return response.notFound({ error: 'Bookmark not found' })
      }

      console.log(`✅ [BookmarkController] Bookmark found: ${bookmark.title}`)

      try {
        // Extract content for AI processing
        console.log('📝 [BookmarkController] Extracting content for AI processing...')
        const content = await OpenGraphService.extractTextContent(bookmark.url)
        
        if (!content) {
          console.log('❌ [BookmarkController] No content available for label generation')
          return response.status(400).json({ error: 'No content available for label generation' })
        }

        console.log(`📄 [BookmarkController] Content extracted (${content.length} chars): ${content.substring(0, 150)}...`)

        // Generate labels using AI
        console.log('🤖 [BookmarkController] Generating labels using Gemini AI...')
        const labels = await GeminiAIService.generateLabels(content)
        console.log(`✅ [BookmarkController] AI labels generated: ${JSON.stringify(labels)}`)
        
        // Update bookmark with AI labels
        console.log('💾 [BookmarkController] Updating bookmark with AI labels...')
        bookmark.setParsedLabels(labels)
        await bookmark.save()
        console.log('✅ [BookmarkController] Bookmark updated with AI labels')

        return response.json({ 
          labels,
          message: 'Labels regenerated successfully' 
        })
      } catch (error) {
        console.error('❌ [BookmarkController] Error regenerating labels:', error)
        return response.status(500).json({
          error: 'Failed to regenerate labels',
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    } catch (error) {
      console.error('❌ [BookmarkController] Error in regenerateLabels method:', error)
      throw error
    }
  }

  /**
   * Private helper methods
   */
  private async generateAIContentAsync(bookmark: Bookmark, openGraphData: any) {
    try {
      console.log(`🤖 [BookmarkController] Starting background AI content generation for bookmark: ${bookmark.id}`)
      
      // Generate AI content in background
      const aiContent = await GeminiAIService.generateBookmarkContent(
        bookmark.url,
        bookmark.title,
        bookmark.description,
        openGraphData.description || ''
      )

      console.log(`✅ [BookmarkController] AI content generated:`, aiContent)

      // Update bookmark with AI content
      console.log('💾 [BookmarkController] Updating bookmark with AI content...')
      bookmark.setParsedLabels(aiContent.labels)
      bookmark.aiGeneratedSummary = aiContent.summary
      await bookmark.save()
      console.log(`✅ [BookmarkController] Bookmark ${bookmark.id} updated with AI content`)
    } catch (error) {
      console.error(`❌ [BookmarkController] Error generating AI content for bookmark ${bookmark.id}:`, error)
    }
  }

  private async attachLabels(bookmark: Bookmark, labelData: any[]) {
    try {
      console.log(`🏷️ [BookmarkController] Attaching ${labelData.length} labels to bookmark ${bookmark.id}...`)
      const labelIds = labelData.map(label => label.id)
      console.log(`🏷️ [BookmarkController] Label IDs: ${JSON.stringify(labelIds)}`)
      
      // Use the many-to-many relationship methods
      await bookmark.related('labels').attach(labelIds)
      console.log(`✅ [BookmarkController] Labels attached successfully to bookmark ${bookmark.id}`)
    } catch (error) {
      console.error(`❌ [BookmarkController] Error attaching labels to bookmark ${bookmark.id}:`, error)
    }
  }

  private async updateLabels(bookmark: Bookmark, labelData: any[]) {
    try {
      console.log(`🏷️ [BookmarkController] Updating labels for bookmark ${bookmark.id}...`)
      const labelIds = labelData.map(label => label.id)
      console.log(`🏷️ [BookmarkController] New label IDs: ${JSON.stringify(labelIds)}`)
      
      // Use the many-to-many relationship sync method
      await bookmark.related('labels').sync(labelIds)
      console.log(`✅ [BookmarkController] Labels updated successfully for bookmark ${bookmark.id}`)
    } catch (error) {
      console.error(`❌ [BookmarkController] Error updating labels for bookmark ${bookmark.id}:`, error)
    }
  }
}
