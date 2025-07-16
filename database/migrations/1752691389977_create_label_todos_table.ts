import { BaseSchema } from '@adonisjs/lucid/schema'

export default class LabelTodo extends BaseSchema {
  protected tableName = 'label_todo'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('todo_id').unsigned().references('id').inTable('todos').onDelete('CASCADE')
      table.integer('label_id').unsigned().references('id').inTable('labels').onDelete('CASCADE')
      table.timestamps(true)

      // Ensure unique pairs
      table.unique(['todo_id', 'label_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}