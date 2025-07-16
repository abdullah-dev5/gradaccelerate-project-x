import { BaseModel, column, belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import Todo from '#models/todo'
import Note from '#models/note'
import User from '#models/user'
import { DateTime } from 'luxon'

export default class Label extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare color: string | null

  @column({ columnName: 'user_id' })
  declare userId: number

  // Relationship: Label belongs to a User
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User> // Fixed import

  // Relationship: Label can be assigned to many Todos
  @manyToMany(() => Todo, {
    pivotTable: 'label_todo',
    pivotTimestamps: true,
  })
  declare todos: ManyToMany<typeof Todo> // Fixed import

  // Relationship: Label can be assigned to many Notes
  @manyToMany(() => Note, {
    pivotTable: 'label_note',
    pivotTimestamps: true,
  })
  declare notes: ManyToMany<typeof Note> // Fixed import

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}