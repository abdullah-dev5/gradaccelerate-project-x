// start/models/label.ts
import { BaseModel, column, belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from '#models/user'
import Todo from '#models/todo'
import Note from '#models/note'

export default class Label extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare color: string | null

  @column({ columnName: 'user_id' })
  declare userId: number

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @manyToMany(() => Todo, {
    pivotTable: 'label_todo',
    pivotTimestamps: true,
  })
  declare todos: ManyToMany<typeof Todo>

  @manyToMany(() => Note, {
    pivotTable: 'label_note',
    pivotTimestamps: true,
  })
  declare notes: ManyToMany<typeof Note>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
