import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

export default class LabelNoteSeeder extends BaseSeeder {
    public async run() {
        await db.from('label_note').delete()

        // Fetch existing note and label IDs
        const notes = await db.from('notes').select('id')
        const labels = await db.from('labels').select('id')

        if (!notes.length || !labels.length) {
            console.warn('⚠️ No notes or labels found. Skipping label_note seeding.')
            return
        }

        const pivotData = []

        for (let i = 0; i < notes.length; i++) {
            const noteId = notes[i].id

            // Randomly associate 1–2 labels to each note
            const assignedLabels = labels
                .sort(() => 0.5 - Math.random()) // shuffle
                .slice(0, Math.floor(Math.random() * 2) + 1)

            for (const label of assignedLabels) {
                pivotData.push({
                    note_id: noteId,
                    label_id: label.id,
                })
            }
        }

        if (pivotData.length > 0) {
            await db.table('label_note').multiInsert(pivotData)
        } else {
            console.warn('⚠️ No label-note relationships created. Skipping insert.')
        }
    }
}
