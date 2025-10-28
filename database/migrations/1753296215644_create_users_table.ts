import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('full_name', 255).nullable()
      table.string('email', 254).notNullable().unique()
      table.string('password', 255).nullable() // Allow null for OAuth users
      table.string('provider', 20).nullable()
      table.string('provider_id', 255).nullable()
      table.string('avatar_url', 255).nullable()
      table.boolean('email_notifications_enabled').defaultTo(true)
      table.boolean('web_notifications_enabled').defaultTo(true)
      table.boolean('reminder_emails_enabled').defaultTo(true)
      table.boolean('reminder_web_enabled').defaultTo(true)
      table.dateTime('deleted_at').nullable() // Soft deletes
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

