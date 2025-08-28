import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable().unique()
      table.string('slug').notNullable().unique()
      table.text('description').nullable()
      table.string('resource').nullable() // e.g., 'users', 'projects', 'notes'
      table.string('action').nullable() // e.g., 'create', 'read', 'update', 'delete'
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
