import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    // Check if table exists using schema's connection
    const knex = (this.schema as any).client
    const tableExistsResult = await knex.raw(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      [this.tableName]
    )
    // SQLite returns array of rows, check if any rows exist
    const tableExists = Array.isArray(tableExistsResult) && tableExistsResult.length > 0 
      ? (Array.isArray(tableExistsResult[0]) ? tableExistsResult[0] : tableExistsResult)
      : []

    if (!Array.isArray(tableExists) || tableExists.length === 0) {
      // Table doesn't exist, create it with all columns
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
    } else {
      // Table exists, add missing columns using raw SQL via knex
      const columnsResult = await knex.raw(`PRAGMA table_info(${this.tableName})`)
      const columns = Array.isArray(columnsResult) && columnsResult[0] ? columnsResult[0] : columnsResult
      const columnNames = Array.isArray(columns) ? columns.map((col: any) => col.name) : []

      // Helper function to check and add column
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

      // Add missing columns
      await addColumnIfNotExists('provider', 'VARCHAR(20) NULL')
      await addColumnIfNotExists('provider_id', 'VARCHAR(255) NULL')
      await addColumnIfNotExists('avatar_url', 'VARCHAR(255) NULL')
      await addColumnIfNotExists(
        'email_notifications_enabled',
        'BOOLEAN DEFAULT 1'
      )
      await addColumnIfNotExists(
        'web_notifications_enabled',
        'BOOLEAN DEFAULT 1'
      )
      await addColumnIfNotExists(
        'reminder_emails_enabled',
        'BOOLEAN DEFAULT 1'
      )
      await addColumnIfNotExists('reminder_web_enabled', 'BOOLEAN DEFAULT 1')
      await addColumnIfNotExists('deleted_at', 'DATETIME NULL')
    }
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

