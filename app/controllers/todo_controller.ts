import { HttpContext } from '@adonisjs/core/http'
import Todo from '#models/todo'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import {
  createTodoValidator,
  updateTodoValidator,
  todoIdValidator,
} from '#validators/todos/todos_validator'

export default class TodosController {
  /**
   * Helper method to check if request is from Inertia
   */
  private isInertiaRequest(request: HttpContext['request']): boolean {
    return request.header('x-inertia') === 'true'
  }

  // Alias method for backward compatibility - redirect to index
  async indexPage(context: HttpContext) {
    return this.index(context)
  }

  /**
   * Display all todos with pagination and filtering
   * GET /todos
   */
  // public async index({ request, inertia, response }: HttpContext) {
  //     try {
  //         const { page = 1, limit = 10, status, search = '' } = request.qs()

  //         const query = Todo.query()
  //             .whereNull('deleted_at')
  //             .preload('labels')

  //         // Filter by completion status if provided
  //         if (status === 'completed') {
  //             query.where('is_completed', true)
  //         } else if (status === 'pending') {
  //             query.where('is_completed', false)
  //         }

  //         // Search functionality
  //         if (search) {
  //             query.where((q) => {
  //                 q.where('title', 'LIKE', `%${search}%`)
  //                     .orWhere('description', 'LIKE', `%${search}%`)
  //             })
  //         }
  //         // In your index method
  //         const todos = await query
  //             .orderBy('created_at', 'desc')
  //             .paginate(Number(page), Number(limit))

  //         const baseUrl = request.original().split('?')[0] || '/todos'

  //         if (this.isInertiaRequest(request)) {
  //             return inertia.render('todos/index', {
  //                 todos: {
  //                     data: todos.serialize().data,
  //                     meta: {
  //                         total: todos.total,
  //                         per_page: todos.perPage,
  //                         current_page: todos.currentPage,
  //                         last_page: todos.lastPage,
  //                         first_page: 1,
  //                         first_page_url: `${baseUrl}?page=1`,
  //                         last_page_url: `${baseUrl}?page=${todos.lastPage}`,
  //                         next_page_url: todos.currentPage < todos.lastPage
  //                             ? `${baseUrl}?page=${todos.currentPage + 1}`
  //                             : null,
  //                         previous_page_url: todos.currentPage > 1
  //                             ? `${baseUrl}?page=${todos.currentPage - 1}`
  //                             : null
  //                     }
  //                 },
  //                 filters: { status, search, page, limit }
  //             })
  //         }

  //         return response.ok({
  //             data: todos.serialize(),
  //             filters: { status, search, page, limit }
  //         })

  //     } catch (error) {
  //         logger.error('Failed to fetch todos', { error: error.message, stack: error.stack })

  //         if (this.isInertiaRequest(request)) {
  //             return inertia.render('todos/index', {
  //                 todos: { data: [], meta: {} },
  //                 filters: { status: null, search: '', page: 1, limit: 10 },
  //                 error: 'Failed to load todos. Please try again.'
  //             })
  //         }

  //         return response.status(500).json({
  //             message: 'Failed to fetch todos',
  //             error: 'Internal server error'
  //         })
  //     }
  // }

  public async index({ request, inertia, response, auth }: HttpContext) {
    try {
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      const { page = 1, limit = 10, status, search = '' } = request.qs()

      const query = Todo.query()
        .where('userId', user.id) // Filter by authenticated user
        .whereNull('deleted_at')

      // Filtering logic remains the same
      if (status === 'completed') query.where('is_completed', true)
      else if (status === 'pending') query.where('is_completed', false)

      if (search) {
        query.where((q) => {
          q.where('title', 'LIKE', `%${search}%`).orWhere('description', 'LIKE', `%${search}%`)
        })
      }

      const paginatedTodos = await query.orderBy('created_at', 'desc').paginate(page, limit)

      // Manually construct pagination URLs
      const basePath = '/todos'
      const queryParams = new URLSearchParams()

      if (status) queryParams.append('status', status)
      if (search) queryParams.append('search', search)
      if (limit !== 10) queryParams.append('limit', limit.toString())

      const buildUrl = (pageNumber: number) =>
        `${basePath}?page=${pageNumber}${queryParams.toString() ? `&${queryParams.toString()}` : ''}`

      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        return inertia.render('todos/index', {
          todos: {
            data: paginatedTodos.all(),
            meta: {
              total: paginatedTodos.total,
              per_page: paginatedTodos.perPage,
              current_page: paginatedTodos.currentPage,
              last_page: paginatedTodos.lastPage,
              first_page: 1,
              first_page_url: buildUrl(1),
              last_page_url: buildUrl(paginatedTodos.lastPage),
              next_page_url:
                paginatedTodos.currentPage < paginatedTodos.lastPage
                  ? buildUrl(paginatedTodos.currentPage + 1)
                  : null,
              previous_page_url:
                paginatedTodos.currentPage > 1 ? buildUrl(paginatedTodos.currentPage - 1) : null,
            },
          },
          filters: { status, search, page, limit },
        })
      }

      return response.ok(paginatedTodos.toJSON())
    } catch (error) {
      logger.error('Failed to fetch todos', { error })

      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        // Handle authentication errors properly for Inertia/browser requests
        if (error.message.includes('Unauthorized') || error.code === 'E_UNAUTHORIZED_ACCESS') {
          return response.redirect('/login')
        }
        return inertia.render('todos/index', {
          todos: {
            data: [],
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
          },
          filters: { status: null, search: '', page: 1, limit: 10 },
          error: 'Failed to load todos. Please try again.',
        })
      }

      return response.status(500).json({
        message: 'Failed to fetch todos',
        error: error.message,
      })
    }
  }

  /**
   * Create a new todo
   * POST /todos
   */
  public async store({ request, response, session, auth }: HttpContext) {
    try {
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      const payload = await request.validateUsing(createTodoValidator)

      const { labels = [], ...todoData } = payload

      const todo = await Todo.create({
        ...todoData,
        labels,
        userId: user.id, // Set the authenticated user as owner
      })

      logger.info('Todo created successfully', { todoId: todo.id, title: todo.title })

      if (this.isInertiaRequest(request)) {
        session.flash('notification', {
          type: 'success',
          message: 'Todo created successfully!',
        })
        return response.redirect('/todos')
      }

      return response.status(201).json({
        message: 'Todo created successfully',
        data: todo,
      })
    } catch (error) {
      logger.error('Failed to create todo', {
        error: error.message,
        stack: error.stack,
        payload: request.only(['title', 'description', 'isCompleted']),
      })

      if (error.status === 422) {
        if (this.isInertiaRequest(request)) {
          session.flash('errors', error.messages)
          return response.redirect().back()
        }
        return response.status(422).json({
          message: 'Validation failed',
          errors: error.messages,
        })
      }

      if (this.isInertiaRequest(request)) {
        session.flash('notification', {
          type: 'error',
          message: 'Failed to create todo. Please try again.',
        })
        return response.redirect().back()
      }

      return response.status(500).json({
        message: 'Failed to create todo',
        error: 'Internal server error',
      })
    }
  }

  /**
   * Display a specific todo
   * GET /todos/:id
   */
  public async show({ params, request, inertia, response, auth }: HttpContext) {
    try {
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      // Validate the ID parameter
      await request.validateUsing(todoIdValidator, { data: { id: Number(params.id) } })

      const todo = await Todo.query()
        .where('id', params.id)
        .where('userId', user.id) // Ensure user owns the todo
        .whereNull('deleted_at')
        .first()

      if (!todo) {
        if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
          return inertia.render('errors/404', {
            message: 'Todo not found',
          })
        }
        return response.status(404).json({
          message: 'Todo not found',
        })
      }

      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        return inertia.render('todos/show', {
          todo: todo.serialize(),
        })
      }

      return response.ok({
        data: todo.serialize(),
      })
    } catch (error) {
      if (error.status === 422) {
        if (this.isInertiaRequest(request)) {
          return inertia.render('errors/404', {
            message: 'Invalid todo ID',
          })
        }
        return response.status(400).json({
          message: 'Invalid todo ID',
          errors: error.messages,
        })
      }

      logger.error('Failed to fetch todo', {
        error: error.message,
        todoId: params.id,
        stack: error.stack,
      })

      if (this.isInertiaRequest(request)) {
        return inertia.render('errors/500', {
          message: 'Failed to load todo',
        })
      }

      return response.status(500).json({
        message: 'Failed to fetch todo',
        error: 'Internal server error',
      })
    }
  }

  /**
   * Update a specific todo
   * PUT /todos/:id
   */
  public async update({ params, request, response, session, auth }: HttpContext) {
    try {
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      // Validate the ID parameter
      await request.validateUsing(todoIdValidator, { data: { id: Number(params.id) } })

      const todo = await Todo.query()
        .where('id', params.id)
        .where('userId', user.id) // Ensure user owns the todo
        .first()

      if (!todo || todo.deletedAt) {
        const message = 'Todo not found or has been deleted'

        if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
          session.flash('notification', {
            type: 'error',
            message,
          })
          return response.redirect('/todos')
        }

        return response.status(404).json({ message })
      }

      const payload = await request.validateUsing(updateTodoValidator)

      const { labels = [], ...updateData } = payload

      // Debug logging
      logger.info('Update payload received:', {
        todoId: params.id,
        payload,
        updateData,
        labels,
      })

      // Only update fields that are actually provided (not undefined)
      const fieldsToUpdate: any = {}

      if (updateData.title !== undefined) fieldsToUpdate.title = updateData.title
      if (updateData.description !== undefined) fieldsToUpdate.description = updateData.description
      if (updateData.isCompleted !== undefined) fieldsToUpdate.isCompleted = updateData.isCompleted
      if (updateData.priority !== undefined) fieldsToUpdate.priority = updateData.priority
      if (updateData.status !== undefined) fieldsToUpdate.status = updateData.status
      if (labels !== undefined) fieldsToUpdate.labels = labels

      logger.info('Fields to update:', { fieldsToUpdate })

      // Update todo fields only if they were provided
      if (Object.keys(fieldsToUpdate).length > 0) {
        todo.merge(fieldsToUpdate)
        await todo.save()
      }

      logger.info('Todo updated successfully', {
        todoId: todo.id,
        title: todo.title,
        updatedFields: Object.keys(updateData),
      })

      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        session.flash('notification', {
          type: 'success',
          message: 'Todo updated successfully!',
        })
        return response.redirect('/todos')
      }

      return response.ok({
        message: 'Todo updated successfully',
        data: todo.serialize(),
      })
    } catch (error) {
      logger.error('Failed to update todo', {
        error: error.message,
        todoId: params.id,
        stack: error.stack,
        payload: request.only(['title', 'description', 'isCompleted']),
      })

      if (error.status === 422) {
        if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
          session.flash('errors', error.messages)
          return response.redirect().back()
        }
        return response.status(422).json({
          message: 'Validation failed',
          errors: error.messages,
        })
      }

      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        session.flash('notification', {
          type: 'error',
          message: 'Failed to update todo. Please try again.',
        })
        return response.redirect().back()
      }

      return response.status(500).json({
        message: 'Failed to update todo',
        error: 'Internal server error',
      })
    }
  }

  /**
   * Update todo priority and status
   * PATCH /todos/:id/priority-status
   */
  public async updatePriorityStatus({ params, request, response, auth }: HttpContext) {
    try {
      await auth.authenticate()
      const user = auth.getUserOrFail()

      // Validate the ID parameter
      await request.validateUsing(todoIdValidator, { data: { id: Number(params.id) } })

      const todo = await Todo.query()
        .where('id', params.id)
        .where('userId', user.id)
        .whereNull('deleted_at')
        .first()

      if (!todo) {
        return response.status(404).json({
          message: 'Todo not found or has been deleted',
        })
      }

      // Get the request body
      const body = request.body()
      logger.info('Received update request body:', { body, todoId: params.id })

      let updatedField = ''
      let updatedValue = ''

      // Check if priority is being updated
      if (body.priority !== undefined && body.priority !== null && body.priority !== '') {
        logger.info('Updating priority:', {
          oldPriority: todo.priority,
          newPriority: body.priority,
        })
        // Validate priority value
        if (!['low', 'medium', 'high'].includes(body.priority)) {
          return response.status(400).json({
            message: 'Invalid priority value. Must be low, medium, or high.',
          })
        }
        // Update only priority
        todo.priority = body.priority
        updatedField = 'priority'
        updatedValue = body.priority
      }
      // Check if status is being updated
      else if (body.status !== undefined && body.status !== null && body.status !== '') {
        logger.info('Updating status:', { oldStatus: todo.status, newStatus: body.status })
        // Validate status value
        if (!['pending', 'in_progress', 'completed'].includes(body.status)) {
          return response.status(400).json({
            message: 'Invalid status value. Must be pending, in_progress, or completed.',
          })
        }
        // Update only status
        todo.status = body.status
        updatedField = 'status'
        updatedValue = body.status
      } else {
        logger.warn('No valid fields to update:', { body, todoId: params.id })
        return response.status(400).json({
          message: 'No valid fields to update. Please provide either priority or status.',
        })
      }

      // Save the todo with only the updated field
      await todo.save()

      logger.info('Todo field updated successfully', {
        todoId: todo.id,
        title: todo.title,
        updatedField: updatedField,
        newValue: updatedValue,
        oldPriority: todo.priority,
        oldStatus: todo.status,
      })

      return response.ok({
        message: `Todo ${updatedField} updated successfully`,
        data: {
          id: todo.id,
          priority: todo.priority,
          status: todo.status,
          title: todo.title,
          updatedField: updatedField,
          newValue: updatedValue,
        },
      })
    } catch (error) {
      if (error.status === 422) {
        return response.status(400).json({
          message: 'Validation failed',
          errors: error.messages,
        })
      }

      logger.error('Failed to update todo field', {
        error: error.message,
        todoId: params.id,
        stack: error.stack,
      })

      return response.status(500).json({
        message: 'Failed to update todo field',
        error: 'Internal server error',
      })
    }
  }

  /**
   * Toggle todo completion status
   * PATCH /todos/:id/toggle-status
   */
  public async toggleStatus({ params, request, response, auth }: HttpContext) {
    try {
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      // Validate the ID parameter
      await request.validateUsing(todoIdValidator, { data: { id: Number(params.id) } })

      const todo = await Todo.query()
        .where('id', params.id)
        .where('userId', user.id) // Ensure user owns the todo
        .first()

      if (!todo || todo.deletedAt) {
        return response.status(404).json({
          message: 'Todo not found or has been deleted',
        })
      }

      const previousStatus = todo.isCompleted
      todo.isCompleted = !todo.isCompleted
      await todo.save()

      logger.info('Todo status toggled', {
        todoId: todo.id,
        from: previousStatus,
        to: todo.isCompleted,
      })

      return response.ok({
        message: 'Todo status updated successfully',
        data: {
          id: todo.id,
          isCompleted: todo.isCompleted,
          title: todo.title,
        },
      })
    } catch (error) {
      if (error.status === 422) {
        return response.status(400).json({
          message: 'Invalid todo ID',
          errors: error.messages,
        })
      }

      logger.error('Failed to toggle todo status', {
        error: error.message,
        todoId: params.id,
        stack: error.stack,
      })

      return response.status(500).json({
        message: 'Failed to toggle todo status',
        error: 'Internal server error',
      })
    }
  }

  /**
   * Soft delete a todo
   * DELETE /todos/:id
   */
  public async destroy({ params, request, response, session, inertia, auth }: HttpContext) {
    try {
      await auth.authenticate() // Authenticate first
      const user = auth.getUserOrFail()
      // Validate the ID parameter
      await request.validateUsing(todoIdValidator, { data: { id: Number(params.id) } })

      const todo = await Todo.query()
        .where('id', params.id)
        .where('userId', user.id) // Ensure user owns the todo
        .first()

      if (!todo || todo.deletedAt) {
        const message = 'Todo not found or has already been deleted'

        if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
          session.flash('notification', {
            type: 'error',
            message,
          })
          return response.redirect('/todos')
        }

        return response.status(404).json({ message })
      }

      // Soft delete
      todo.deletedAt = DateTime.now()
      await todo.save()

      logger.info('Todo soft deleted', {
        todoId: todo.id,
        title: todo.title,
        deletedAt: todo.deletedAt,
      })

      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        session.flash('notification', {
          type: 'success',
          message: 'Todo deleted successfully!',
        })
        return response.redirect('/todos')
      }

      return response.ok({
        message: 'Todo deleted successfully',
        data: {
          id: todo.id,
          deletedAt: todo.deletedAt,
        },
      })
    } catch (error) {
      if (error.status === 422) {
        if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
          return inertia.render('errors/404', {
            message: 'Invalid todo ID',
          })
        }
        return response.status(400).json({
          message: 'Invalid todo ID',
          errors: error.messages,
        })
      }

      logger.error('Failed to delete todo', {
        error: error.message,
        todoId: params.id,
        stack: error.stack,
      })

      if (this.isInertiaRequest(request) || request.header('accept')?.includes('text/html')) {
        session.flash('notification', {
          type: 'error',
          message: 'Failed to delete todo. Please try again.',
        })
        return response.redirect('/todos')
      }

      return response.status(500).json({
        message: 'Failed to delete todo',
        error: 'Internal server error',
      })
    }
  }
}
