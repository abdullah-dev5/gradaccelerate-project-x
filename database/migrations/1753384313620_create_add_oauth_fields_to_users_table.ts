import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // OAuth provider fields
      table.string('provider').nullable() // 'google', 'github', etc.
      table.string('provider_id').nullable() // OAuth provider's user ID
      table.string('avatar_url').nullable() // User's profile picture from OAuth provider

      // Make password nullable for OAuth users
      table.string('password').nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('provider')
      table.dropColumn('provider_id')
      table.dropColumn('avatar_url')

      // Revert password to not nullable (this might cause issues if OAuth users exist)
      table.string('password').notNullable().alter()
    })
  }
}
