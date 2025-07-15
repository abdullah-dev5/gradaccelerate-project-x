// database/seeders/note_seeder.ts
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Note from '#models/note'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    await Note.createMany([
      // Pinned notes (3)
      {
        title: '🌟 Welcome to GradAccelerate!',
        content: `# Getting Started Guide\n\n**Essential commands**:\n\`\`\`bash\nnode ace serve --watch\nnpm run dev\n\`\`\`\n\n[Documentation](https://docs.adonisjs.com)`,
        pinned: true,
        createdAt: DateTime.now().minus({ days: 5 }),
        updatedAt: DateTime.now().minus({ days: 1 })
      },
      {
        title: '🚀 Project Roadmap',
        content: `## Q3 2023 Goals\n\n- [x] Authentication\n- [ ] File Uploads\n- [ ] Email Service\n\n*Deadline: Oct 31*`,
        pinned: true,
        createdAt: DateTime.now().minus({ days: 4 }),
        updatedAt: DateTime.now().minus({ hours: 3 })
      },
      {
        title: '🔒 Security Policy',
        content: `**Critical Updates**:\n1. Rotate API keys\n2. Enable 2FA\n3. Audit dependencies\n\n\`npm audit fix\``,
        pinned: true,
        createdAt: DateTime.now().minus({ days: 3 }),
        updatedAt: DateTime.now()
      },

      // Recently updated (4)
      {
        title: 'API Endpoints Reference',
        content: `### REST API\n\`\`\`\nGET /api/notes\nPOST /api/notes\nPATCH /api/notes/:id\n\`\`\``,
        pinned: false,
        createdAt: DateTime.now().minus({ days: 2 }),
        updatedAt: DateTime.now().minus({ minutes: 15 })
      },
      {
        title: 'Database Schema',
        content: `## Tables Structure\n\n\`notes\`:\n- id\n- title\n- content\n- pinned\n- timestamps`,
        pinned: false,
        createdAt: DateTime.now().minus({ days: 2 }),
        updatedAt: DateTime.now().minus({ minutes: 30 })
      },
      {
        title: 'Team Meeting Notes',
        content: `**Decisions**:\n- Use PostgreSQL in production\n- Adopt JWT authentication\n\n*Next meeting: Friday*`,
        pinned: false,
        createdAt: DateTime.now().minus({ days: 1 }),
        updatedAt: DateTime.now().minus({ hours: 1 })
      },
      {
        title: 'Code Review Guidelines',
        content: `1. Check tests\n2. Verify migrations\n3. Review security\n\n> "Ship small, ship often"`,
        pinned: false,
        createdAt: DateTime.now().minus({ hours: 12 }),
        updatedAt: DateTime.now().minus({ hours: 2 })
      },

      // Older notes (5)
      {
        title: 'Project Ideas',
        content: `### Potential Features\n- Dark mode\n- Keyboard shortcuts\n- Export to PDF`,
        pinned: false,
        createdAt: DateTime.now().minus({ days: 7 }),
        updatedAt: DateTime.now().minus({ days: 6 })
      },
      {
        title: 'Learning Resources',
        content: `**Recommended**:\n- AdonisJS Mastery\n- Lucid ORM Deep Dive\n- Inertia.js Patterns`,
        pinned: false,
        createdAt: DateTime.now().minus({ days: 8 }),
        updatedAt: null
      },
      {
        title: 'Conference Takeaways',
        content: `## JSConf 2023\n\n- Web Components gaining traction\n- Bun.js performance claims\n- WASM breakthroughs`,
        pinned: false,
        createdAt: DateTime.now().minus({ days: 9 }),
        updatedAt: DateTime.now().minus({ days: 8 })
      },
      {
        title: 'Architecture Draft',
        content: `![Diagram](diagram.png)\n\n*Microservices approach*`,
        pinned: false,
        createdAt: DateTime.now().minus({ days: 10 }),
        updatedAt: null
      },
      {
        title: 'Interview Questions',
        content: `### For Candidates\n1. Explain middleware\n2. Database indexing\n3. JWT vs sessions`,
        pinned: false,
        createdAt: DateTime.now().minus({ days: 11 }),
        updatedAt: DateTime.now().minus({ days: 10 })
      },

      // Recent unpinned (3)
      {
        title: 'Quick Reminder',
        content: `Don't forget to:\n- Run tests\n- Check deployments\n- Review PRs`,
        pinned: false,
        createdAt: DateTime.now().minus({ hours: 2 }),
        updatedAt: null
      },
      {
        title: 'Weekend Tasks',
        content: `**Personal**:\n- Learn Svelte\n- Gym routine\n- Meal prep`,
        pinned: false,
        createdAt: DateTime.now().minus({ hours: 1 }),
        updatedAt: null
      },
      {
        title: 'Random Idea',
        content: `What if we...\n- Add AI suggestions?\n- Try Neovim plugins?\n- Benchmark Deno?`,
        pinned: false,
        createdAt: DateTime.now(),
        updatedAt: null
      }
    ])

    console.log('Seeded 15 notes with varied content and dates')
  }
}