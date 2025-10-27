import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from './user.js'

export default class Reminder extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare message: string | null

  @column.dateTime({ columnName: 'remind_at' })
  declare remindAt: DateTime

  // Notification channels the user opted into for this reminder
  @column({
    consume: (value) => (typeof value === 'string' ? JSON.parse(value) : value),
    prepare: (value) => (value ? JSON.stringify(value) : JSON.stringify([])),
    serialize: (value) => value,
  })
  declare channels: Array<'web' | 'email'>

  // Delivery flags
  @column({ columnName: 'sent_web' })
  declare sentWeb: boolean

  @column({ columnName: 'sent_email' })
  declare sentEmail: boolean

  @column.dateTime({ columnName: 'sent_at' })
  declare sentAt: DateTime | null

  @column({ columnName: 'user_id' })
  declare userId: number

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  public static softDelete = true

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null
}
