import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Note from '#models/note'
import Label from '#models/label'
import { DateTime } from 'luxon'

export default class NoteSeeder extends BaseSeeder {
  public async run() {
    // 1. Create Notes
    await Note.createMany([
      {
        title: 'First Note with Image',
        content: 'This note includes a Cloudinary image.',
        pinned: false,
        imageUrl: 'https://res.cloudinary.com/dfk9chls7/image/upload/v1/NewTest.png',
        imagePublicId: 'NewTest',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      },
      {
        title: 'Pinned Note',
        content: 'This is a pinned note for testing filters.',
        pinned: true,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      },
      {
        title: 'Archived Note',
        content: 'This note is soft deleted (for testing).',
        pinned: false,
        deletedAt: DateTime.now(),
        createdAt: DateTime.now().minus({ days: 2 }),
        updatedAt: DateTime.now().minus({ days: 2 }),
      },
      {
        title: 'Note with Another Image',
        content: 'Second test note with image.',
        pinned: false,
        imageUrl: 'https://res.cloudinary.com/dfk9chls7/image/upload/v1/Test.png',
        imagePublicId: 'Test',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      },
      {
        title: 'Todo Ideas',
        content: 'Brainstorm tasks for next sprint.',
        pinned: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      },
      {
        title: 'Shopping List',
        content: 'Milk, Eggs, Bread, Detergent.',
        pinned: true,
        createdAt: DateTime.now().minus({ hours: 4 }),
        updatedAt: DateTime.now().minus({ hours: 4 }),
      },
      {
        title: 'Meeting Notes',
        content: 'Discussed API rate limits and response times.',
        pinned: false,
        createdAt: DateTime.now().minus({ days: 1 }),
        updatedAt: DateTime.now().minus({ days: 1 }),
      },
      {
        title: 'Daily Journal',
        content: 'Today I learned about VineJS validation in Adonis.',
        pinned: false,
        createdAt: DateTime.now(),

        updatedAt: DateTime.now(),
      },
      {
        title: 'Book Recommendations',
        content: 'Deep Work, Atomic Habits, Clean Code.',
        pinned: true,
        createdAt: DateTime.now().minus({ days: 3 }),
        updatedAt: DateTime.now().minus({ days: 2 }),
      },
    ])

    // 2. Attach 1–2 random labels to each note
    const notes = await Note.all()
    const labels = await Label.all()

    for (const note of notes) {
      const shuffled = [...labels].sort(() => 0.5 - Math.random())
      const labelIds = shuffled.slice(0, Math.floor(Math.random() * 2) + 1).map(label => label.id)
      await note.related('labels').attach(labelIds)
    }
  }
}
