import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Bookmark from '#models/bookmark'
import User from '#models/user'
import Label from '#models/label'

export default class extends BaseSeeder {
  async run() {
    console.log('🌱 Starting Bookmark Seeder...')

    try {
      // Get the first user (assuming there's at least one user)
      const user = await User.first()
      if (!user) {
        console.log('❌ No users found. Please run user seeder first.')
        return
      }

      console.log(`👤 Seeding bookmarks for user: ${user.email}`)

      // Get some labels for the user
      const labels = await Label.query().where('user_id', user.id).limit(5)
      console.log(`🏷️ Found ${labels.length} labels to work with`)

      // Sample bookmark data
      const sampleBookmarks = [
        {
          userId: user.id,
          url: 'https://github.com',
          title: 'GitHub: Where the world builds software',
          description:
            'GitHub is where over 100 million developers shape the future of software, together. Contribute to the open source community, manage your Git repositories, review code like a pro, track bugs and features, power your CI/CD and DevOps workflows, and secure code before you commit it.',
          imageUrl:
            'https://github.githubassets.com/images/modules/site/social-cards/github-social.png',
          siteName: 'GitHub',
          isFavorite: true,
          status: 'active',
          aiGeneratedLabels: JSON.stringify([
            'GitHub',
            'Software Development',
            'Version Control',
            'Open Source',
            'Collaboration',
          ]),
          aiGeneratedSummary:
            'GitHub is the leading platform for software development, offering version control, collaboration tools, and CI/CD workflows for developers worldwide.',
        },
        {
          userId: user.id,
          url: 'https://stackoverflow.com',
          title: 'Stack Overflow - Where Developers Learn, Share, & Build Careers',
          description:
            'Stack Overflow is the largest, most trusted online community for developers to learn, share their knowledge, and build their careers. More than 50 million developers and technologists trust Stack Overflow to help solve coding problems and develop new skills.',
          imageUrl: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon@2.png',
          siteName: 'Stack Overflow',
          isFavorite: true,
          status: 'active',
          aiGeneratedLabels: JSON.stringify([
            'Stack Overflow',
            'Programming',
            'Q&A',
            'Developer Community',
            'Learning',
          ]),
          aiGeneratedSummary:
            'Stack Overflow is the premier Q&A platform for developers, offering solutions to coding problems and fostering a global developer community.',
        },
        {
          userId: user.id,
          url: 'https://react.dev',
          title: 'React – The library for web and native user interfaces',
          description:
            'React is the library for web and native user interfaces. Build user interfaces out of individual pieces called components written in JavaScript. React is designed to let you seamlessly combine components written by different people, teams, and organizations.',
          imageUrl: 'https://react.dev/favicon.ico',
          siteName: 'React',
          isFavorite: false,
          status: 'active',
          aiGeneratedLabels: JSON.stringify([
            'React',
            'JavaScript',
            'Frontend',
            'UI Library',
            'Components',
          ]),
          aiGeneratedSummary:
            'React is a powerful JavaScript library for building interactive user interfaces with reusable components.',
        },
        {
          userId: user.id,
          url: 'https://tailwindcss.com',
          title: 'Tailwind CSS - Rapidly build modern websites without ever leaving your HTML.',
          description:
            'A utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90 that can be composed to build any design, directly in your markup.',
          imageUrl: 'https://tailwindcss.com/favicon-32x32.png',
          siteName: 'Tailwind CSS',
          isFavorite: false,
          status: 'active',
          aiGeneratedLabels: JSON.stringify([
            'Tailwind CSS',
            'CSS Framework',
            'Utility-First',
            'Styling',
            'Design',
          ]),
          aiGeneratedSummary:
            'Tailwind CSS is a utility-first CSS framework that enables rapid UI development through pre-built utility classes.',
        },
        {
          userId: user.id,
          url: 'https://openai.com',
          title: 'OpenAI',
          description:
            'OpenAI is an AI research and deployment company. Our mission is to ensure that artificial general intelligence benefits all of humanity.',
          imageUrl: 'https://openai.com/favicon.ico',
          siteName: 'OpenAI',
          isFavorite: true,
          status: 'active',
          aiGeneratedLabels: JSON.stringify([
            'OpenAI',
            'Artificial Intelligence',
            'AI Research',
            'Machine Learning',
            'Technology',
          ]),
          aiGeneratedSummary:
            'OpenAI is a leading AI research company focused on developing artificial general intelligence for the benefit of humanity.',
        },
        {
          userId: user.id,
          url: 'https://www.typescriptlang.org',
          title: 'TypeScript: JavaScript With Syntax For Types.',
          description:
            'TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.',
          imageUrl: 'https://www.typescriptlang.org/favicon.ico',
          siteName: 'TypeScript',
          isFavorite: false,
          status: 'active',
          aiGeneratedLabels: JSON.stringify([
            'TypeScript',
            'JavaScript',
            'Programming Language',
            'Type Safety',
            'Development',
          ]),
          aiGeneratedSummary:
            'TypeScript extends JavaScript with optional static typing, providing better tooling and error detection for large-scale applications.',
        },
        {
          userId: user.id,
          url: 'https://nodejs.org',
          title: 'Node.js',
          description:
            "Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine. Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient.",
          imageUrl: 'https://nodejs.org/static/images/logo.svg',
          siteName: 'Node.js',
          isFavorite: false,
          status: 'active',
          aiGeneratedLabels: JSON.stringify([
            'Node.js',
            'JavaScript',
            'Runtime',
            'Server-Side',
            'Backend',
          ]),
          aiGeneratedSummary:
            'Node.js is a JavaScript runtime that enables server-side development with an event-driven, non-blocking architecture.',
        },
        {
          userId: user.id,
          url: 'https://www.postgresql.org',
          title: "PostgreSQL: The World's Most Advanced Open Source Relational Database",
          description:
            'PostgreSQL is a powerful, open source object-relational database system with over 30 years of active development that has earned it a strong reputation for reliability, feature robustness, and performance.',
          imageUrl: 'https://www.postgresql.org/favicon.ico',
          siteName: 'PostgreSQL',
          isFavorite: false,
          status: 'active',
          aiGeneratedLabels: JSON.stringify([
            'PostgreSQL',
            'Database',
            'SQL',
            'Open Source',
            'Relational',
          ]),
          aiGeneratedSummary:
            'PostgreSQL is a robust, open-source relational database system known for reliability, advanced features, and performance.',
        },
        {
          userId: user.id,
          url: 'https://docker.com',
          title: 'Docker: Accelerated, Containerized Application Development',
          description:
            'Docker is a platform for developing, shipping, and running applications in containers. Docker enables you to separate your applications from your infrastructure so you can deliver software quickly.',
          imageUrl: 'https://www.docker.com/favicon.ico',
          siteName: 'Docker',
          isFavorite: true,
          status: 'active',
          aiGeneratedLabels: JSON.stringify([
            'Docker',
            'Containers',
            'DevOps',
            'Deployment',
            'Virtualization',
          ]),
          aiGeneratedSummary:
            'Docker is a containerization platform that enables developers to package and deploy applications consistently across different environments.',
        },
        {
          userId: user.id,
          url: 'https://kubernetes.io',
          title: 'Kubernetes',
          description:
            'Kubernetes is an open-source container orchestration platform for automating deployment, scaling, and management of containerized applications.',
          imageUrl: 'https://kubernetes.io/favicon.ico',
          siteName: 'Kubernetes',
          isFavorite: false,
          status: 'active',
          aiGeneratedLabels: JSON.stringify([
            'Kubernetes',
            'Container Orchestration',
            'DevOps',
            'Scaling',
            'Microservices',
          ]),
          aiGeneratedSummary:
            'Kubernetes is an open-source platform for automating container deployment, scaling, and management in production environments.',
        },
      ]

      console.log(`📚 Creating ${sampleBookmarks.length} sample bookmarks...`)

      // Create bookmarks
      for (const bookmarkData of sampleBookmarks) {
        const bookmark = await Bookmark.create(bookmarkData)
        console.log(`✅ Created bookmark: ${bookmark.title}`)

        // Attach some random labels if available
        if (labels.length > 0) {
          const randomLabels = labels
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.floor(Math.random() * 3) + 1)

          if (randomLabels.length > 0) {
            const labelIds = randomLabels.map((label) => label.id)
            await bookmark.related('labels').attach(labelIds)
            console.log(`🏷️ Attached ${randomLabels.length} labels to ${bookmark.title}`)
          }
        }
      }

      console.log('🎉 Bookmark seeding completed successfully!')
      console.log(`📊 Total bookmarks created: ${sampleBookmarks.length}`)
    } catch (error) {
      console.error('❌ Error during bookmark seeding:', error)
      throw error
    }
  }
}
