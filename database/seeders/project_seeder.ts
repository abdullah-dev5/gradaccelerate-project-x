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
      },
      {
        title: 'Mobile App Development',
        description: 'Build React Native mobile application',
        status: 'in_progress'
      },
      {
        title: 'Performance Optimization',
        description: 'Optimize database queries and frontend performance',
        status: 'pending'
      },
      {
        title: 'Security Audit',
        description: 'Comprehensive security review and fixes',
        status: 'completed'
      },
      {
        title: 'CI/CD Pipeline',
        description: 'Setup automated deployment pipeline',
        status: 'in_progress'
      },
      {
        title: 'Documentation Update',
        description: 'Update API documentation and user guides',
        status: 'pending'
      },
      {
        title: 'Payment Integration',
        description: 'Integrate Stripe payment processing',
        status: 'in_progress'
      },
      {
        title: 'Email Notifications',
        description: 'Setup email notification system',
        status: 'completed'
      },
      {
        title: 'Analytics Dashboard',
        description: 'Build comprehensive analytics dashboard',
        status: 'pending'
      },
      {
        title: 'File Upload System',
        description: 'Implement secure file upload and storage',
        status: 'in_progress'
      },
      {
        title: 'Social Media Integration',
        description: 'Add social login and sharing features',
        status: 'pending'
      },
      {
        title: 'Search Functionality',
        description: 'Implement advanced search with filters',
        status: 'completed'
      },
      {
        title: 'Real-time Features',
        description: 'Add WebSocket support for real-time updates',
        status: 'in_progress'
      },
      {
        title: 'Backup System',
        description: 'Automated backup and recovery system',
        status: 'pending'
      },
      {
        title: 'Multi-language Support',
        description: 'Add internationalization and localization',
        status: 'completed'
      },
      {
        title: 'Admin Dashboard',
        description: 'Build comprehensive admin management panel',
        status: 'in_progress'
      },
      {
        title: 'Chat System',
        description: 'Real-time chat and messaging features',
        status: 'pending'
      },
      {
        title: 'Data Export',
        description: 'Export data to CSV, PDF, and Excel formats',
        status: 'completed'
      }
    ])

    console.log('Seeded 22 sample projects')
  }
}