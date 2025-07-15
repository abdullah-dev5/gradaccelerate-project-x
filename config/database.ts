import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'sqlite',
  connections: {
    sqlite: {
      client: 'sqlite3',
      connection: {
        filename: app.makePath('database', 'app.sqlite'), // Better location
      },
      useNullAsDefault: true,
      migrations: {
        naturalSort: true,
        paths: ['./database/migrations'], // Explicit migration path
      },
      seeders: {
        paths: ['./database/seeders'], // Add seeders path
      },
    }, // This closing bracket was missing
  },
})

export default dbConfig
