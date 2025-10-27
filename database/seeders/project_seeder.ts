import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Project from '#models/project'

export default class ProjectSeeder extends BaseSeeder {
  async run() {
    // Get the first user or create one if none exists
    const User = (await import('#models/user')).default
    let user = await User.first()

    if (!user) {
      user = await User.create({
        email: 'admin@example.com',
        password: 'password123',
        name: 'Admin User',
      })
    }

    await Project.createMany([
      {
        title: 'Website Redesign',
        description: 'Complete redesign of company homepage with modern UI',
        status: 'in_progress',
        userId: user.id,
      },
      {
        title: 'API Development',
        description: 'Build REST API endpoints for mobile app',
        status: 'pending',
        userId: user.id,
      },
      {
        title: 'Database Migration',
        description: 'Migrate from SQLite to PostgreSQL',
        status: 'completed',
        userId: user.id,
      },
      {
        title: 'User Authentication',
        description: 'Implement JWT authentication system',
        status: 'in_progress',
        userId: user.id,
      },
      {
        title: 'Testing Suite',
        description: 'Setup automated testing with Jest',
        status: 'pending',
        userId: user.id,
      },
      {
        title: 'Mobile App Development',
        description: 'Build React Native mobile application',
        status: 'in_progress',
        userId: user.id,
      },
      {
        title: 'Performance Optimization',
        description: 'Optimize database queries and frontend performance',
        status: 'pending',
        userId: user.id,
      },
      {
        title: 'Security Audit',
        description: 'Comprehensive security review and fixes',
        status: 'completed',
        userId: user.id,
      },
      {
        title: 'CI/CD Pipeline',
        description: 'Setup automated deployment pipeline',
        status: 'in_progress',
        userId: user.id,
      },
      {
        title: 'Documentation Update',
        description: 'Update API documentation and user guides',
        status: 'pending',
        userId: user.id,
      },
      {
        title: 'Payment Integration',
        description: 'Integrate Stripe payment processing',
        status: 'in_progress',
        userId: user.id,
      },
      {
        title: 'Email Notifications',
        description: 'Setup email notification system',
        status: 'completed',
        userId: user.id,
      },
      {
        title: 'Analytics Dashboard',
        description: 'Build comprehensive analytics dashboard',
        status: 'pending',
        userId: user.id,
      },
      {
        title: 'File Upload System',
        description: 'Implement secure file upload and storage',
        status: 'in_progress',
        userId: user.id,
      },
      {
        title: 'Social Media Integration',
        description: 'Add social login and sharing features',
        status: 'pending',
        userId: user.id,
      },
      {
        title: 'Search Functionality',
        description: 'Implement advanced search with filters',
        status: 'completed',
        userId: user.id,
      },
      {
        title: 'Real-time Features',
        description: 'Add WebSocket support for real-time updates',
        status: 'in_progress',
        userId: user.id,
      },
      {
        title: 'Backup System',
        description: 'Automated backup and recovery system',
        status: 'pending',
        userId: user.id,
      },
      {
        title: 'Multi-language Support',
        description: 'Add internationalization and localization',
        status: 'completed',
        userId: user.id,
      },
      {
        title: 'Admin Dashboard',
        description: 'Build comprehensive admin management panel',
        status: 'in_progress',
        userId: user.id,
      },
      {
        title: 'Chat System',
        description: 'Real-time chat and messaging features',
        status: 'pending',
        userId: user.id,
      },
      {
        title: 'Data Export',
        description: 'Export data to CSV, PDF, and Excel formats',
        status: 'completed',
        userId: user.id,
      },
      {
        title: 'Enterprise Resource Planning System',
        description:
          'Comprehensive ERP system for managing business operations including inventory management, human resources, customer relationship management, and financial management with advanced reporting and analytics capabilities',
        status: 'in_progress',
        userId: user.id,
      },
    ])
  }
}
