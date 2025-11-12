import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Project from '#models/project'

export default class ProjectSeeder extends BaseSeeder {
  async run() {
    await Project.createMany([
      {
        title: 'Website Redesign',
        description: 'Complete redesign of company homepage with modern UI',
        status: 'in_progress'
      },
      {
        title: 'API Development',
        description: 'Build REST API endpoints for mobile app',
        status: 'pending'
      },
      {
        title: 'Database Migration',
        description: 'Migrate from SQLite to PostgreSQL',
        status: 'completed'
      },
      {
        title: 'User Authentication',
        description: 'Implement JWT authentication system',
        status: 'in_progress'
      },
      {
        title: 'Testing Suite',
        description: 'Setup automated testing with Jest',
        status: 'pending'
      }
    ])

    console.log('Seeded 5 sample projects')
  }
}