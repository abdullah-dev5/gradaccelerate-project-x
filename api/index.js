// Vercel serverless function for AdonisJS
import { Ignitor } from '@adonisjs/core'
import { URL } from 'url'

const APP_ROOT = new URL('../../', import.meta.url)

const IMPORTER = (filePath) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

const ignitor = new Ignitor(APP_ROOT, { importer: IMPORTER })
let app = null

export default async function handler(req, res) {
  try {
    if (!app) {
      app = await ignitor.boot()
      await app.startHttpServer()
    }
    
    // Handle the request through AdonisJS
    // This is a simplified version - you may need to adapt based on your routes
    res.status(200).json({ 
      message: 'AdonisJS app is running',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      error: 'Server error',
      message: error.message 
    })
  }
}

