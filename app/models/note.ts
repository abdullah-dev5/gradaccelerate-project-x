import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, manyToMany, beforeDelete } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Label from './label.js'
import cloudinary from '#config/cloudinary'
import { Exception } from '@adonisjs/core/exceptions'

export default class Note extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column()
  declare title: string

  @column()
  declare content: string

  @column()
  declare pinned: boolean

  @column({ columnName: 'gif_url' })
  declare gif_url: string | null

  @column({ columnName: 'gif_slug' })
  declare gif_slug: string | null // Added for tracking

  @column({ columnName: 'image_url' })
  declare imageUrl: string | null

  @column({ columnName: 'image_public_id' })
  declare imagePublicId: string | null

  @column({ columnName: 'share_uuid' })
  declare shareUuid: string | null

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @manyToMany(() => Label, {
    pivotTable: 'label_note',
    pivotTimestamps: true,
  })
  declare labels: ManyToMany<typeof Label>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @beforeDelete()
  static async cleanupCloudinaryAssets(note: Note) {
    if (note.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(note.imagePublicId)
      } catch (error) {
        throw new Exception(`Failed to cleanup Cloudinary assets: ${error.message}`, {
          status: 500,
        })
      }
    }
  }

  serialize() {
    return {
      ...super.serialize(),
      gif_url: this.gif_url,
      gif_slug: this.gif_slug,
      gifDimensions: this.getGifDimensions(), // Added for frontend display
      // label logic removed
      isShared: !!this.shareUuid,
      hasImage: !!this.imageUrl,
      hasGif: !!this.gif_url, // Added for frontend checks
    }
  }

  /**
   * Get GIF dimensions for proper display
   */
  private getGifDimensions() {
    if (!this.gif_url) return null

    // Extract dimensions from URL if available (example implementation)
    const match = this.gif_url.match(/_(\d+)x(\d+)\.gif$/i)
    if (match) {
      return {
        width: Number.parseInt(match[1]),
        height: Number.parseInt(match[2]),
      }
    }

    // Default dimensions if not detectable from URL
    return { width: 300, height: 200 }
  }

  generateShareUrl(baseUrl: string): string | null {
    return this.shareUuid ? `${baseUrl}/notes/shared/${this.shareUuid}` : null
  }
}
