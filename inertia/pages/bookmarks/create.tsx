import React, { useState } from 'react'
import { Head, Link, router, useForm } from '@inertiajs/react'
import { ArrowLeft, Link as LinkIcon, Eye, EyeOff, Star, Tag, Loader2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Checkbox } from '../../components/ui/checkbox'
import { Badge } from '../../components/ui/badge'
import { useToast } from '../../hooks/useToast'

interface Label {
  id: number
  name: string
  color: string
}

interface OpenGraphPreview {
  title: string
  description: string | null
  imageUrl: string | null
  siteName: string | null
  url: string
}

export default function CreateBookmark() {
  const { success, error, warning } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [openGraphData, setOpenGraphData] = useState<OpenGraphPreview | null>(null)
  const [availableLabels, setAvailableLabels] = useState<Label[]>([])

  const { data, setData, post, processing, errors } = useForm({
    url: '',
    title: '',
    description: '',
    imageUrl: '',
    siteName: '',
    isFavorite: false,
    labels: [] as number[],
  })

  // Fetch available labels on component mount
  React.useEffect(() => {
    fetch('/api/labels')
      .then(response => response.json())
      .then(labels => setAvailableLabels(labels))
      .catch(error => console.error('Error fetching labels:', error))
  }, [])

  const validateUrl = async () => {
    if (!data.url) {
      warning('Please enter a URL first')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/bookmarks/validate-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ url: data.url }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.isValid) {
          setOpenGraphData(result.data)
          setShowPreview(true)
          
          // Auto-fill form fields with Open Graph data
          setData({
            ...data,
            title: result.data.title || data.title,
            description: result.data.description || data.description,
            imageUrl: result.data.imageUrl || data.imageUrl,
            siteName: result.data.siteName || data.siteName,
          })

          success('URL validated and metadata extracted successfully!')
        } else {
          warning(result.error || 'Could not extract metadata from this URL')
        }
      } else {
        error('Failed to validate URL')
      }
    } catch (error) {
      error('Failed to validate URL')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!data.url) {
      error('URL is required')
      return
    }

    post('/bookmarks', {
      onSuccess: () => {
        success('Bookmark created successfully!')
      },
      onError: (errors) => {
        error('Failed to create bookmark. Please check the form.')
      },
    })
  }

  const toggleLabel = (labelId: number) => {
    setData({
      ...data,
      labels: data.labels.includes(labelId)
        ? data.labels.filter(id => id !== labelId)
        : [...data.labels, labelId],
    })
  }

  return (
    <>
      <Head title="Create Bookmark" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/bookmarks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bookmarks
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Bookmark</h1>
            <p className="text-gray-600 mt-2">Save a new link with AI-powered features</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Bookmark Details
              </CardTitle>
              <CardDescription>
                Enter the URL and customize the bookmark details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* URL Input */}
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                    URL *
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com"
                      value={data.url}
                      onChange={(e) => setData('url', e.target.value)}
                      className={errors.url ? 'border-red-500' : ''}
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={validateUrl}
                      disabled={isLoading || !data.url}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {errors.url && (
                    <p className="text-red-500 text-sm mt-1">{errors.url}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">
                    Click the eye icon to extract metadata from the URL
                  </p>
                </div>

                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Enter bookmark title"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    placeholder="Enter bookmark description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    rows={3}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                {/* Image URL */}
                <div>
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <Input
                    id="imageUrl"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={data.imageUrl}
                    onChange={(e) => setData('imageUrl', e.target.value)}
                    className={errors.imageUrl ? 'border-red-500' : ''}
                  />
                  {errors.imageUrl && (
                    <p className="text-red-500 text-sm mt-1">{errors.imageUrl}</p>
                  )}
                </div>

                {/* Site Name */}
                <div>
                  <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name
                  </label>
                  <Input
                    id="siteName"
                    type="text"
                    placeholder="Enter site name"
                    value={data.siteName}
                    onChange={(e) => setData('siteName', e.target.value)}
                    className={errors.siteName ? 'border-red-500' : ''}
                  />
                  {errors.siteName && (
                    <p className="text-red-500 text-sm mt-1">{errors.siteName}</p>
                  )}
                </div>

                {/* Favorite Toggle */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFavorite"
                    checked={data.isFavorite}
                    onCheckedChange={(checked) => setData('isFavorite', checked as boolean)}
                  />
                  <label htmlFor="isFavorite" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Mark as favorite
                  </label>
                </div>

                {/* Labels */}
                {availableLabels.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Labels
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableLabels.map((label) => (
                        <button
                          key={label.id}
                          type="button"
                          onClick={() => toggleLabel(label.id)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            data.labels.includes(label.id)
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

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={processing || !data.url}
                    className="flex-1"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Bookmark'
                    )}
                  </Button>
                  <Link href="/bookmarks">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Preview */}
          <div className="space-y-6">
            {/* Open Graph Preview */}
            {showPreview && openGraphData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    URL Preview
                  </CardTitle>
                  <CardDescription>
                    How your bookmark will appear
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Preview Image */}
                    {openGraphData.imageUrl && (
                      <div className="aspect-video overflow-hidden rounded-lg">
                        <img
                          src={openGraphData.imageUrl}
                          alt={openGraphData.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Preview Content */}
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">
                        {openGraphData.title}
                      </h3>
                      {openGraphData.description && (
                        <p className="text-gray-600 text-sm mb-2 line-clamp-3">
                          {openGraphData.description}
                        </p>
                      )}
                      {openGraphData.siteName && (
                        <p className="text-gray-500 text-sm">{openGraphData.siteName}</p>
                      )}
                      <p className="text-blue-600 text-sm mt-2 break-all">
                        {openGraphData.url}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Features Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-blue-500" />
                  AI-Powered Features
                </CardTitle>
                <CardDescription>
                  Your bookmark will automatically get enhanced with AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">Smart Labels</p>
                      <p className="text-gray-600 text-sm">AI-generated tags based on content</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">TL;DR Summary</p>
                      <p className="text-gray-600 text-sm">AI-generated summaries for long articles</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">Content Analysis</p>
                      <p className="text-gray-600 text-sm">Automatic categorization and insights</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
