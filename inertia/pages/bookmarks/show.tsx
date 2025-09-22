import React from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { ArrowLeft, Star, Archive, Trash2, ExternalLink, RefreshCw, Edit } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { useToast } from '../../hooks/useToast'

interface Bookmark {
  id: number
  title: string
  description: string | null
  url: string
  imageUrl: string | null
  siteName: string | null
  isFavorite: boolean
  status: string
  aiGeneratedLabels: string | null
  aiGeneratedSummary: string | null
  createdAt: string
  labels?: Array<{ id: number; name: string; color: string }>

}

interface Props {
  bookmark: Bookmark
}

export default function BookmarkShow({ bookmark }: Props) {
  const { success } = useToast()

  const getParsedLabels = (bookmark: Bookmark): string[] => {
    if (!bookmark.aiGeneratedLabels) return []
    try {
      return JSON.parse(bookmark.aiGeneratedLabels)
    } catch {
      return []
    }
  }

  const toggleFavorite = async () => {
    try {
      const response = await fetch(`/bookmarks/${bookmark.id}/favorite`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      })

      if (response.ok) {
        success('Favorite status updated')
        router.reload()
      }
    } catch (error) {
      console.error('Failed to update favorite status:', error)
    }
  }

  const archiveBookmark = async () => {
    if (!confirm('Are you sure you want to archive this bookmark?')) return

    try {
      const response = await fetch(`/bookmarks/${bookmark.id}/archive`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      })

      if (response.ok) {
        success('Bookmark archived successfully')
        router.visit('/bookmarks')
      }
    } catch (error) {
      console.error('Failed to archive bookmark:', error)
    }
  }

  const deleteBookmark = async () => {
    if (!confirm('Are you sure you want to delete this bookmark? This action cannot be undone.')) return

    try {
      const response = await fetch(`/bookmarks/${bookmark.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      })

      if (response.ok) {
        success('Bookmark deleted successfully')
        router.visit('/bookmarks')
      }
    } catch (error) {
      console.error('Failed to delete bookmark:', error)
    }
  }

  const generateSummary = async () => {
    try {
      const response = await fetch(`/bookmarks/${bookmark.id}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      })

      if (response.ok) {
        success('AI summary generated successfully')
        router.reload()
      }
    } catch (error) {
      console.error('Failed to generate AI summary:', error)
    }
  }

  const regenerateLabels = async () => {
    try {
      const response = await fetch(`/bookmarks/${bookmark.id}/labels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      })

      if (response.ok) {
        success('AI labels regenerated successfully')
        router.reload()
      }
    } catch (error) {
      console.error('Failed to regenerate AI labels:', error)
    }
  }

  return (
    <>
      <Head title={`${bookmark.title} - Bookmark`} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/bookmarks">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Bookmarks
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{bookmark.title}</h1>
              <p className="text-gray-600 mt-1">Bookmark Details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/bookmarks/${bookmark.id}/edit`}>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-full transition-colors ${
                bookmark.isFavorite
                  ? 'text-yellow-500 hover:text-yellow-600'
                  : 'text-gray-400 hover:text-yellow-500'
              }`}
              title={bookmark.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`w-5 h-5 ${bookmark.isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 transition-colors flex items-center gap-2"
                      >
                        {bookmark.title}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </CardTitle>
                    {bookmark.siteName && (
                      <CardDescription className="text-lg">{bookmark.siteName}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Bookmark Image */}
                {bookmark.imageUrl && (
                  <div className="mb-6">
                    <img
                      src={bookmark.imageUrl}
                      alt={bookmark.title}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Description */}
                {bookmark.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{bookmark.description}</p>
                  </div>
                )}

                {/* AI Summary */}
                {bookmark.aiGeneratedSummary && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-blue-800">AI Summary</h3>
                      <button
                        onClick={generateSummary}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Regenerate AI Summary"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-blue-700 leading-relaxed">{bookmark.aiGeneratedSummary}</p>
                  </div>
                )}

                {/* AI Labels */}
                {getParsedLabels(bookmark).length > 0 && (
                  <div className="mb-6 bg-white ">
                    <div className="flex items-center justify-between mb-2  ">
                      <h3 className="text-lg font-semibold">AI Labels</h3>
                      <button
                        onClick={regenerateLabels}
                        className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                        title="Regenerate AI Labels"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getParsedLabels(bookmark).map((label, index) => (
                        <Badge key={index} variant="secondary">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Labels */}
                {bookmark.labels && bookmark.labels.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Labels</h3>
                    <div className="flex flex-wrap gap-2">
                      {bookmark.labels.map((label) => (
                        <Badge
                          key={label.id}
                          style={{ backgroundColor: label.color }}
                          className="text-white"
                        >
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* URL */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">URL</h3>
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 break-all flex items-center gap-2"
                  >
                    {bookmark.url}
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant={bookmark.status === 'active' ? 'default' : 'secondary'}>
                      {bookmark.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Favorite</span>
                    <Badge variant={bookmark.isFavorite ? 'default' : 'secondary'}>
                      {bookmark.isFavorite ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Created</span>
                    <span className="text-sm text-gray-600">
                      {new Date(bookmark.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={generateSummary}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate AI Summary
                </Button>
                <Button
                  onClick={regenerateLabels}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate AI Labels
                </Button>
                <Button
                  onClick={archiveBookmark}
                  variant="outline"
                  className="w-full justify-start text-orange-600 hover:text-orange-700"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive Bookmark
                </Button>
                <Button
                  onClick={deleteBookmark}
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Bookmark
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
