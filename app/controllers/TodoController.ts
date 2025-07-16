import { HttpContext } from '@adonisjs/core/http'
import Todo from '#models/todo'
import { DateTime } from 'luxon'

export default class TodosController {
    // Get all todos
    public async index({ }: HttpContext) {
        return await Todo.query()
            .whereNull('deleted_at')
            .preload('labels')
    }

    // Get single todo
    public async show({ params, response }: HttpContext) {
        const todo = await Todo.query()
            .where('id', params.id)
            .whereNull('deleted_at')
            .preload('labels')
            .first()

        if (!todo) {
            return response.notFound({ message: 'Todo not found' })
        }

        return todo
    }

    // Create a todo
    public async store({ request }: HttpContext) {
        const { labelIds, ...data } = request.only(['title', 'description', 'isCompleted', 'labelIds'])
        const todo = await Todo.create(data)

        if (labelIds) await todo.related('labels').attach(labelIds)
        await todo.load('labels')
        return todo
    }

    // Update a todo
    public async update({ params, request }: HttpContext) {
        const todo = await Todo.findOrFail(params.id)
        const { labelIds, ...data } = request.only(['title', 'description', 'isCompleted', 'labelIds'])

        todo.merge(data)
        await todo.save()

        if (labelIds) await todo.related('labels').sync(labelIds)
        await todo.load('labels')
        return todo
    }

    // Soft delete
    public async destroy({ params, response }: HttpContext) {
        const todo = await Todo.findOrFail(params.id)
        todo.deletedAt = DateTime.now()
        await todo.save()
        return response.noContent()
    }
}