import ogs from 'open-graph-scraper'

export interface OpenGraphData {
  title: string
  description: string | null
  imageUrl: string | null
  siteName: string | null
  url: string
  type: string | null
  locale: string | null
}

export default class OpenGraphService {
  /**
   * Extract Open Graph data from a URL
   */
  static async extractData(url: string): Promise<OpenGraphData> {
    try {
      console.log(`🔍 [OpenGraphService] Extracting Open Graph data from: ${url}`)
      
      const { result } = await ogs({
        url,
        timeout: 10000, // 10 second timeout
        retry: 2,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)',
        },
      })

      console.log(`📄 [OpenGraphService] Raw OGS result:`, {
        ogTitle: result.ogTitle,
        ogDescription: result.ogDescription,
        ogImage: result.ogImage,
        ogSiteName: result.ogSiteName,
        twitterTitle: result.twitterTitle,
        twitterDescription: result.twitterDescription,
        twitterImage: result.twitterImage,
        twitterSite: result.twitterSite,
        dcTitle: result.dcTitle,
        dcDescription: result.dcDescription,
        title: result.title,
        ogUrl: result.ogUrl,
        requestUrl: result.requestUrl,
        ogType: result.ogType,
        ogLocale: result.ogLocale,
      })

      const data = {
        title: result.ogTitle || result.twitterTitle || result.dcTitle || result.title || 'Untitled',
        description: result.ogDescription || result.twitterDescription || result.dcDescription || null,
        imageUrl: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null,
        siteName: result.ogSiteName || result.twitterSite || null,
        url: result.ogUrl || result.requestUrl || url,
        type: result.ogType || null,
        locale: result.ogLocale || null,
      }

      console.log(`✅ [OpenGraphService] Extracted data:`, data)
      return data
    } catch (error) {
      console.error('❌ [OpenGraphService] Error extracting Open Graph data:', error)
      
      // Return fallback data
      const fallbackData = {
        title: 'Untitled',
        description: null,
        imageUrl: null,
        siteName: null,
        url,
        type: null,
        locale: null,
      }
      
      console.log(`⚠️ [OpenGraphService] Returning fallback data:`, fallbackData)
      return fallbackData
    }
  }

  /**
   * Validate if a URL is accessible and returns valid Open Graph data
   */
  static async validateUrl(url: string): Promise<{ isValid: boolean; data?: OpenGraphData; error?: string }> {
    try {
      console.log(`🔍 [OpenGraphService] Validating URL: ${url}`)
      
      const data = await this.extractData(url)
      
      // Check if we got meaningful data
      if (data.title === 'Untitled' && !data.description && !data.imageUrl) {
        console.log(`❌ [OpenGraphService] No meaningful metadata found for URL: ${url}`)
        return {
          isValid: false,
          error: 'No meaningful metadata found for this URL',
        }
      }

      console.log(`✅ [OpenGraphService] URL validation successful for: ${url}`)
      return {
        isValid: true,
        data,
      }
    } catch (error) {
      console.error(`❌ [OpenGraphService] URL validation failed for ${url}:`, error)
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Failed to validate URL',
      }
    }
  }

  /**
   * Extract and clean text content for AI processing
   */
  static async extractTextContent(url: string): Promise<string> {
    try {
      console.log(`📝 [OpenGraphService] Extracting text content from: ${url}`)
      
      const { result } = await ogs({
        url,
        timeout: 15000,
        retry: 2,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)',
        },
      })

      // Combine various text fields for AI processing
      const textParts = [
        result.ogTitle,
        result.ogDescription,
        result.twitterTitle,
        result.twitterDescription,
        result.dcTitle,
        result.dcDescription,
        result.title,
      ].filter(Boolean)

      const combinedText = textParts.join('. ').substring(0, 2000) // Limit to 2000 chars for AI processing
      
      console.log(`✅ [OpenGraphService] Extracted text content (${combinedText.length} chars): ${combinedText.substring(0, 150)}...`)
      return combinedText
    } catch (error) {
      console.error('❌ [OpenGraphService] Error extracting text content:', error)
      return ''
    }
  }
}
