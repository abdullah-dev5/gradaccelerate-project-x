import { test } from '@japa/runner'
import { createTodoValidator, updateTodoValidator, todoIdValidator } from '#validators/todos/todos_validator'

test.group('Todo Validators', () => {
    test.group('Create Todo Validator', () => {
        test('should validate valid todo data', async ({ assert }) => {
            const validData = {
                title: 'Valid Todo Title',
                description: 'Valid description',
                isCompleted: false,
                labels: [
                    { id: 1, name: 'Work', color: '#ff0000' }
                ]
            }

            const result = await createTodoValidator.validate(validData)
            
            assert.equal(result.title, validData.title)
            assert.equal(result.description, validData.description)
            assert.equal(result.isCompleted, validData.isCompleted)
            assert.deepEqual(result.labels, validData.labels)
        })

        test('should validate todo without description', async ({ assert }) => {
            const validData = {
                title: 'Valid Todo Title',
                description: null,
                isCompleted: false
            }

            const result = await createTodoValidator.validate(validData)
            
            assert.equal(result.title, validData.title)
            assert.isNull(result.description)
            assert.equal(result.isCompleted, validData.isCompleted)
        })

        test('should validate todo without labels', async ({ assert }) => {
            const validData = {
                title: 'Valid Todo Title',
                description: 'Valid description',
                isCompleted: false
            }

            const result = await createTodoValidator.validate(validData)
            
            assert.equal(result.title, validData.title)
            assert.equal(result.description, validData.description)
            assert.equal(result.isCompleted, validData.isCompleted)
            assert.isUndefined(result.labels)
        })

        test('should validate todo with empty labels array', async ({ assert }) => {
            const validData = {
                title: 'Valid Todo Title',
                description: 'Valid description',
                isCompleted: false,
                labels: []
            }

            const result = await createTodoValidator.validate(validData)
            
            assert.equal(result.title, validData.title)
            assert.equal(result.description, validData.description)
            assert.equal(result.isCompleted, validData.isCompleted)
            assert.deepEqual(result.labels, [])
        })

        test('should validate todo with multiple labels', async ({ assert }) => {
            const validData = {
                title: 'Valid Todo Title',
                description: 'Valid description',
                isCompleted: false,
                labels: [
                    { id: 1, name: 'Work', color: '#ff0000' },
                    { id: 2, name: 'Personal', color: '#00ff00' },
                    { id: 3, name: 'Urgent' }
                ]
            }

            const result = await createTodoValidator.validate(validData)
            
            assert.equal(result.title, validData.title)
            assert.equal(result.description, validData.description)
            assert.equal(result.isCompleted, validData.isCompleted)
            assert.deepEqual(result.labels, validData.labels)
        })

        test('should validate todo with minimum title length', async ({ assert }) => {
            const validData = {
                title: 'A', // Minimum length of 1
                description: 'Valid description',
                isCompleted: false
            }

            const result = await createTodoValidator.validate(validData)
            
            assert.equal(result.title, validData.title)
            assert.equal(result.description, validData.description)
            assert.equal(result.isCompleted, validData.isCompleted)
        })

        test('should validate todo with maximum title length', async ({ assert }) => {
            const validData = {
                title: 'A'.repeat(255), // Maximum length of 255
                description: 'Valid description',
                isCompleted: false
            }

            const result = await createTodoValidator.validate(validData)
            
            assert.equal(result.title, validData.title)
            assert.equal(result.description, validData.description)
            assert.equal(result.isCompleted, validData.isCompleted)
        })

        test('should validate todo with boolean isCompleted values', async ({ assert }) => {
            const testCases = [true, false]
            
            for (const isCompleted of testCases) {
                const validData = {
                    title: 'Valid Todo Title',
                    description: 'Valid description',
                    isCompleted
                }

                const result = await createTodoValidator.validate(validData)
                
                assert.equal(result.title, validData.title)
                assert.equal(result.description, validData.description)
                assert.equal(result.isCompleted, validData.isCompleted)
            }
        })

        test('should validate labels with missing color', async ({ assert }) => {
            const validData = {
                title: 'Valid Todo Title',
                description: 'Valid description',
                isCompleted: false,
                labels: [
                    { id: 1, name: 'Work' }, // Missing color
                    { id: 2, name: 'Personal', color: '#00ff00' }
                ]
            }

            const result = await createTodoValidator.validate(validData)
            
            assert.deepEqual(result.labels, validData.labels)
            assert.isUndefined(result.labels[0].color)
            assert.equal(result.labels[1].color, '#00ff00')
        })

        test('should validate labels with different color formats', async ({ assert }) => {
            const validData = {
                title: 'Valid Todo Title',
                description: 'Valid description',
                isCompleted: false,
                labels: [
                    { id: 1, name: 'Work', color: '#ff0000' },
                    { id: 2, name: 'Personal', color: '#00ff00' },
                    { id: 3, name: 'Urgent', color: '#0000ff' }
                ]
            }

            const result = await createTodoValidator.validate(validData)
            
            assert.deepEqual(result.labels, validData.labels)
        })

        test('should reject empty title', async ({ assert }) => {
            const invalidData = {
                title: '',
                description: 'Valid description',
                isCompleted: false
            }

            try {
                await createTodoValidator.validate(invalidData)
                assert.fail('Should have thrown validation error')
            } catch (error) {
                assert.exists(error)
                assert.property(error, 'messages')
            }
        })

        test('should reject title with only whitespace', async ({ assert }) => {
            const invalidData = {
                title: '   ',
                description: 'Valid description',
                isCompleted: false
            }

            try {
                await createTodoValidator.validate(invalidData)
                assert.fail('Should have thrown validation error')
            } catch (error) {
                assert.exists(error)
                assert.property(error, 'messages')
            }
        })

        test('should reject title exceeding maximum length', async ({ assert }) => {
            const invalidData = {
                title: 'A'.repeat(256), // Exceeds maximum length of 255
                description: 'Valid description',
                isCompleted: false
            }

            try {
                await createTodoValidator.validate(invalidData)
                assert.fail('Should have thrown validation error')
            } catch (error) {
                assert.exists(error)
                assert.property(error, 'messages')
            }
        })

        test('should reject invalid label structure', async ({ assert }) => {
            const invalidData = {
                title: 'Valid Todo Title',
                description: 'Valid description',
                isCompleted: false,
                labels: [
                    { name: 'Work' }, // Missing id
                    { id: 'invalid', name: 'Personal' }, // Invalid id type
                    { id: 3, name: '' } // Empty name
                ]
            }

            try {
                await createTodoValidator.validate(invalidData)
                assert.fail('Should have thrown validation error')
            } catch (error) {
                assert.exists(error)
                assert.property(error, 'messages')
            }
        })

        test('should reject labels with invalid id types', async ({ assert }) => {
            const invalidData = {
                title: 'Valid Todo Title',
                description: 'Valid description',
                isCompleted: false,
                labels: [
                    { id: -1, name: 'Work' }, // Negative id
                    { id: 0, name: 'Personal' }, // Zero id
                    { id: 1.5, name: 'Urgent' } // Decimal id
                ]
            }

            try {
                await createTodoValidator.validate(invalidData)
                assert.fail('Should have thrown validation error')
            } catch (error) {
                assert.exists(error)
                assert.property(error, 'messages')
            }
        })

        test('should reject labels with invalid name types', async ({ assert }) => {
            const invalidData = {
                title: 'Valid Todo Title',
                description: 'Valid description',
                isCompleted: false,
                labels: [
                    { id: 1, name: 123 }, // Invalid name type
                    { id: 2, name: true }, // Invalid name type
                    { id: 3, name: null } // Invalid name type
                ]
            }

            try {
                await createTodoValidator.validate(invalidData)
                assert.fail('Should have thrown validation error')
            } catch (error) {
                assert.exists(error)
                assert.property(error, 'messages')
            }
        })

        test('should reject labels with empty names', async ({ assert }) => {
            const invalidData = {
                title: 'Valid Todo Title',
                description: 'Valid description',
                isCompleted: false,
                labels: [
                    { id: 1, name: '' }, // Empty name
                    { id: 2, name: '   ' } // Whitespace only name
                ]
            }

            try {
                await createTodoValidator.validate(invalidData)
                assert.fail('Should have thrown validation error')
            } catch (error) {
                assert.exists(error)
                assert.property(error, 'messages')
            }
        })

        test('should reject labels with names exceeding maximum length', async ({ assert }) => {
            const invalidData = {
                title: 'Valid Todo Title',
                description: 'Valid description',
                isCompleted: false,
                labels: [
                    { id: 1, name: 'A'.repeat(256) } // Exceeds maximum length
                ]
            }

            try {
                await createTodoValidator.validate(invalidData)
                assert.fail('Should have thrown validation error')
            } catch (error) {
                assert.exists(error)
                assert.property(error, 'messages')
            }
        })
    })

    test.group('Update Todo Validator', () => {
        test('should validate valid update data with all fields', async ({ assert }) => {
            const validData = {
                title: 'Updated Todo Title',
                description: 'Updated description',
                isCompleted: true,
                labels: [
                    { id: 1, name: 'Work', color: '#ff0000' }
                ]
            }

            const result = await updateTodoValidator.validate(validData)
            
            assert.equal(result.title, validData.title)
            assert.equal(result.description, validData.description)
            assert.equal(result.isCompleted, validData.isCompleted)
            assert.deepEqual(result.labels, validData.labels)
        })

        test('should validate update data with only title', async ({ assert }) => {
            const validData = {
                title: 'Updated Todo Title'
            }

            const result = await updateTodoValidator.validate(validData)
            
            assert.equal(result.title, validData.title)
            assert.isUndefined(result.description)
            assert.isUndefined(result.isCompleted)
            assert.isUndefined(result.labels)
        })

        test('should validate update data with only description', async ({ assert }) => {
            const validData = {
                description: 'Updated description'
            }

            const result = await updateTodoValidator.validate(validData)
            
            assert.isUndefined(result.title)
            assert.equal(result.description, validData.description)
            assert.isUndefined(result.isCompleted)
            assert.isUndefined(result.labels)
        })

        test('should validate update data with only isCompleted', async ({ assert }) => {
            const validData = {
                isCompleted: true
            }

            const result = await updateTodoValidator.validate(validData)
            
            assert.isUndefined(result.title)
            assert.isUndefined(result.description)
            assert.equal(result.isCompleted, validData.isCompleted)
            assert.isUndefined(result.labels)
        })

        test('should validate update data with only labels', async ({ assert }) => {
            const validData = {
                labels: [
                    { id: 1, name: 'Work', color: '#ff0000' }
                ]
            }

            const result = await updateTodoValidator.validate(validData)
            
            assert.isUndefined(result.title)
            assert.isUndefined(result.description)
            assert.isUndefined(result.isCompleted)
            assert.deepEqual(result.labels, validData.labels)
        })

        test('should validate empty update data', async ({ assert }) => {
            const validData = {}

            const result = await updateTodoValidator.validate(validData)
            
            assert.isUndefined(result.title)
            assert.isUndefined(result.description)
            assert.isUndefined(result.isCompleted)
            assert.isUndefined(result.labels)
        })

        test('should reject invalid title in update data', async ({ assert }) => {
            const invalidData = {
                title: 'A'.repeat(256) // Exceeds maximum length
            }

            try {
                await updateTodoValidator.validate(invalidData)
                assert.fail('Should have thrown validation error')
            } catch (error) {
                assert.exists(error)
                assert.property(error, 'messages')
            }
        })

        test('should reject invalid labels in update data', async ({ assert }) => {
            const invalidData = {
                labels: [
                    { id: -1, name: 'Work' } // Invalid id
                ]
            }

            try {
                await updateTodoValidator.validate(invalidData)
                assert.fail('Should have thrown validation error')
            } catch (error) {
                assert.exists(error)
                assert.property(error, 'messages')
            }
        })

        test('should reject invalid isCompleted type in update data', async ({ assert }) => {
            const invalidData = {
                isCompleted: 'true' // Should be boolean
            }

            try {
                await updateTodoValidator.validate(invalidData)
                assert.fail('Should have thrown validation error')
            } catch (error) {
                assert.exists(error)
                assert.property(error, 'messages')
            }
        })
    })

    test.group('Todo ID Validator', () => {
        test('should validate positive integer ID', async ({ assert }) => {
            const validData = { id: 1 }

            const result = await todoIdValidator.validate(validData)
            
            assert.equal(result.id, 1)
        })

        test('should validate large positive integer ID', async ({ assert }) => {
            const validData = { id: 999999999 }

            const result = await todoIdValidator.validate(validData)
            
            assert.equal(result.id, 999999999)
        })

        test('should reject zero ID', async ({ assert }) => {
            const invalidData = { id: 0 }

            try {
                await todoIdValidator.validate(invalidData)
                assert.fail('Should have thrown validation error')
            } catch (error) {
                assert.exists(error)
                assert.property(error, 'messages')
            }
        })

        test('should reject negative ID', async ({ assert }) => {
            const invalidData = { id: -1 }

            try {
                await todoIdValidator.validate(invalidData)
                assert.fail('Should have thrown validation error')
            } catch (error) {
                assert.exists(error)
                assert.property(error, 'messages')
            }
        })

        test('should reject decimal ID', async ({ assert }) => {
            const invalidData = { id: 1.5 }

            try {
                await todoIdValidator.validate(invalidData)
                assert.fail('Should have thrown validation error')
            } catch (error) {
                assert.exists(error)
                assert.property(error, 'messages')
            }
        })

        test('should reject string ID', async ({ assert }) => {
            const invalidData = { id: '1' }

            try {
                await todoIdValidator.validate(invalidData)
                assert.fail('Should have thrown validation error')
            } catch (error) {
                assert.exists(error)
                assert.property(error, 'messages')
            }
        })

        test('should reject boolean ID', async ({ assert }) => {
            const invalidData = { id: true }

            try {
                await todoIdValidator.validate(invalidData)
                assert.fail('Should have thrown validation error')
            } catch (error) {
                assert.exists(error)
                assert.property(error, 'messages')
            }
        })

        test('should reject null ID', async ({ assert }) => {
            const invalidData = { id: null }

            try {
                await todoIdValidator.validate(invalidData)
                assert.fail('Should have thrown validation error')
            } catch (error) {
                assert.exists(error)
                assert.property(error, 'messages')
            }
        })

        test('should reject undefined ID', async ({ assert }) => {
            const invalidData = { id: undefined }

            try {
                await todoIdValidator.validate(invalidData)
                assert.fail('Should have thrown validation error')
            } catch (error) {
                assert.exists(error)
                assert.property(error, 'messages')
            }
        })

        test('should reject missing ID field', async ({ assert }) => {
            const invalidData = {}

            try {
                await todoIdValidator.validate(invalidData)
                assert.fail('Should have thrown validation error')
            } catch (error) {
                assert.exists(error)
                assert.property(error, 'messages')
            }
        })
    })

    test.group('Validator Edge Cases', () => {
        test('should handle very long valid titles', async ({ assert }) => {
            const validData = {
                title: 'A'.repeat(255), // Maximum allowed length
                description: 'Valid description',
                isCompleted: false
            }

            const result = await createTodoValidator.validate(validData)
            
            assert.equal(result.title, validData.title)
            assert.equal(result.title.length, 255)
        })

        test('should handle very long valid descriptions', async ({ assert }) => {
            const validData = {
                title: 'Valid Todo Title',
                description: 'A'.repeat(1000), // Very long description
                isCompleted: false
            }

            const result = await createTodoValidator.validate(validData)
            
            assert.equal(result.description, validData.description)
            assert.equal(result.description.length, 1000)
        })

        test('should handle labels with very long names', async ({ assert }) => {
            const validData = {
                title: 'Valid Todo Title',
                description: 'Valid description',
                isCompleted: false,
                labels: [
                    { id: 1, name: 'A'.repeat(255), color: '#ff0000' } // Maximum name length
                ]
            }

            const result = await createTodoValidator.validate(validData)
            
            assert.deepEqual(result.labels, validData.labels)
            assert.equal(result.labels[0].name.length, 255)
        })

        test('should handle labels with very long color values', async ({ assert }) => {
            const validData = {
                title: 'Valid Todo Title',
                description: 'Valid description',
                isCompleted: false,
                labels: [
                    { id: 1, name: 'Work', color: 'A'.repeat(100) } // Very long color
                ]
            }

            const result = await createTodoValidator.validate(validData)
            
            assert.deepEqual(result.labels, validData.labels)
            assert.equal(result.labels[0].color.length, 100)
        })

        test('should handle many labels', async ({ assert }) => {
            const labels = Array.from({ length: 100 }, (_, i) => ({
                id: i + 1,
                name: `Label ${i + 1}`,
                color: `#${i.toString(16).padStart(6, '0')}`
            }))

            const validData = {
                title: 'Valid Todo Title',
                description: 'Valid description',
                isCompleted: false,
                labels
            }

            const result = await createTodoValidator.validate(validData)
            
            assert.deepEqual(result.labels, validData.labels)
            assert.equal(result.labels.length, 100)
        })

        test('should handle special characters in all fields', async ({ assert }) => {
            const validData = {
                title: 'Todo with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
                description: 'Description with émojis 🚀 and unicode 🌟',
                isCompleted: false,
                labels: [
                    { id: 1, name: 'Label with émojis 🎯', color: '#ff0000' }
                ]
            }

            const result = await createTodoValidator.validate(validData)
            
            assert.equal(result.title, validData.title)
            assert.equal(result.description, validData.description)
            assert.equal(result.isCompleted, validData.isCompleted)
            assert.deepEqual(result.labels, validData.labels)
        })
    })
})
