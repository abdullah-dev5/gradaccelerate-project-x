import { Head, Link, router } from '@inertiajs/react'
import { ArrowLeft, Save, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { useToast } from '../../hooks/useToast'
import { useState } from 'react'

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

interface Props {
  bookmark: Bookmark
  allLabels: Label[]
}

export default function BookmarkEdit({ bookmark, allLabels }: Props) {
  const { success } = useToast()
  const [formData, setFormData] = useState({
    title: bookmark.title,
    description: bookmark.description || '',
    url: bookmark.url,
    isFavorite: bookmark.isFavorite,
    status: bookmark.status,
    selectedLabels: bookmark.labels?.map(label => label.id) || []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLabelToggle = (labelId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedLabels: prev.selectedLabels.includes(labelId)
        ? prev.selectedLabels.filter(id => id !== labelId)
        : [...prev.selectedLabels, labelId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/bookmarks/${bookmark.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          url: formData.url,
          isFavorite: formData.isFavorite,
          status: formData.status,
          labels: formData.selectedLabels
        })
      })

      if (response.ok) {
        success('Bookmark updated successfully')
        router.visit(`/bookmarks/${bookmark.id}`)
      } else {
        const errorData = await response.json()
        console.error('Update failed:', errorData)
        success('Failed to update bookmark')
      }
    } catch (error) {
      console.error('Error updating bookmark:', error)
      success('Failed to update bookmark')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Head title={`Edit ${bookmark.title} - Bookmark`} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href={`/bookmarks/${bookmark.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Bookmark
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Bookmark</h1>
              <p className="text-gray-600 mt-1">Update bookmark details</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Bookmark Details</CardTitle>
              <CardDescription>
                Update the information for this bookmark
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <Input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                    className="w-full"
                  />
                </div>

                {/* URL */}
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                    URL *
                  </label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                    required
                    className="w-full"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full"
                    placeholder="Enter a description for this bookmark..."
                  />
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* Favorite */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isFavorite"
                    checked={formData.isFavorite}
                    onChange={(e) => handleInputChange('isFavorite', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isFavorite" className="text-sm font-medium text-gray-700">
                    Mark as favorite
                  </label>
                </div>

                {/* Labels */}
                {allLabels && allLabels.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Labels
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allLabels.map((label) => (
                        <button
                          key={label.id}
                          type="button"
                          onClick={() => handleLabelToggle(label.id)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            formData.selectedLabels.includes(label.id)
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

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t">
                  <Link href={`/bookmarks/${bookmark.id}`}>
                    <Button type="button" variant="outline">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
