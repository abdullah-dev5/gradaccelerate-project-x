import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Role from '#models/role'
import Permission from '#models/permission'

export default class AdminController {
  /**
   * Admin Dashboard - Get system statistics
   */
  async dashboard({ auth, response }: HttpContext) {
    try {
      // Check if user is admin
      const user = auth.getUserOrFail()
      const isAdmin = await user.hasRole('admin')

      if (!isAdmin) {
        return response.status(403).json({
          message: 'Access denied. Admin role required.',
        })
      }

      // Get dashboard statistics
      const totalUsers = await User.query().count('* as total')
      const totalRoles = await Role.query().count('* as total')
      const totalPermissions = await Permission.query().count('* as total')

      const recentUsers = await User.query()
        .select('id', 'fullName', 'email', 'createdAt')
        .orderBy('createdAt', 'desc')
        .limit(5)

      const adminUsers = await User.query()
        .select('id', 'fullName', 'email')
        .preload('roles', (rolesQuery) => {
          rolesQuery.where('slug', 'admin')
        })

      const actualAdminUsers = adminUsers.filter((adminUser) => adminUser.roles.length > 0)

      return response.json({
        message: 'Admin dashboard data retrieved successfully',
        data: {
          statistics: {
            totalUsers: totalUsers[0].$extras.total,
            totalRoles: totalRoles[0].$extras.total,
            totalPermissions: totalPermissions[0].$extras.total,
            adminUsers: actualAdminUsers.length,
          },
          recentUsers,
          adminUsers: actualAdminUsers.map((adminUser) => ({
            id: adminUser.id,
            fullName: adminUser.fullName,
            email: adminUser.email,
          })),
        },
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Failed to retrieve dashboard data',
        error: error.message,
      })
    }
  }

  /**
   * Get all users with their roles
   */
  async getUsers({ auth, request, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const isAdmin = await user.hasRole('admin')

      if (!isAdmin) {
        return response.status(403).json({
          message: 'Access denied. Admin role required.',
        })
      }

      const page = request.input('page', 1)
      const limit = request.input('limit', 10)

      const users = await User.query()
        .select('id', 'fullName', 'email', 'createdAt', 'updatedAt')
        .preload('roles')
        .orderBy('id', 'asc')
        .paginate(page, limit)

      return response.json({
        message: 'Users retrieved successfully',
        data: users.all().map((userItem) => ({
          ...userItem.serialize(),
          roles: userItem.roles.map((role) => ({
            id: role.id,
            name: role.name,
            slug: role.slug,
          })),
        })),
        meta: {
          total: users.total,
          perPage: users.perPage,
          currentPage: users.currentPage,
          lastPage: users.lastPage,
        },
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Failed to retrieve users',
        error: error.message,
      })
    }
  }

  /**
   * Assign role to user
   */
  async assignRole({ auth, request, response }: HttpContext) {
    try {
      const authUser = auth.getUserOrFail()
      const isAdmin = await authUser.hasRole('admin')

      if (!isAdmin) {
        return response.status(403).json({
          message: 'Access denied. Admin role required.',
        })
      }

      const { userId, roleId } = request.only(['userId', 'roleId'])

      if (!userId || !roleId) {
        return response.status(400).json({
          message: 'userId and roleId are required',
        })
      }

      const user = await User.findOrFail(userId)
      const role = await Role.findOrFail(roleId)

      // Check if user already has this role
      const existingRole = await user.related('roles').query().where('roles.id', roleId).first()
      if (existingRole) {
        return response.status(409).json({
          message: 'User already has this role',
        })
      }

      await user.related('roles').attach([roleId])

      return response.json({
        message: `Role "${role.name}" assigned to user "${user.fullName}" successfully`,
        data: {
          userId: user.id,
          roleId: role.id,
          roleName: role.name,
        },
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Failed to assign role',
        error: error.message,
      })
    }
  }

  /**
   * Remove role from user
   */
  async removeRole({ auth, request, response }: HttpContext) {
    try {
      const authUser = auth.getUserOrFail()
      const isAdmin = await authUser.hasRole('admin')

      if (!isAdmin) {
        return response.status(403).json({
          message: 'Access denied. Admin role required.',
        })
      }

      const { userId, roleId } = request.only(['userId', 'roleId'])

      if (!userId || !roleId) {
        return response.status(400).json({
          message: 'userId and roleId are required',
        })
      }

      const user = await User.findOrFail(userId)
      const role = await Role.findOrFail(roleId)

      await user.related('roles').detach([roleId])

      return response.json({
        message: `Role "${role.name}" removed from user "${user.fullName}" successfully`,
        data: {
          userId: user.id,
          roleId: role.id,
          roleName: role.name,
        },
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Failed to remove role',
        error: error.message,
      })
    }
  }

  /**
   * Get all roles
   */
  async getRoles({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const isAdmin = await user.hasRole('admin')

      if (!isAdmin) {
        return response.status(403).json({
          message: 'Access denied. Admin role required.',
        })
      }

      const roles = await Role.query().preload('permissions').orderBy('id', 'asc')

      return response.json({
        message: 'Roles retrieved successfully',
        data: roles.map((role) => ({
          ...role.serialize(),
          permissions: role.permissions.map((permission) => ({
            id: permission.id,
            name: permission.name,
            slug: permission.slug,
            resource: permission.resource,
            action: permission.action,
          })),
        })),
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Failed to retrieve roles',
        error: error.message,
      })
    }
  }

  /**
   * Get all permissions
   */
  async getPermissions({ auth, response }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const isAdmin = await user.hasRole('admin')

      if (!isAdmin) {
        return response.status(403).json({
          message: 'Access denied. Admin role required.',
        })
      }

      const permissions = await Permission.query()
        .orderBy('resource', 'asc')
        .orderBy('action', 'asc')

      return response.json({
        message: 'Permissions retrieved successfully',
        data: permissions,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Failed to retrieve permissions',
        error: error.message,
      })
    }
  }
}
