import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('email_notifications_enabled').defaultTo(true)
      table.boolean('web_notifications_enabled').defaultTo(true)
      table.boolean('reminder_emails_enabled').defaultTo(true)
      table.boolean('reminder_web_enabled').defaultTo(true)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('email_notifications_enabled')
      table.dropColumn('web_notifications_enabled')
      table.dropColumn('reminder_emails_enabled')
      table.dropColumn('reminder_web_enabled')
    })
  }
}
