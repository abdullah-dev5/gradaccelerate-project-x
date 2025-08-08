import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { AccessToken } from '@adonisjs/auth/access_tokens'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Role from './role.js'

const AuthFinder = withAuthFinder(() => hash.use('bcrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string | null

  @column()
  declare provider: string | null

  @column({ columnName: 'provider_id' })
  declare providerId: string | null

  @column({ columnName: 'avatar_url' })
  declare avatarUrl: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  currentAccessToken?: AccessToken

  @manyToMany(() => Role, {
    pivotTable: 'user_roles',
    pivotTimestamps: true,
  })
  declare roles: ManyToMany<typeof Role>

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '30 days',
    prefix: 'oat_',
    table: 'auth_access_tokens',
    type: 'auth_token' as const,
    tokenSecretLength: 40,
  })

  // Helper methods for RBAC (simplified)
  async hasRole(roleSlug: string): Promise<boolean> {
    const Role = (await import('./role.js')).default
    const userRole = await Role.query()
      .whereHas('users', (usersQuery) => {
        usersQuery.where('users.id', this.id)
      })
      .where('slug', roleSlug)
      .first()
    return !!userRole
  }

  async isAdmin(): Promise<boolean> {
    return this.hasRole('admin')
  }
}
