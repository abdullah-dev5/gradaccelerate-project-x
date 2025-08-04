import Todo from '#models/todo'
import Label from '#models/label'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class TodoSeeder extends BaseSeeder {
  async run() {
    const labels = await Label.all()
    const labelIds = labels.map(label => label.id)

    const todos = [
      { title: 'Complete project', description: 'Finish all tasks' },
      { title: 'Buy groceries', description: 'Milk, eggs, bread' },
      { title: 'Call mom', isCompleted: true },
      { title: 'Write blog post', description: 'About AdonisJS' },
      { title: 'Fix leak', isCompleted: false },
      { title: 'Plan trip', description: 'Book hotels' },
      { title: 'Learn recipe', isCompleted: true },
      { title: 'Organize desk', isCompleted: false },
      { title: 'Review PRs', description: 'Code reviews' },
      { title: 'Morning jog', isCompleted: true }
    ]

    for (const todoData of todos) {
      const todo = await Todo.create(todoData)
      const randomLabels = labelIds.sort(() => 0.5 - Math.random()).slice(0, 2)
      await todo.related('labels').attach(randomLabels)
    }
  }
}