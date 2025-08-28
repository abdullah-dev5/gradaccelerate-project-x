import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, manyToMany, hasMany, beforeSave } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { AccessToken } from '@adonisjs/auth/access_tokens'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { ManyToMany, HasMany } from '@adonisjs/lucid/types/relations'
import Role from './role.js'
import Note from './note.js'
import Todo from './todo.js'
import Project from './project.js'

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

  @column.dateTime()
  declare deletedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  currentAccessToken?: AccessToken

  // ✅ ENHANCED: Proper relationships
  @hasMany(() => Note, {
    foreignKey: 'userId',
  })
  declare notes: HasMany<typeof Note>

  @hasMany(() => Todo, {
    foreignKey: 'userId',
  })
  declare todos: HasMany<typeof Todo>

  @hasMany(() => Project, {
    foreignKey: 'userId',
  })
  declare projects: HasMany<typeof Project>

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

  // ✅ ENHANCED: Before save hook for email normalization
  @beforeSave()
  static async normalizeEmail(user: User) {
    if (user.$dirty.email) {
      user.email = user.email.toLowerCase().trim()
    }
  }

  // ✅ ENHANCED: Helper methods for RBAC
  async hasRole(roleSlug: string): Promise<boolean> {
    const userRole = await Role.query()
      .whereHas('users', (usersQuery) => {
        usersQuery.where('users.id', this.id)
      })
      .where('slug', roleSlug)
      .first()
    return !!userRole
  }

  async hasPermission(permissionSlug: string): Promise<boolean> {
    const userPermission = await Role.query()
      .whereHas('users', (usersQuery) => {
        usersQuery.where('users.id', this.id)
      })
      .whereHas('permissions', (permissionsQuery) => {
        permissionsQuery.where('slug', permissionSlug)
      })
      .first()
    return !!userPermission
  }

  async isAdmin(): Promise<boolean> {
    return this.hasRole('admin')
  }

  // ✅ ENHANCED: Soft delete methods
  async softDelete() {
    this.deletedAt = DateTime.now()
    await this.save()
  }

  async restore() {
    this.deletedAt = null
    await this.save()
  }

  // ✅ ENHANCED: Scope for active users
  static active = this.query().whereNull('deleted_at')

  // ✅ ENHANCED: Scope for OAuth users
  static oauthUsers = this.query().whereNotNull('provider')

  // ✅ ENHANCED: Get user statistics
  async getStats() {
    const [notesCount, todosCount, projectsCount] = await Promise.all([
      this.related('notes' as any)
        .query()
        .count('* as total'),
      this.related('todos' as any)
        .query()
        .count('* as total'),
      this.related('projects' as any)
        .query()
        .count('* as total'),
    ])

    return {
      notes: notesCount[0].$extras.total,
      todos: todosCount[0].$extras.total,
      projects: projectsCount[0].$extras.total,
    }
  }

  // ✅ ENHANCED: Get recent activity
  async getRecentActivity(limit = 10) {
    const recentNotes = await this.related('notes' as any)
      .query()
      .orderBy('updated_at', 'desc')
      .limit(limit)

    const recentTodos = await this.related('todos' as any)
      .query()
      .orderBy('updated_at', 'desc')
      .limit(limit)

    return {
      notes: recentNotes,
      todos: recentTodos,
    }
  }
}
