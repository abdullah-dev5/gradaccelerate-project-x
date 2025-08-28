import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notes'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('gifUrl', 'gif_url')
      table.renameColumn('gifSlug', 'gif_slug')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('gif_url', 'gifUrl')
      table.renameColumn('gif_slug', 'gifSlug')
    })
  }
}
