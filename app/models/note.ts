import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Note extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare content: string

<<<<<<< HEAD
=======
  @column()
  declare pinned: boolean

  @column()
  declare gif_url: string | null

  @column()
  declare gif_slug: string | null // Added for tracking

  @column()
  declare imageUrl: string | null

  @column()
  declare imagePublicId: string | null

  @column()
  declare shareUuid: string | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @manyToMany(() => Label, {
    pivotTable: 'label_note',
    pivotTimestamps: true,
  })
  declare labels: ManyToMany<typeof Label>

>>>>>>> 5be7f5d (feat: migrate GIF support to Klipy, add robust picker, and implement advanced weather with geo/IP fallback  (D9T1&T2))
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
<<<<<<< HEAD
} 
=======

  @beforeDelete()
  static async cleanupCloudinaryAssets(note: Note) {
    if (note.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(note.imagePublicId)
      } catch (error) {
        throw new Exception(
          `Failed to cleanup Cloudinary assets: ${error.message}`,
          { status: 500 }
        )
      }
    }
  }

  serialize() {
    return {
      ...super.serialize(),
      gif_url: this.gif_url,
      gif_slug: this.gif_slug,
      gifDimensions: this.getGifDimensions(), // Added for frontend display
      labels: this.labels?.map((label) => label.serialize()) || [],
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
        width: parseInt(match[1]),
        height: parseInt(match[2])
      }
    }

    // Default dimensions if not detectable from URL
    return { width: 300, height: 200 }
  }

  generateShareUrl(baseUrl: string): string | null {
    return this.shareUuid ? `${baseUrl}/notes/shared/${this.shareUuid}` : null
  }
}
>>>>>>> 5be7f5d (feat: migrate GIF support to Klipy, add robust picker, and implement advanced weather with geo/IP fallback  (D9T1&T2))
