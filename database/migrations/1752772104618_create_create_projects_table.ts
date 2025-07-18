import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Projects extends BaseSchema {
  protected tableName = 'projects'
  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('title').notNullable()
      table.text('description').notNullable()
      table
        .enu('status', ['pending', 'in_progress', 'completed'])
        .notNullable()
        .defaultTo('pending')

      // Uncomment when auth is added
      // table
      //   .integer('user_id')
      //   .unsigned()
      //   .references('id')
      //   .inTable('users')
      //   .onDelete('CASCADE')

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
