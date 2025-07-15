// database/seeders/note_seeder.ts
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Note from '#models/note'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    await Note.createMany([
      {
        title: 'Welcome to GradAccelerate!',
        content: `# Getting Started\n\n**Welcome** to your new project! Here are some tips:\n- Use \`npm run dev\` to start\n- Check the [AdonisJS docs](https://docs.adonisjs.com)\n\n\`\`\`js\nconsole.log("Hello World!")\n\`\`\``,
        createdAt: DateTime.now().minus({ days: 5 }),
        updatedAt: DateTime.now().minus({ days: 1 })
      },
      {
        title: 'Meeting Notes: Project Kickoff',
        content: `## Action Items\n1. [x] Setup database\n2. [ ] Create migrations\n3. [ ] Design UI\n\n**Team**:\n- @john (Frontend)\n- @sarah (Backend)`,
        createdAt: DateTime.now().minus({ days: 3 }),
        updatedAt: DateTime.now().minus({ hours: 6 })
      },
      {
        title: 'API Endpoints Reference',
        content: `### Available Routes\n\n\`GET /api/projects\` - List all projects\n\`POST /api/notes\` - Create new note\n\n**Authentication**:\nBearer token required`,
        createdAt: DateTime.now().minus({ days: 2 }),
        updatedAt: null // Never updated
      },
      {
        title: 'URGENT: Security Update',
        content: '🚨 Update all dependencies by Friday!\n\n- adonisjs@5.1.0\n- lucid@16.2.0',
        createdAt: DateTime.now().minus({ hours: 12 }),
        updatedAt: DateTime.now()
      },
      {
        title: 'Project Ideas',
        content: '### Potential Features\n1. Real-time collaboration\n2. Markdown preview\n3. Task assignments\n\nVote with 👍/👎',
        createdAt: DateTime.now().minus({ hours: 2 }),
        updatedAt: null
      }
    ])

    console.log('Seeded 5 notes with markdown content')
  }
}