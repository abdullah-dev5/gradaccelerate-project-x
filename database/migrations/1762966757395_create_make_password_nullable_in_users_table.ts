import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    // Use schema's connection
    const knex = (this.schema as any).client
    
    // Check if password column is already nullable
    const columnsResult = await knex.raw(`PRAGMA table_info(${this.tableName})`)
    // Handle different result formats from knex.raw
    let columns: any[] = []
    if (Array.isArray(columnsResult)) {
      // If it's an array of arrays (SQLite returns rows as arrays)
      if (columnsResult[0] && Array.isArray(columnsResult[0])) {
        // Map array format to object format
        const headers = ['cid', 'name', 'type', 'notnull', 'dflt_value', 'pk']
        columns = columnsResult.map((row: any[]) => {
          const obj: any = {}
          headers.forEach((header, idx) => {
            obj[header] = row[idx]
          })
          return obj
        })
      } else {
        // Already in object format
        columns = columnsResult
      }
    }
    
    const passwordColumn = columns.find((col: any) => col.name === 'password')
    
    // If password column doesn't exist, skip
    if (!passwordColumn) {
      console.log('Password column does not exist. Skipping migration.')
      return
    }
    
    // Check if it's already nullable (notnull === 0 means nullable)
    if (passwordColumn.notnull === 0) {
      console.log('Password column is already nullable. Skipping migration.')
      return
    }
    
    console.log('Password column is NOT NULL (notnull=' + passwordColumn.notnull + '). Recreating table to allow NULL values...')
    
    // SQLite doesn't support ALTER COLUMN, so we need to recreate the table
    // Step 1: Create new table with correct schema
    await knex.raw(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name VARCHAR(255) NULL,
        email VARCHAR(254) NOT NULL UNIQUE,
        password VARCHAR(255) NULL,
        provider VARCHAR(20) NULL,
        provider_id VARCHAR(255) NULL,
        avatar_url VARCHAR(255) NULL,
        email_notifications_enabled BOOLEAN DEFAULT 1,
        web_notifications_enabled BOOLEAN DEFAULT 1,
        reminder_emails_enabled BOOLEAN DEFAULT 1,
        reminder_web_enabled BOOLEAN DEFAULT 1,
        deleted_at DATETIME NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NULL
      )
    `)
    
    // Step 2: Copy all data from old table to new table
    await knex.raw(`
      INSERT INTO users_new (
        id, full_name, email, password, provider, provider_id, avatar_url,
        email_notifications_enabled, web_notifications_enabled,
        reminder_emails_enabled, reminder_web_enabled,
        deleted_at, created_at, updated_at
      )
      SELECT 
        id, full_name, email, password, provider, provider_id, avatar_url,
        email_notifications_enabled, web_notifications_enabled,
        reminder_emails_enabled, reminder_web_enabled,
        deleted_at, created_at, updated_at
      FROM users
    `)
    
    // Step 3: Drop old table
    await knex.raw(`DROP TABLE users`)
    
    // Step 4: Rename new table to users
    await knex.raw(`ALTER TABLE users_new RENAME TO users`)
    
    // Step 5: Recreate indexes if they exist
    // (SQLite will recreate the unique constraint on email automatically)
    
    console.log('Successfully made password column nullable.')
  }

  async down() {
    // Note: This down migration is complex and may cause data loss
    // It's safer to manually fix if needed
    console.warn('Down migration not implemented. Manual intervention may be required.')
  }
}