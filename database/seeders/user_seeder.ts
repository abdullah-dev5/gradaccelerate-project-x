import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

export default class UserSeeder extends BaseSeeder {
  public async run() {
    const simplePassword = await hash.make('Password123')
    const abdullahPassword = await hash.make('Alan123')
    await User.truncate(true) // 👈 Clears users table and resets auto-increment ID
    await User.createMany([
      {
        id: 1,
        fullName: 'Muhammad Abdullah',
        email: 'muhammadabdullah.bscsf22@iba-suk.edu.pk',
        password: abdullahPassword,
      },
      {
        
        id: 2,
        fullName: 'John Doe',
        email: 'john@example.com',
        password: simplePassword,
      },
      {
        id: 3,
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        password: simplePassword,
      },
      {
        id: 4,
        fullName: 'Ali Khan',
        email: 'ali@example.com',
        password: simplePassword,
      },
      {
        id: 5,
        fullName: 'Sarah Lee',
        email: 'sarah@example.com',
        password: simplePassword,
      },
      {
        id: 6,
        fullName: 'David Park',
        email: 'david@example.com',
        password: simplePassword,
      },
    ])
  }
}
