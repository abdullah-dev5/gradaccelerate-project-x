import Label from '#models/label'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class LabelSeeder extends BaseSeeder {
  async run() {
    await Label.createMany([
      { name: 'Work', color: '#FF5733' },
      { name: 'Personal', color: '#33FF57' },
      { name: 'Urgent', color: '#FF3333' },
      { name: 'Shopping', color: '#3388FF' },
      { name: 'Ideas', color: '#F033FF' }
    ])
  }
}