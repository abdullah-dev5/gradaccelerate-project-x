import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateLabelNotePivot extends BaseSchema {
  protected tableName = 'label_note'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('note_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('notes')
        .onDelete('CASCADE')

      table
        .integer('label_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('labels')
        .onDelete('CASCADE')

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())

      table.unique(['note_id', 'label_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
