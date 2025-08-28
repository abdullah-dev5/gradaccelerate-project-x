import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Note from './note.js'
import Todo from './todo.js'

export default class Label extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare color: string | null

  @column()
  declare userId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => User)
  declare users: ManyToMany<typeof User>

  @manyToMany(() => Note)
  declare notes: ManyToMany<typeof Note>

  @manyToMany(() => Todo)
  declare todos: ManyToMany<typeof Todo>
}
