import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bookmarks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('url', 2048).notNullable()
      table.string('title', 255).notNullable()
      table.text('description').nullable()
      table.string('image_url', 500).nullable()
      table.string('site_name', 100).nullable()
      table.text('ai_generated_labels').nullable() // JSON string
      table.text('ai_generated_summary').nullable() // TL;DR summary
      table.boolean('is_favorite').defaultTo(false)
      table.enum('status', ['active', 'archived', 'deleted']).defaultTo('active')
      table.dateTime('deleted_at').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}