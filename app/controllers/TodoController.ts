import { HttpContext } from '@adonisjs/core/http'
import Todo from '#models/todo'
import { DateTime } from 'luxon'
import { createTodoValidator, updateTodoValidator } from '#validators/todos/todos_validator'

export default class TodosController {
    // GET /todos
    public async index({ response }: HttpContext) {
        try {
            const todos = await Todo.query()
                .whereNull('deleted_at')
                .preload('labels')

            return response.ok(todos)
        } catch (error) {
            return response.internalServerError({ message: 'Failed to fetch todos', error: error.message })
        }
    }

    // GET /todos/:id
    public async show({ params, response }: HttpContext) {
        try {
            const todo = await Todo.query()
                .where('id', params.id)
                .whereNull('deleted_at')
                .preload('labels')
                .first()

            if (!todo) {
                return response.notFound({ message: 'Todo not found' })
            }

            return response.ok(todo)
        } catch (error) {
            return response.internalServerError({ message: 'Failed to fetch todo', error: error.message })
        }
    }

    // POST /todos
    public async store({ request, response }: HttpContext) {
        try {
            const payload = await request.validateUsing(createTodoValidator)

            const { labelIds = [], ...todoData } = payload

            const todo = await Todo.create(todoData)

            if (labelIds.length > 0) {
                await todo.related('labels').attach(labelIds)
            }

            await todo.load('labels')
            return response.created(todo)
        } catch (error) {
            if ('messages' in error) {
                return response.unprocessableEntity({ errors: error.messages })
            }
            return response.internalServerError({ message: 'Failed to create todo', error: error.message })
        }
    }

    // PUT /todos/:id
    public async update({ params, request, response }: HttpContext) {
        try {
            const todo = await Todo.find(params.id)

            if (!todo || todo.deletedAt) {
                return response.notFound({ message: 'Todo not found or deleted' })
            }

            const payload = await request.validateUsing(updateTodoValidator)
            const { labelIds = [], ...updateData } = payload

            todo.merge(updateData)
            await todo.save()

            if (labelIds.length > 0) {
                await todo.related('labels').sync(labelIds)
            }

            await todo.load('labels')
            return response.ok(todo)
        } catch (error) {
            if ('messages' in error) {
                return response.unprocessableEntity({ errors: error.messages })
            }
            return response.internalServerError({ message: 'Failed to update todo', error: error.message })
        }
    }

    // DELETE /todos/:id
    public async destroy({ params, response }: HttpContext) {
        try {
            const todo = await Todo.find(params.id)

            if (!todo || todo.deletedAt) {
                return response.notFound({ message: 'Todo not found or already deleted' })
            }

            todo.deletedAt = DateTime.now()
            await todo.save()

            return response.noContent()
        } catch (error) {
            return response.internalServerError({ message: 'Failed to delete todo', error: error.message })
        }
    }
}
