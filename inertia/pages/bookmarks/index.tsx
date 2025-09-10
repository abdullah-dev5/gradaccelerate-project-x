import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { Plus, Search, Filter, Star, Archive, Trash2, ExternalLink, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
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

interface Label {
  id: number
  name: string
  color: string
}

interface Filters {
  search: string
  sort: string
  order: string
  status: string
  isFavorite: boolean | null
  labels: number[]
}

interface Props {
  bookmarks: {
    data: Bookmark[]
    meta: any
  }
  labels: Label[]
  filters: Filters
}

export default function BookmarksIndex({ bookmarks, labels, filters }: Props) {
  const { success } = useToast()
  const [searchTerm, setSearchTerm] = useState(filters.search || '')
  const [selectedLabels, setSelectedLabels] = useState<number[]>(filters.labels || [])
  const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all')
  const [selectedFavorite, setSelectedFavorite] = useState<boolean | null>(filters.isFavorite || null)
  const [sortBy, setSortBy] = useState(filters.sort || 'created_at')
  const [sortOrder] = useState(filters.order || 'desc')

  const applyFilters = () => {
    const params = {
      search: searchTerm,
      labels: selectedLabels,
      status: selectedStatus === 'all' ? '' : selectedStatus,
      isFavorite: selectedFavorite === null ? null : selectedFavorite,
      sort: sortBy,
      order: sortOrder,
    }

    router.get('/bookmarks', params, {
      preserveState: true,
      preserveScroll: true,
    })
  }

  const toggleFavorite = async (bookmarkId: number) => {
    try {
      const response = await fetch(`/bookmarks/${bookmarkId}/favorite`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      })

      if (response.ok) {
        success('Favorite status updated')
        // Refresh the page to show updated state
        router.reload()
      }
    } catch (error) {
      error('Failed to update favorite status')
    }
  }

  const archiveBookmark = async (bookmarkId: number) => {
    if (!confirm('Are you sure you want to archive this bookmark?')) return

    try {
      const response = await fetch(`/bookmarks/${bookmarkId}/archive`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      })

              if (response.ok) {
          success('Bookmark archived successfully')
          router.reload()
        }
      } catch (error) {
        error('Failed to archive bookmark')
      }
  }

  const deleteBookmark = async (bookmarkId: number) => {
    if (!confirm('Are you sure you want to delete this bookmark? This action cannot be undone.')) return

    try {
      const response = await fetch(`/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      })

              if (response.ok) {
          success('Bookmark deleted successfully')
          router.reload()
        }
      } catch (error) {
        error('Failed to delete bookmark')
      }
  }

  const generateSummary = async (bookmarkId: number) => {
    try {
      const response = await fetch(`/bookmarks/${bookmarkId}/summary`, {
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
        error('Failed to generate AI summary')
      }
  }

  const regenerateLabels = async (bookmarkId: number) => {
    try {
      const response = await fetch(`/bookmarks/${bookmarkId}/labels`, {
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
        error('Failed to regenerate AI labels')
      }
  }

  const getParsedLabels = (bookmark: Bookmark): string[] => {
    if (!bookmark.aiGeneratedLabels) return []
    try {
      return JSON.parse(bookmark.aiGeneratedLabels)
    } catch {
      return []
    }
  }

  return (
    <>
      <Head title="Bookmarks" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="text-[#98989D] hover:text-white transition-colors p-4 hover:bg-[#3A3A3C] rounded-xl"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
          <div>
            <h1 className="text-3xl  font-bold text-gray-200">Bookmarks</h1>
            <p className="text-gray-600 mt-2">Save and organize your favorite links with AI-powered features</p>
          </div>
          </div>
          <Link href="/bookmarks/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Bookmark
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <h3 className="text-lg font-semibold">Filters & Search</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <Input
                  placeholder="Search bookmarks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Favorite */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Favorite</label>
                <Select 
                  value={selectedFavorite === null ? 'all' : selectedFavorite.toString()} 
                  onValueChange={(value) => setSelectedFavorite(value === 'all' ? null : value === 'true')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All bookmarks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All bookmarks</SelectItem>
                    <SelectItem value="true">Favorites only</SelectItem>
                    <SelectItem value="false">Non-favorites</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Created date</SelectItem>
                    <SelectItem value="updated_at">Updated date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="is_favorite">Favorite status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Labels filter */}
            {labels && labels.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Labels</label>
                <div className="flex flex-wrap gap-2">
                  {labels.map((label) => (
                    <button
                      key={label.id}
                      onClick={() => {
                        const newLabels = selectedLabels.includes(label.id)
                          ? selectedLabels.filter(id => id !== label.id)
                          : [...selectedLabels, label.id]
                        setSelectedLabels(newLabels)
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedLabels.includes(label.id)
                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Apply filters button */}
            <div className="mt-4">
              <Button onClick={applyFilters} className="w-full md:w-auto">
                <Search className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bookmarks Grid */}
        {!bookmarks || !bookmarks.data || bookmarks.data.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-500">
                <p className="text-lg mb-2">No bookmarks found</p>
                <p className="mb-4">Start by adding your first bookmark!</p>
                <Link href="/bookmarks/create">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Bookmark
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.data.map((bookmark) => (
              <Card key={bookmark.id} className="hover:shadow-lg transition-shadow">
                {/* Bookmark Image */}
                {bookmark.imageUrl && (
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img
                      src={bookmark.imageUrl}
                      alt={bookmark.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 mb-2">
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 transition-colors"
                        >
                          {bookmark.title}
                        </a>
                      </CardTitle>
                      {bookmark.siteName && (
                        <p className="text-sm text-gray-500 mb-2">{bookmark.siteName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleFavorite(bookmark.id)}
                        className={`p-2 rounded-full transition-colors ${
                          bookmark.isFavorite
                            ? 'text-yellow-500 hover:text-yellow-600'
                            : 'text-gray-400 hover:text-yellow-500'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${bookmark.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Description */}
                  {bookmark.description && (
                    <CardDescription className="line-clamp-3 mb-4">
                      {bookmark.description}
                    </CardDescription>
                  )}

                  {/* AI Summary */}
                  {bookmark.aiGeneratedSummary && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium mb-1">AI Summary:</p>
                      <p className="text-sm text-blue-700 line-clamp-3">
                        {bookmark.aiGeneratedSummary}
                      </p>
                    </div>
                  )}

                  {/* AI Labels */}
                  {getParsedLabels(bookmark).length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-200 mb-2">AI Labels:</p>
                      <div className="flex flex-wrap gap-1">
                        {getParsedLabels(bookmark).map((label, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manual Labels */}
                  {bookmark.labels && bookmark.labels.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-white-200 mb-2">Labels:</p>
                      <div className="flex flex-wrap gap-1">
                        {bookmark.labels.map((label) => (
                          <Badge
                            key={label.id}
                            style={{ backgroundColor: label.color }}
                            className="text-white text-xs"
                          >
                            {label.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Link href={`/bookmarks/${bookmark.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      <Link href={`/bookmarks/${bookmark.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => generateSummary(bookmark.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Generate AI Summary"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => regenerateLabels(bookmark.id)}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="Regenerate AI Labels"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => archiveBookmark(bookmark.id)}
                        className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                        title="Archive"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteBookmark(bookmark.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* URL and Date */}
                  <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                      <span className="truncate max-w-[200px]">
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 transition-colors flex items-center gap-1"
                        >
                          {new URL(bookmark.url).hostname}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </span>
                      <span>
                        {new Date(bookmark.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {bookmarks && bookmarks.meta && bookmarks.meta.last_page > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              {Array.from({ length: bookmarks.meta.last_page }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search)
                    params.set('page', page.toString())
                    router.get('/bookmarks', Object.fromEntries(params), {
                      preserveState: true,
                      preserveScroll: true,
                    })
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    page === bookmarks.meta.current_page
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
