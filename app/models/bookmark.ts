import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Label from './label.js'

export default class Bookmark extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column()
  declare url: string

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column({ columnName: 'image_url' })
  declare imageUrl: string | null

  @column({ columnName: 'site_name' })
  declare siteName: string | null

  @column({ columnName: 'ai_generated_labels' })
  declare aiGeneratedLabels: string | null // JSON string of AI-generated labels

  @column({ columnName: 'ai_generated_summary' })
  declare aiGeneratedSummary: string | null // TL;DR summary

  @column({ columnName: 'is_favorite' })
  declare isFavorite: boolean

  @column()
  declare status: 'active' | 'archived' | 'deleted'

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relationships
  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @manyToMany(() => Label, {
    pivotTable: 'label_bookmark_pivots',
    pivotForeignKey: 'bookmark_id',
    pivotRelatedForeignKey: 'label_id',
  })
  declare labels: ManyToMany<typeof Label>

  // Scopes
  static active() {
    return this.query().where('status', 'active')
  }

  static favorites() {
    return this.query().where('isFavorite', true)
  }

  static archived() {
    return this.query().where('status', 'archived')
  }

  // Helper methods
  async toggleFavorite() {
    console.log(
      `⭐ [Bookmark] Toggling favorite for bookmark ${this.id}: ${this.isFavorite} -> ${!this.isFavorite}`
    )
    this.isFavorite = !this.isFavorite
    await this.save()
    console.log(`✅ [Bookmark] Favorite status updated for bookmark ${this.id}: ${this.isFavorite}`)
  }

  async archive() {
    console.log(`📦 [Bookmark] Archiving bookmark ${this.id}: ${this.status} -> archived`)
    this.status = 'archived'
    await this.save()
    console.log(`✅ [Bookmark] Bookmark ${this.id} archived successfully`)
  }

  async restore() {
    console.log(`🔄 [Bookmark] Restoring bookmark ${this.id}: ${this.status} -> active`)
    this.status = 'active'
    await this.save()
    console.log(`✅ [Bookmark] Bookmark ${this.id} restored successfully`)
  }

  async softDelete() {
    console.log(`🗑️ [Bookmark] Soft deleting bookmark ${this.id}: ${this.status} -> deleted`)
    this.status = 'deleted'
    this.deletedAt = DateTime.now()
    await this.save()
    console.log(`✅ [Bookmark] Bookmark ${this.id} soft deleted successfully`)
  }

  // Parse AI-generated labels
  getParsedLabels(): string[] {
    if (!this.aiGeneratedLabels) {
      console.log(`🏷️ [Bookmark] No AI labels found for bookmark ${this.id}`)
      return []
    }
    try {
      const labels = JSON.parse(this.aiGeneratedLabels)
      console.log(
        `🏷️ [Bookmark] Parsed ${labels.length} AI labels for bookmark ${this.id}: ${JSON.stringify(labels)}`
      )
      return labels
    } catch (error) {
      console.error(`❌ [Bookmark] Error parsing AI labels for bookmark ${this.id}:`, error)
      return []
    }
  }

  // Set AI-generated labels
  setParsedLabels(labels: string[]) {
    console.log(
      `🏷️ [Bookmark] Setting ${labels.length} AI labels for bookmark ${this.id}: ${JSON.stringify(labels)}`
    )
    this.aiGeneratedLabels = JSON.stringify(labels)
  }
}
