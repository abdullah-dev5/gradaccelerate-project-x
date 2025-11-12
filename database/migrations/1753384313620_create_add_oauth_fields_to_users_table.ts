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

    // Add OAuth columns only if they don't exist
    await addColumnIfNotExists('provider', 'VARCHAR(20) NULL')
    await addColumnIfNotExists('provider_id', 'VARCHAR(255) NULL')
    await addColumnIfNotExists('avatar_url', 'VARCHAR(255) NULL')

    // Note: SQLite doesn't support changing column nullability directly
    // The password column nullability is handled in create_users_table migration
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('provider')
      table.dropColumn('provider_id')
      table.dropColumn('avatar_url')
    })
  }
}
