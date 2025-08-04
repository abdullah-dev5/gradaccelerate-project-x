import Label from '#models/label'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class LabelSeeder extends BaseSeeder {
  async run() {
    await Label.createMany([
      { name: 'Work', color: '#FF5733', userId: 1 },
      { name: 'Personal', color: '#33FF57', userId: 1 },
      { name: 'Urgent', color: '#FF3333', userId: 2 },
      { name: 'Shopping', color: '#3388FF', userId: 3 },
      { name: 'Ideas', color: '#F033FF', userId: 5 }
    ])

  }
}