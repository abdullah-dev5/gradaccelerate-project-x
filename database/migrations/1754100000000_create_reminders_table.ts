import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'reminders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('title').notNullable()
      table.text('message').nullable()
      table.timestamp('remind_at', { useTz: true }).notNullable()
      table.json('channels').notNullable().defaultTo('[]')
      table.boolean('sent_web').notNullable().defaultTo(false)
      table.boolean('sent_email').notNullable().defaultTo(false)
      table.timestamp('sent_at', { useTz: true }).nullable()

      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
