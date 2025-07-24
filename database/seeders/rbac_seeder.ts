import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Role from '#models/role'
import Permission from '#models/permission'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    // Create permissions first
    const permissions = await Permission.createMany([
      // User management permissions
      {
        name: 'View Users',
        slug: 'users.read',
        description: 'Can view user list and details',
        resource: 'users',
        action: 'read',
        isActive: true,
      },
      {
        name: 'Create Users',
        slug: 'users.create',
        description: 'Can create new users',
        resource: 'users',
        action: 'create',
        isActive: true,
      },
      {
        name: 'Update Users',
        slug: 'users.update',
        description: 'Can update user information',
        resource: 'users',
        action: 'update',
        isActive: true,
      },
      {
        name: 'Delete Users',
        slug: 'users.delete',
        description: 'Can delete users',
        resource: 'users',
        action: 'delete',
        isActive: true,
      },
      // Project management permissions
      {
        name: 'View Projects',
        slug: 'projects.read',
        description: 'Can view projects',
        resource: 'projects',
        action: 'read',
        isActive: true,
      },
      {
        name: 'Manage Projects',
        slug: 'projects.manage',
        description: 'Can create, update, and delete projects',
        resource: 'projects',
        action: 'manage',
        isActive: true,
      },
      // Note management permissions
      {
        name: 'View Notes',
        slug: 'notes.read',
        description: 'Can view notes',
        resource: 'notes',
        action: 'read',
        isActive: true,
      },
      {
        name: 'Manage Notes',
        slug: 'notes.manage',
        description: 'Can create, update, and delete notes',
        resource: 'notes',
        action: 'manage',
        isActive: true,
      },
      // System permissions
      {
        name: 'Admin Dashboard',
        slug: 'admin.dashboard',
        description: 'Can access admin dashboard',
        resource: 'admin',
        action: 'read',
        isActive: true,
      },
      {
        name: 'System Settings',
        slug: 'admin.settings',
        description: 'Can manage system settings',
        resource: 'admin',
        action: 'manage',
        isActive: true,
      },
    ])

    // Create roles
    const adminRole = await Role.create({
      name: 'Administrator',
      slug: 'admin',
      description: 'Full system access',
      isActive: true,
    })

    const moderatorRole = await Role.create({
      name: 'Moderator',
      slug: 'moderator',
      description: 'Limited administrative access',
      isActive: true,
    })

    const userRole = await Role.create({
      name: 'User',
      slug: 'user',
      description: 'Standard user access',
      isActive: true,
    })

    // Assign permissions to roles

    // Admin gets all permissions
    await adminRole.related('permissions').attach(permissions.map(p => p.id))

    // Moderator gets user and content management permissions
    const moderatorPermissions = permissions.filter(p =>
      p.slug.includes('users.read') ||
      p.slug.includes('users.update') ||
      p.slug.includes('projects') ||
      p.slug.includes('notes') ||
      p.slug.includes('admin.dashboard')
    )
    await moderatorRole.related('permissions').attach(moderatorPermissions.map(p => p.id))

    // User gets basic read permissions
    const userPermissions = permissions.filter(p =>
      p.slug.includes('read') && !p.slug.includes('admin')
    )
    await userRole.related('permissions').attach(userPermissions.map(p => p.id))

    // Create default admin user
    const adminUser = await User.firstOrCreate(
      { email: 'admin@example.com' },
      {
        fullName: 'System Administrator',
        email: 'admin@example.com',
        password: 'admin123',
      }
    )

    // Assign admin role to the admin user
    await adminUser.related('roles').attach([adminRole.id])
  }
}