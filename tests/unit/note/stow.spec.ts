import Note from '#models/note'
import { test } from '@japa/runner'
import { afterEach } from 'node:test'

test.group('Notes Show', () => {
  let createdNote: Note | null
  afterEach(async () => {
    if (createdNote) {
      await createdNote.delete()
    }
  })

  test('should return a note if it exists', async ({ expect }) => {
    const note = await Note.create({ title: 'Test Note', content: 'Test Content' })
    const fetchedNote = await Note.find(note.id)
    expect(note.id).toEqual(fetchedNote?.id)
    expect(note.title).toEqual(fetchedNote?.title)
    expect(note.content).toEqual(fetchedNote?.content)
    createdNote = fetchedNote
  })
})
