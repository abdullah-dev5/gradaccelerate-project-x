import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany, belongsTo, beforeDelete } from '@adonisjs/lucid/orm'
import type { ManyToMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import Label from './label.js'
import User from './user.js'
import cloudinary from '#config/cloudinary'
import { Exception } from '@adonisjs/core/exceptions'

export default class Note extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare title: string

  @column()
  declare content: string

  @column()
  declare pinned: boolean

  @column()
  declare imageUrl: string | null

  @column()
  declare imagePublicId: string | null

  @column()
  declare shareUuid: string | null

  @column.dateTime()
  declare deletedAt: DateTime | null // ✅ Soft delete support

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
      labels: this.labels?.map((label) => label.serialize()) || [],
      isShared: !!this.shareUuid,
      hasImage: !!this.imageUrl,
    }
  }

  generateShareUrl(baseUrl: string): string | null {
    return this.shareUuid ? `${baseUrl}/notes/shared/${this.shareUuid}` : null
  }
}
