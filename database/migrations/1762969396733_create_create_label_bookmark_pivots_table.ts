import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'label_bookmark_pivots'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('bookmark_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('bookmarks')
        .onDelete('CASCADE')
      table
        .integer('label_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('labels')
        .onDelete('CASCADE')
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
      table.unique(['bookmark_id', 'label_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}