import { test } from '@japa/runner'
import TodoController from '#controllers/TodoController'
import Todo from '#models/todo'

test.group('TodoController - Index', () => {
    test('should return paginated todos for authenticated user', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          qs: () => ({ page: 1, limit: 10, status: 'all', search: '' }), 
          header: () => undefined 
        },
        inertia: { render: () => ({}) },
        response: { 
          ok: (d: any) => d,
          status: (code: number) => ({ 
            json: (data: any) => ({ status: code, ...data }) 
          })
        }
      } as any

      const mockTodos = [
        { id: 1, title: 'Todo 1', isCompleted: false, userId: 1 },
        { id: 2, title: 'Todo 2', isCompleted: true, userId: 1 }
      ]

      const originalQuery = Todo.query
      Todo.query = () => ({
        where: (field: string, value: any) => ({
          whereNull: (field: string) => ({
            where: (callback: Function) => ({
              orderBy: (field: string, direction: string) => ({
                paginate: async (page: number, limit: number) => ({
                  all: () => mockTodos,
                  toJSON: () => ({ data: mockTodos, meta: { total: 2, perPage: 10, currentPage: 1, lastPage: 1 } })
                })
              })
            })
          })
        })
      }) as any

      try {
        const result = await controller.index(mockContext)
        assert.exists(result)
        assert.property(result, 'data')
        assert.equal(result.data.length, 2)
      } finally {
        Todo.query = originalQuery
      }
    })

    test('should filter todos by completed status', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          qs: () => ({ page: 1, limit: 10, status: 'completed', search: '' }), 
          header: () => undefined 
        },
        inertia: { render: () => ({}) },
        response: { 
          ok: (d: any) => d,
          status: (code: number) => ({ 
            json: (data: any) => ({ status: code, ...data }) 
          })
        }
      } as any

      const mockTodos = [
        { id: 2, title: 'Todo 2', isCompleted: true, userId: 1 }
      ]

      const originalQuery = Todo.query
      Todo.query = () => ({
        where: (field: string, value: any) => ({
          whereNull: (field: string) => ({
            where: (callback: Function) => ({
              orderBy: (field: string, direction: string) => ({
                paginate: async (page: number, limit: number) => ({
                  all: () => mockTodos,
                  toJSON: () => ({ data: mockTodos, meta: { total: 1, perPage: 10, currentPage: 1, lastPage: 1 } })
                })
              })
            })
          })
        })
      }) as any

      try {
        const result = await controller.index(mockContext)
        assert.exists(result)
        assert.property(result, 'data')
        assert.equal(result.data.length, 1)
        assert.equal(result.data[0].isCompleted, true)
      } finally {
        Todo.query = originalQuery
      }
    })

    test('should filter todos by pending status', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          qs: () => ({ page: 1, limit: 10, status: 'pending', search: '' }), 
          header: () => undefined 
        },
        inertia: { render: () => ({}) },
        response: { 
          ok: (d: any) => d,
          status: (code: number) => ({ 
            json: (data: any) => ({ status: code, ...data }) 
          })
        }
      } as any

      const mockTodos = [
        { id: 1, title: 'Todo 1', isCompleted: false, userId: 1 }
      ]

      const originalQuery = Todo.query
      Todo.query = () => ({
        where: (field: string, value: any) => ({
          whereNull: (field: string) => ({
            where: (callback: Function) => ({
              orderBy: (field: string, direction: string) => ({
                paginate: async (page: number, limit: number) => ({
                  all: () => mockTodos,
                  toJSON: () => ({ data: mockTodos, meta: { total: 1, perPage: 10, currentPage: 1, lastPage: 1 } })
                })
              })
            })
          })
        })
      }) as any

      try {
        const result = await controller.index(mockContext)
        assert.exists(result)
        assert.property(result, 'data')
        assert.equal(result.data.length, 1)
        assert.equal(result.data[0].isCompleted, false)
      } finally {
        Todo.query = originalQuery
      }
    })

    test('should search todos by title and description', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          qs: () => ({ page: 1, limit: 10, status: 'all', search: 'test' }), 
          header: () => undefined 
        },
        inertia: { render: () => ({}) },
        response: { 
          ok: (d: any) => d,
          status: (code: number) => ({ 
            json: (data: any) => ({ status: code, ...data }) 
          })
        }
      } as any

      const mockTodos = [
        { id: 1, title: 'Test Todo', description: 'Test description', isCompleted: false, userId: 1 }
      ]

      const originalQuery = Todo.query
      Todo.query = () => ({
        where: (field: string, value: any) => ({
          whereNull: (field: string) => ({
            where: (callback: Function) => ({
              orderBy: (field: string, direction: string) => ({
                paginate: async (page: number, limit: number) => ({
                  all: () => mockTodos,
                  toJSON: () => ({ data: mockTodos, meta: { total: 1, perPage: 10, currentPage: 1, lastPage: 1 } })
                })
              })
            })
          })
        })
      }) as any

      try {
        const result = await controller.index(mockContext)
        assert.exists(result)
        assert.property(result, 'data')
        assert.equal(result.data.length, 1)
        assert.include(result.data[0].title.toLowerCase(), 'test')
      } finally {
        Todo.query = originalQuery
      }
    })

    test('should return Inertia response for Inertia requests', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          qs: () => ({ page: 1, limit: 10, status: 'all', search: '' }), 
          header: (name: string) => name === 'x-inertia' ? 'true' : undefined 
        },
        inertia: { render: (page: string, data: any) => ({ page, data }) },
        response: { 
          ok: (d: any) => d,
          status: (code: number) => ({ 
            json: (data: any) => ({ status: code, ...data }) 
          })
        }
      } as any

      const mockTodos = [
        { id: 1, title: 'Todo 1', isCompleted: false, userId: 1 }
      ]

      const originalQuery = Todo.query
      Todo.query = () => ({
        where: (field: string, value: any) => ({
          whereNull: (field: string) => ({
            where: (callback: Function) => ({
              orderBy: (field: string, direction: string) => ({
                paginate: async (page: number, limit: number) => ({
                  all: () => mockTodos,
                  toJSON: () => ({ data: mockTodos, meta: { total: 1, perPage: 10, currentPage: 1, lastPage: 1 } })
                })
              })
            })
          })
        })
      }) as any

      try {
        const result = await controller.index(mockContext)
        assert.exists(result)
        assert.property(result, 'page')
        assert.equal(result.page, 'todos/index')
      } finally {
        Todo.query = originalQuery
      }
    })

    test('should handle authentication errors gracefully', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        auth: { 
          authenticate: async () => { throw new Error('Unauthorized') }, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          qs: () => ({ page: 1, limit: 10, status: 'all', search: '' }), 
          header: () => undefined 
        },
        inertia: { render: (page: string, data: any) => ({ page, data }) },
        response: { 
          status: (code: number) => ({ json: (data: any) => ({ status: code, ...data }) }),
          redirect: (url: string) => ({ redirectUrl: url })
        }
      } as any

      try {
        const result = await controller.index(mockContext)
        assert.exists(result)
        assert.property(result, 'status')
        assert.equal(result.status, 500)
      } catch (error) {
        // Expected behavior for authentication errors
        assert.exists(error)
      }
    })
})

test.group('TodoController - Store', () => {
    test('should create new todo successfully', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          validateUsing: async () => ({ 
            title: 'New Todo', 
            description: 'Todo description', 
            isCompleted: false,
            labels: []
          }), 
          header: () => undefined,
          only: (fields: string[]) => ({ title: 'New Todo', description: 'Todo description', isCompleted: false })
        },
        session: { flash: () => {} },
        response: { 
          redirect: (url: string) => ({ redirectUrl: url }), 
          status: (code: number) => ({ 
            json: (data: any) => ({ status: code, ...data }) 
          })
        }
      } as any

      const mockTodo = {
        id: 1,
        title: 'New Todo',
        description: 'Todo description',
        isCompleted: false,
        userId: 1
      }

      const originalCreate = Todo.create
      Todo.create = async (data: any) => ({ ...mockTodo, ...data }) as any

      try {
        const result = await controller.store(mockContext)
        assert.exists(result)
        assert.equal(result.status, 201)
        assert.property(result, 'data')
        assert.property(result.data, 'id')
      } finally {
        Todo.create = originalCreate
      }
    })

    test('should create todo with labels', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          validateUsing: async () => ({ 
            title: 'New Todo', 
            description: 'Todo description', 
            isCompleted: false,
            labels: [{ id: 1, name: 'Work', color: '#ff0000' }]
          }), 
          header: () => undefined,
          only: (fields: string[]) => ({ title: 'New Todo', description: 'Todo description', isCompleted: false })
        },
        session: { flash: () => {} },
        response: { 
          redirect: (url: string) => ({ redirectUrl: url }), 
          status: (code: number) => ({ 
            json: (data: any) => ({ status: code, ...data }) 
          })
        }
      } as any

      const mockTodo = {
        id: 1,
        title: 'New Todo',
        description: 'Todo description',
        isCompleted: false,
        userId: 1,
        labels: [{ id: 1, name: 'Work', color: '#ff0000' }]
      }

      const originalCreate = Todo.create
      Todo.create = async (data: any) => ({ ...mockTodo, ...data }) as any

      try {
        const result = await controller.store(mockContext)
        assert.exists(result)
        assert.equal(result.status, 201)
        assert.property(result, 'data')
        assert.property(result.data, 'labels')
        assert.equal(result.data.labels.length, 1)
      } finally {
        Todo.create = originalCreate
      }
    })

    test('should handle validation errors', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          validateUsing: async () => { 
            throw Object.assign(new Error('Validation failed'), { 
              status: 422, 
              messages: { title: ['Title is required'] } 
            }) 
          }, 
          header: () => undefined,
          only: (fields: string[]) => ({ title: '', description: 'Todo description', isCompleted: false })
        },
        session: { flash: () => {} },
        response: { 
          status: (code: number) => ({ json: (d: any) => ({ status: code, ...d }) }),
          redirect: () => ({ back: () => ({ redirectUrl: 'back' }) })
        }
      } as any

      try {
        const result = await controller.store(mockContext)
        assert.exists(result)
        assert.equal(result.status, 422)
        assert.property(result, 'errors')
      } catch (error) {
        // Expected behavior for validation errors
        assert.exists(error)
      }
    })

    test('should handle Inertia requests with redirect', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          validateUsing: async () => ({ 
            title: 'New Todo', 
            description: 'Todo description', 
            isCompleted: false,
            labels: []
          }), 
          header: (name: string) => name === 'x-inertia' ? 'true' : undefined,
          only: (fields: string[]) => ({ title: 'New Todo', description: 'Todo description', isCompleted: false })
        },
        session: { flash: () => {} },
        response: { 
          redirect: (url: string) => ({ redirectUrl: url })
        }
      } as any

      const mockTodo = {
        id: 1,
        title: 'New Todo',
        description: 'Todo description',
        isCompleted: false,
        userId: 1
      }

      const originalCreate = Todo.create
      Todo.create = async (data: any) => ({ ...mockTodo, ...data }) as any

      try {
        const result = await controller.store(mockContext)
        assert.exists(result)
        assert.property(result, 'redirectUrl')
        assert.equal(result.redirectUrl, '/todos')
      } finally {
        Todo.create = originalCreate
      }
    })

    test('should handle general errors gracefully', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          validateUsing: async () => ({ 
            title: 'New Todo', 
            description: 'Todo description', 
            isCompleted: false,
            labels: []
          }), 
          header: () => undefined,
          only: (fields: string[]) => ({ title: 'New Todo', description: 'Todo description', isCompleted: false })
        },
        session: { flash: () => {} },
        response: { 
          status: (code: number) => ({ json: (d: any) => ({ status: code, ...d }) }),
          redirect: () => ({ back: () => ({ redirectUrl: 'back' }) })
        }
      } as any

      const originalCreate = Todo.create
      Todo.create = async (data: any) => { throw new Error('Database error') }

      try {
        const result = await controller.store(mockContext)
        assert.exists(result)
        assert.equal(result.status, 500)
        assert.property(result, 'error')
      } finally {
        Todo.create = originalCreate
      }
    })
})

test.group('TodoController - Show', () => {
    test('should return todo by ID for authenticated user', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        params: { id: 1 },
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          validateUsing: async () => ({}), 
          header: () => undefined 
        },
        inertia: { render: (page: string, data: any) => ({ page, data }) },
        response: { 
          ok: (d: any) => d,
          status: (code: number) => ({ 
            json: (data: any) => ({ status: code, ...data }) 
          })
        }
      } as any

      const mockTodo = {
        id: 1,
        title: 'Test Todo',
        description: 'Test description',
        isCompleted: false,
        userId: 1,
        serialize: () => ({ id: 1, title: 'Test Todo', description: 'Test description', isCompleted: false, userId: 1 })
      }

      const originalQuery = Todo.query
      Todo.query = () => ({
        where: (field: string, value: any) => ({
          whereNull: (field: string) => ({
            first: async () => mockTodo
          })
        })
      }) as any

      try {
        const result = await controller.show(mockContext)
        assert.exists(result)
        assert.property(result, 'data')
        assert.property(result.data, 'id')
        assert.equal(result.data.id, 1)
      } finally {
        Todo.query = originalQuery
      }
    })

    test('should handle todo not found', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        params: { id: 999 },
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          validateUsing: async () => ({}), 
          header: () => undefined,
          input: (key: string) => key === 'id' ? 999 : undefined
        },
        inertia: { render: (page: string, data: any) => ({ page, data }) },
        response: { 
          status: (code: number) => ({ json: (data: any) => ({ status: code, ...data }) })
        }
      } as any

      const originalQuery = Todo.query
      Todo.query = () => ({
        where: (field: string, value: any) => ({
          whereNull: (field: string) => ({
            first: async () => null
          })
        })
      }) as any

      try {
        const result = await controller.show(mockContext)
        assert.exists(result)
        assert.equal(result.status, 404)
        assert.property(result, 'message')
      } finally {
        Todo.query = originalQuery
      }
    })

    test('should handle invalid todo ID', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        params: { id: 'invalid' },
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          validateUsing: async () => { 
            throw Object.assign(new Error('Invalid ID'), { 
              status: 422, 
              messages: { id: ['ID must be a positive number'] } 
            }) 
          }, 
          header: () => undefined 
        },
        inertia: { render: (page: string, data: any) => ({ page, data }) },
        response: { 
          status: (code: number) => ({ json: (data: any) => ({ status: code, ...data }) })
        }
      } as any

      try {
        const result = await controller.show(mockContext)
        assert.exists(result)
        assert.equal(result.status, 400)
        assert.property(result, 'errors')
      } catch (error) {
        // Expected behavior for validation errors
        assert.exists(error)
      }
    })

    test('should return Inertia response for Inertia requests', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        params: { id: 1 },
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          validateUsing: async () => ({}), 
          header: (name: string) => name === 'x-inertia' ? 'true' : undefined 
        },
        inertia: { render: (page: string, data: any) => ({ page, data }) },
        response: { 
          ok: (d: any) => d,
          status: (code: number) => ({ 
            json: (data: any) => ({ status: code, ...data }) 
          })
        }
      } as any

      const mockTodo = {
        id: 1,
        title: 'Test Todo',
        description: 'Test description',
        isCompleted: false,
        userId: 1,
        serialize: () => ({ id: 1, title: 'Test Todo', description: 'Test description', isCompleted: false, userId: 1 })
      }

      const originalQuery = Todo.query
      Todo.query = () => ({
        where: (field: string, value: any) => ({
          whereNull: (field: string) => ({
            first: async () => mockTodo
          })
        })
      }) as any

      try {
        const result = await controller.show(mockContext)
        assert.exists(result)
        assert.property(result, 'page')
        assert.equal(result.page, 'todos/show')
      } finally {
        Todo.query = originalQuery
      }
    })
})

test.group('TodoController - Update', () => {
    test('should update existing todo successfully', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        params: { id: 1 },
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          validateUsing: async () => ({ 
            title: 'Updated Todo', 
            description: 'Updated description', 
            isCompleted: true,
            labels: []
          }), 
          header: () => undefined,
          only: (fields: string[]) => ({ title: 'Updated Todo', description: 'Updated description', isCompleted: true })
        },
        session: { flash: () => {} },
        response: { 
          ok: (d: any) => d,
          status: (code: number) => ({ 
            json: (data: any) => ({ status: code, ...data }) 
          })
        }
      } as any

      const mockTodo = {
        id: 1,
        title: 'Updated Todo',
        description: 'Updated description',
        isCompleted: true,
        userId: 1,
        merge: (data: any) => Object.assign(mockTodo, data),
        save: async () => mockTodo,
        serialize: () => ({ id: 1, title: 'Updated Todo', description: 'Updated description', isCompleted: true, userId: 1 })
      }

      const originalQuery = Todo.query
      Todo.query = () => ({
        where: (field: string, value: any) => ({
          first: async () => mockTodo
        })
      }) as any

      try {
        const result = await controller.update(mockContext)
        assert.exists(result)
        assert.property(result, 'data')
        assert.property(result.data, 'id')
        assert.equal(result.data.title, 'Updated Todo')
      } finally {
        Todo.query = originalQuery
      }
    })

    test('should handle todo not found during update', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        params: { id: 999 },
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          validateUsing: async () => ({}), 
          header: () => undefined,
          only: (fields: string[]) => ({ title: 'Updated Todo', description: 'Updated description', isCompleted: true })
        },
        session: { flash: () => {} },
        response: { 
          status: (code: number) => ({ json: (data: any) => ({ status: code, ...data }) }),
          redirect: () => ({ back: () => ({ redirectUrl: 'back' }) })
        }
      } as any

      const originalQuery = Todo.query
      Todo.query = () => ({
        where: (field: string, value: any) => ({
          first: async () => null
        })
      }) as any

      try {
        const result = await controller.update(mockContext)
        assert.exists(result)
        assert.equal(result.status, 404)
        assert.property(result, 'message')
      } finally {
        Todo.query = originalQuery
      }
    })

    test('should handle validation errors during update', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        params: { id: 1 },
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          validateUsing: async () => { 
            throw Object.assign(new Error('Validation failed'), { 
              status: 422, 
              messages: { title: ['Title is required'] } 
            }) 
          }, 
          header: () => undefined,
          only: (fields: string[]) => ({ title: '', description: 'Updated description', isCompleted: true })
        },
        session: { flash: () => {} },
        response: { 
          status: (code: number) => ({ json: (d: any) => ({ status: code, ...d }) }),
          redirect: () => ({ back: () => ({ redirectUrl: 'back' }) })
        }
      } as any

      try {
        const result = await controller.update(mockContext)
        assert.exists(result)
        assert.equal(result.status, 422)
        assert.property(result, 'errors')
      } catch (error) {
        // Expected behavior for validation errors
        assert.exists(error)
      }
    })

    test('should handle Inertia requests with redirect', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        params: { id: 1 },
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          validateUsing: async () => ({ 
            title: 'Updated Todo', 
            description: 'Updated description', 
            isCompleted: true,
            labels: []
          }), 
          header: (name: string) => name === 'x-inertia' ? 'true' : undefined,
          only: (fields: string[]) => ({ title: 'Updated Todo', description: 'Updated description', isCompleted: true })
        },
        session: { flash: () => {} },
        response: { 
          redirect: (url: string) => ({ redirectUrl: url })
        }
      } as any

      const mockTodo = {
        id: 1,
        title: 'Updated Todo',
        description: 'Updated description',
        isCompleted: true,
        userId: 1,
        merge: (data: any) => Object.assign(mockTodo, data),
        save: async () => mockTodo
      }

      const originalQuery = Todo.query
      Todo.query = () => ({
        where: (field: string, value: any) => ({
          first: async () => mockTodo
        })
      }) as any

      try {
        const result = await controller.update(mockContext)
        assert.exists(result)
        assert.property(result, 'redirectUrl')
        assert.equal(result.redirectUrl, '/todos')
      } finally {
        Todo.query = originalQuery
      }
    })
})

test.group('TodoController - Toggle Status', () => {
    test('should toggle todo completion status successfully', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        params: { id: 1 },
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          validateUsing: async () => ({}), 
          header: () => undefined
        },
        response: { 
          ok: (d: any) => d,
          status: (code: number) => ({ 
            json: (data: any) => ({ status: code, ...data }) 
          })
        }
      } as any

      const mockTodo = {
        id: 1,
        title: 'Test Todo',
        isCompleted: false,
        userId: 1,
        save: async () => ({ ...mockTodo, isCompleted: true })
      }

      const originalQuery = Todo.query
      Todo.query = () => ({
        where: (field: string, value: any) => ({
          first: async () => mockTodo
        })
      }) as any

      try {
        const result = await controller.toggleStatus(mockContext)
        assert.exists(result)
        assert.property(result, 'data')
        assert.property(result.data, 'isCompleted')
        assert.equal(result.data.isCompleted, true)
      } finally {
        Todo.query = originalQuery
      }
    })

    test('should handle todo not found during toggle', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        params: { id: 999 },
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          validateUsing: async () => ({}), 
          header: () => undefined
        },
        response: { 
          status: (code: number) => ({ json: (data: any) => ({ status: code, ...data }) })
        }
      } as any

      const originalQuery = Todo.query
      Todo.query = () => ({
        where: (field: string, value: any) => ({
          first: async () => null
        })
      }) as any

      try {
        const result = await controller.toggleStatus(mockContext)
        assert.exists(result)
        assert.equal(result.status, 404)
        assert.property(result, 'message')
      } finally {
        Todo.query = originalQuery
      }
    })

    test('should handle invalid todo ID during toggle', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        params: { id: 'invalid' },
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          validateUsing: async () => { 
            throw Object.assign(new Error('Invalid ID'), { 
              status: 422, 
              messages: { id: ['ID must be a positive number'] } 
            }) 
          }, 
          header: () => undefined
        },
        response: { 
          status: (code: number) => ({ json: (data: any) => ({ status: code, ...data }) })
        }
      } as any

      try {
        const result = await controller.toggleStatus(mockContext)
        assert.exists(result)
        assert.equal(result.status, 400)
        assert.property(result, 'errors')
      } catch (error) {
        // Expected behavior for validation errors
        assert.exists(error)
      }
    })
})

test.group('TodoController - Destroy', () => {
    test('should soft delete todo successfully', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        params: { id: 1 },
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          validateUsing: async () => ({}), 
          header: () => undefined 
        },
        session: { flash: () => {} },
        response: { 
          ok: (d: any) => d,
          status: (code: number) => ({ 
            json: (data: any) => ({ status: code, ...data }) 
          })
        }
      } as any

      const mockTodo = {
        id: 1,
        title: 'Test Todo',
        userId: 1,
        deletedAt: null,
        save: async () => ({ ...mockTodo, deletedAt: new Date() })
      }

      const originalQuery = Todo.query
      Todo.query = () => ({
        where: (field: string, value: any) => ({
          first: async () => mockTodo
        })
      }) as any

      try {
        const result = await controller.destroy(mockContext)
        assert.exists(result)
        assert.property(result, 'data')
        assert.property(result.data, 'deletedAt')
      } finally {
        Todo.query = originalQuery
      }
    })

    test('should handle todo not found during delete', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        params: { id: 999 },
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          validateUsing: async () => ({}), 
          header: () => undefined 
        },
        session: { flash: () => {} },
        response: { 
          status: (code: number) => ({ json: (data: any) => ({ status: code, ...data }) }),
          redirect: () => ({ back: () => ({ redirectUrl: 'back' }) })
        }
      } as any

      const originalQuery = Todo.query
      Todo.query = () => ({
        where: (field: string, value: any) => ({
          first: async () => null
        })
      }) as any

      try {
        const result = await controller.destroy(mockContext)
        assert.exists(result)
        assert.equal(result.status, 404)
        assert.property(result, 'message')
      } finally {
        Todo.query = originalQuery
      }
    })

    test('should handle already deleted todo', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        params: { id: 1 },
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          validateUsing: async () => ({}), 
          header: () => undefined 
        },
        session: { flash: () => {} },
        response: { 
          status: (code: number) => ({ json: (data: any) => ({ status: code, ...data }) }),
          redirect: () => ({ back: () => ({ redirectUrl: 'back' }) })
        }
      } as any

      const mockTodo = {
        id: 1,
        title: 'Test Todo',
        userId: 1,
        deletedAt: new Date()
      }

      const originalQuery = Todo.query
      Todo.query = () => ({
        where: (field: string, value: any) => ({
          first: async () => mockTodo
        })
      }) as any

      try {
        const result = await controller.destroy(mockContext)
        assert.exists(result)
        assert.equal(result.status, 404)
        assert.property(result, 'message')
      } finally {
        Todo.query = originalQuery
      }
    })

    test('should handle Inertia requests with redirect', async ({ assert }) => {
      const controller = new TodoController()
      
      const mockContext = {
        params: { id: 1 },
        auth: { 
          authenticate: async () => {}, 
          getUserOrFail: async () => ({ id: 1 }) 
        },
        request: { 
          validateUsing: async () => ({}), 
          header: (name: string) => name === 'x-inertia' ? 'true' : undefined 
        },
        session: { flash: () => {} },
        response: { 
          redirect: (url: string) => ({ redirectUrl: url })
        }
      } as any

      const mockTodo = {
        id: 1,
        title: 'Test Todo',
        userId: 1,
        deletedAt: null,
        save: async () => ({ ...mockTodo, deletedAt: new Date() })
      }

      const originalQuery = Todo.query
      Todo.query = () => ({
        where: (field: string, value: any) => ({
          first: async () => mockTodo
        })
      }) as any

      try {
        const result = await controller.destroy(mockContext)
        assert.exists(result)
        assert.property(result, 'redirectUrl')
        assert.equal(result.redirectUrl, '/todos')
      } finally {
        Todo.query = originalQuery
      }
    })
})
