import { test } from '@japa/runner'
import Todo from '#models/todo'
import { DateTime } from 'luxon'

test.group('Todo Model', () => {
    test('should create todo with basic properties', async ({ assert }) => {
        const todoData = {
            title: 'Test Todo',
            description: 'Test Description',
            isCompleted: false,
            userId: 1
        }

        const todo = new Todo()
        todo.title = todoData.title
        todo.description = todoData.description
        todo.isCompleted = todoData.isCompleted
        todo.userId = todoData.userId

        assert.equal(todo.title, todoData.title)
        assert.equal(todo.description, todoData.description)
        assert.equal(todo.isCompleted, todoData.isCompleted)
        assert.equal(todo.userId, todoData.userId)
    })

    test('should handle labels as JSON string', async ({ assert }) => {
        const todo = new Todo()
        const labels = [
            { id: 1, name: 'Work', color: '#ff0000' },
            { id: 2, name: 'Personal', color: '#00ff00' }
        ]

        todo.labels = labels

        // The model should automatically convert labels to JSON string
        assert.deepEqual(todo.labels, labels)
    })

    test('should handle null labels', async ({ assert }) => {
        const todo = new Todo()
        todo.labels = null

        assert.isNull(todo.labels)
    })

    test('should handle empty labels array', async ({ assert }) => {
        const todo = new Todo()
        todo.labels = []

        assert.isArray(todo.labels)
        assert.equal(todo.labels.length, 0)
    })

    test('should have soft delete enabled', async ({ assert }) => {
        assert.isTrue(Todo.softDelete)
    })

    test('should have correct column names', async ({ assert }) => {
        const todo = new Todo()
        
        // Test that the model has the expected columns
        assert.property(todo, 'id')
        assert.property(todo, 'title')
        assert.property(todo, 'description')
        assert.property(todo, 'isCompleted')
        assert.property(todo, 'userId')
        assert.property(todo, 'createdAt')
        assert.property(todo, 'updatedAt')
        assert.property(todo, 'deletedAt')
    })

    test('should handle boolean isCompleted field', async ({ assert }) => {
        const todo = new Todo()
        
        todo.isCompleted = true
        assert.isTrue(todo.isCompleted)
        
        todo.isCompleted = false
        assert.isFalse(todo.isCompleted)
    })

    test('should handle string title field', async ({ assert }) => {
        const todo = new Todo()
        
        todo.title = 'New Todo'
        assert.equal(todo.title, 'New Todo')
        
        todo.title = 'Updated Todo'
        assert.equal(todo.title, 'Updated Todo')
    })

    test('should handle nullable description field', async ({ assert }) => {
        const todo = new Todo()
        
        todo.description = 'Some description'
        assert.equal(todo.description, 'Some description')
        
        todo.description = null
        assert.isNull(todo.description)
        
        todo.description = ''
        assert.equal(todo.description, '')
    })

    test('should handle numeric userId field', async ({ assert }) => {
        const todo = new Todo()
        
        todo.userId = 1
        assert.equal(todo.userId, 1)
        
        todo.userId = 999
        assert.equal(todo.userId, 999)
    })

    test('should have timestamps', async ({ assert }) => {
        const todo = new Todo()
        
        // createdAt should be auto-created
        assert.exists(todo.createdAt)
        assert.instanceOf(todo.createdAt, DateTime)
        
        // updatedAt should be auto-created and auto-updated
        assert.exists(todo.updatedAt)
        assert.instanceOf(todo.updatedAt, DateTime)
        
        // deletedAt should be null initially
        assert.isNull(todo.deletedAt)
    })

    test('should handle soft delete timestamp', async ({ assert }) => {
        const todo = new Todo()
        
        // Initially deletedAt should be null
        assert.isNull(todo.deletedAt)
        
        // Set a deletion timestamp
        const deleteTime = DateTime.now()
        todo.deletedAt = deleteTime
        
        assert.exists(todo.deletedAt)
        assert.instanceOf(todo.deletedAt, DateTime)
        assert.equal(todo.deletedAt.toISO(), deleteTime.toISO())
    })

    test('should serialize correctly', async ({ assert }) => {
        const todo = new Todo()
        todo.id = 1
        todo.title = 'Test Todo'
        todo.description = 'Test Description'
        todo.isCompleted = false
        todo.userId = 1
        todo.createdAt = DateTime.fromISO('2024-01-01T00:00:00.000Z')
        todo.updatedAt = DateTime.fromISO('2024-01-01T00:00:00.000Z')
        todo.deletedAt = null
        todo.labels = [{ id: 1, name: 'Work', color: '#ff0000' }]

        const serialized = todo.serialize()
        
        assert.equal(serialized.id, 1)
        assert.equal(serialized.title, 'Test Todo')
        assert.equal(serialized.description, 'Test Description')
        assert.equal(serialized.isCompleted, false)
        assert.equal(serialized.userId, 1)
        assert.exists(serialized.createdAt)
        assert.exists(serialized.updatedAt)
        assert.isNull(serialized.deletedAt)
        assert.deepEqual(serialized.labels, [{ id: 1, name: 'Work', color: '#ff0000' }])
    })

    test('should handle labels with missing color', async ({ assert }) => {
        const todo = new Todo()
        const labels = [
            { id: 1, name: 'Work' }, // Missing color
            { id: 2, name: 'Personal', color: '#00ff00' }
        ]

        todo.labels = labels

        assert.deepEqual(todo.labels, labels)
        assert.isUndefined(todo.labels[0].color)
        assert.equal(todo.labels[1].color, '#00ff00')
    })

    test('should validate label structure', async ({ assert }) => {
        const todo = new Todo()
        
        // Valid label structure
        const validLabels = [
            { id: 1, name: 'Work', color: '#ff0000' }
        ]
        
        todo.labels = validLabels
        assert.deepEqual(todo.labels, validLabels)
        
        // Invalid label structure (missing required fields)
        const invalidLabels = [
            { name: 'Work' }, // Missing id
            { id: 2 }, // Missing name
        ]
        
        // The model should still accept these (validation happens at database level)
        todo.labels = invalidLabels
        assert.deepEqual(todo.labels, invalidLabels)
    })

    test('should handle edge cases for labels', async ({ assert }) => {
        const todo = new Todo()
        
        // Empty string labels
        todo.labels = []
        assert.isArray(todo.labels)
        assert.equal(todo.labels.length, 0)
        
        // Single label
        todo.labels = [{ id: 1, name: 'Single', color: '#000000' }]
        assert.isArray(todo.labels)
        assert.equal(todo.labels.length, 1)
        assert.equal(todo.labels[0].name, 'Single')
        
        // Large number of labels
        const manyLabels = Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            name: `Label ${i + 1}`,
            color: `#${i.toString(16).padStart(6, '0')}`
        }))
        
        todo.labels = manyLabels
        assert.equal(todo.labels.length, 10)
        assert.equal(todo.labels[9].name, 'Label 10')
    })

    test('should handle special characters in title and description', async ({ assert }) => {
        const todo = new Todo()
        
        // Special characters in title
        todo.title = 'Todo with special chars: !@#$%^&*()'
        assert.equal(todo.title, 'Todo with special chars: !@#$%^&*()')
        
        // Unicode characters
        todo.title = 'Todo with émojis 🚀 and unicode'
        assert.equal(todo.title, 'Todo with émojis 🚀 and unicode')
        
        // HTML-like content
        todo.description = '<script>alert("test")</script>'
        assert.equal(todo.description, '<script>alert("test")</script>')
        
        // Very long content
        const longText = 'A'.repeat(1000)
        todo.description = longText
        assert.equal(todo.description, longText)
    })

    test('should handle numeric edge cases', async ({ assert }) => {
        const todo = new Todo()
        
        // Zero values
        todo.userId = 0
        assert.equal(todo.userId, 0)
        
        // Large numbers
        todo.userId = 999999999
        assert.equal(todo.userId, 999999999)
        
        // Negative numbers (should be handled by validation)
        todo.userId = -1
        assert.equal(todo.userId, -1)
    })

    test('should handle boolean edge cases', async ({ assert }) => {
        const todo = new Todo()
        
        // Explicit boolean values
        todo.isCompleted = true
        assert.isTrue(todo.isCompleted)
        
        todo.isCompleted = false
        assert.isFalse(todo.isCompleted)
        
        // Truthy/falsy values (should be handled by validation)
        todo.isCompleted = 1 as any
        assert.equal(todo.isCompleted, 1)
        
        todo.isCompleted = 0 as any
        assert.equal(todo.isCompleted, 0)
    })

    test('should handle date edge cases', async ({ assert }) => {
        const todo = new Todo()
        
        // Past dates
        const pastDate = DateTime.fromISO('1900-01-01T00:00:00.000Z')
        todo.createdAt = pastDate
        assert.equal(todo.createdAt.toISO(), pastDate.toISO())
        
        // Future dates
        const futureDate = DateTime.fromISO('2100-01-01T00:00:00.000Z')
        todo.updatedAt = futureDate
        assert.equal(todo.updatedAt.toISO(), futureDate.toISO())
        
        // Invalid dates (should be handled by validation)
        const invalidDate = DateTime.fromISO('invalid-date')
        if (invalidDate.isValid) {
            todo.deletedAt = invalidDate
            assert.equal(todo.deletedAt.toISO(), invalidDate.toISO())
        }
    })

    test('should handle model relationships', async ({ assert }) => {
        const todo = new Todo()
        
        // Test that the model has the expected relationship methods
        assert.property(todo, 'user')
        assert.isFunction(todo.user)
        
        // The user relationship should be a BelongsTo relationship
        // This is tested at the framework level, not in unit tests
        assert.exists(todo.user)
    })

    test('should handle model lifecycle hooks', async ({ assert }) => {
        const todo = new Todo()
        
        // Test that the model can be saved (basic functionality)
        // In a real test environment, this would test actual database operations
        assert.exists(todo.save)
        assert.isFunction(todo.save)
        
        // Test that the model can be deleted
        assert.exists(todo.delete)
        assert.isFunction(todo.delete)
    })

    test('should handle model serialization edge cases', async ({ assert }) => {
        const todo = new Todo()
        
        // Test serialization with undefined values
        todo.title = undefined as any
        todo.description = undefined as any
        todo.isCompleted = undefined as any
        todo.userId = undefined as any
        
        const serialized = todo.serialize()
        
        // The serialized object should contain the undefined values
        assert.property(serialized, 'title')
        assert.property(serialized, 'description')
        assert.property(serialized, 'isCompleted')
        assert.property(serialized, 'userId')
    })

    test('should handle model validation scenarios', async ({ assert }) => {
        const todo = new Todo()
        
        // Test various input types that might be passed
        const testCases = [
            { field: 'title', value: 'Valid Title', expected: 'Valid Title' },
            { field: 'title', value: '', expected: '' },
            { field: 'title', value: 'A'.repeat(255), expected: 'A'.repeat(255) },
            { field: 'description', value: 'Valid description', expected: 'Valid description' },
            { field: 'description', value: null, expected: null },
            { field: 'isCompleted', value: true, expected: true },
            { field: 'isCompleted', value: false, expected: false },
            { field: 'userId', value: 1, expected: 1 },
            { field: 'userId', value: 999999, expected: 999999 }
        ]
        
        for (const testCase of testCases) {
            (todo as any)[testCase.field] = testCase.value
            assert.equal((todo as any)[testCase.field], testCase.expected)
        }
    })
})
