import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'todos'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.enum('priority', ['low', 'medium', 'high']).defaultTo('medium').notNullable()
      table.enum('status', ['pending', 'in_progress', 'completed']).defaultTo('pending').notNullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('priority')
      table.dropColumn('status')
    })
  }
}
