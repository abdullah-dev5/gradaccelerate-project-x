import { BaseModel, column, belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'

import User from './user.js'
import Label from './label.js'
import { DateTime } from 'luxon'

export default class Todo extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column({ columnName: 'is_completed' })
  declare isCompleted: boolean

  @column()
  declare priority: 'low' | 'medium' | 'high'

  @column()
  declare status: 'pending' | 'in_progress' | 'completed'

  @column({ columnName: 'user_id' })
  declare userId: number

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @manyToMany(() => Label, {
    pivotTable: 'label_todo',
    pivotTimestamps: true,
  })
  declare labels: ManyToMany<typeof Label>

  public static softDelete = true

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime({ columnName: 'deleted_at' })
  declare deletedAt: DateTime | null
}
