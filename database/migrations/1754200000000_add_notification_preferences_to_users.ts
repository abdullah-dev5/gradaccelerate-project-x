import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    // Use schema's connection
    const knex = (this.schema as any).client
    
    // Check which columns already exist
    const columnsResult = await knex.raw(`PRAGMA table_info(${this.tableName})`)
    const columns = Array.isArray(columnsResult) && columnsResult[0] ? columnsResult[0] : columnsResult
    const columnNames = Array.isArray(columns) ? columns.map((col: any) => col.name) : []

    // Helper function to add column if it doesn't exist
    const addColumnIfNotExists = async (
      columnName: string,
      columnDef: string
    ) => {
      try {
        if (!columnNames.includes(columnName)) {
          await knex.raw(
            `ALTER TABLE ${this.tableName} ADD COLUMN ${columnName} ${columnDef}`
          )
        }
      } catch (error: any) {
        if (!String(error?.message || '').includes('duplicate column name')) {
          throw error
        }
      }
    }

    // Add notification preference columns only if they don't exist
    await addColumnIfNotExists(
      'email_notifications_enabled',
      'BOOLEAN DEFAULT 1'
    )
    await addColumnIfNotExists('web_notifications_enabled', 'BOOLEAN DEFAULT 1')
    await addColumnIfNotExists(
      'reminder_emails_enabled',
      'BOOLEAN DEFAULT 1'
    )
    await addColumnIfNotExists('reminder_web_enabled', 'BOOLEAN DEFAULT 1')
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
