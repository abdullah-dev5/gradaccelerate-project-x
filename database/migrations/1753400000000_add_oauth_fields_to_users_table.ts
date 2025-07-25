import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'users'

    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            // OAuth provider fields
            table.string('provider').nullable()
            table.string('provider_id').nullable()
            table.string('avatar_url').nullable()
            // Make password nullable for OAuth users
            table.string('password').nullable().alter()
        })
    }

    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('provider')
            table.dropColumn('provider_id')
            table.dropColumn('avatar_url')
            // Revert password to not nullable
            table.string('password').notNullable().alter()
        })
    }
}
