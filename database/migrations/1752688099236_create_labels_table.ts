import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Labels extends BaseSchema {
  protected tableName = 'labels'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('name').notNullable()
      table.string('color').nullable()  // Stores hex color (e.g., "#FF5733")
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}