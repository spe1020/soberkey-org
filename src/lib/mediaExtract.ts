// Extract media URLs from Nostr event content

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  alt?: string;
}

/**
 * Extract media URLs from note content
 * Supports common image and video URL patterns
 */
export function extractMediaFromContent(content: string): MediaItem[] {
  const media: MediaItem[] = [];
  
  // Common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)(\?.*)?$/i;
  
  // Common video extensions  
  const videoExtensions = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)(\?.*)?$/i;
  
  // URL pattern that captures most HTTP/HTTPS URLs
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  
  const urls = content.match(urlPattern) || [];
  
  for (const url of urls) {
    try {
      // Clean URL by removing any trailing punctuation
      const cleanUrl = url.replace(/[.,;:!?]+$/, '');
      
      if (imageExtensions.test(cleanUrl)) {
        media.push({
          type: 'image',
          url: cleanUrl,
          alt: `Image from ${new URL(cleanUrl).hostname}`
        });
      } else if (videoExtensions.test(cleanUrl)) {
        media.push({
          type: 'video',
          url: cleanUrl,
          alt: `Video from ${new URL(cleanUrl).hostname}`
        });
      }
    } catch (error) {
      // Skip invalid URLs
      console.warn('Invalid URL found in content:', url);
    }
  }
  
  return media;
}

/**
 * Clean content by removing media URLs
 */
export function cleanContent(content: string, mediaUrls: string[]): string {
  let cleanContent = content;
  mediaUrls.forEach(url => {
    cleanContent = cleanContent.replace(url, '').trim();
  });
  return cleanContent;
}

