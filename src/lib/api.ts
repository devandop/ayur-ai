/**
 * Frontend API Client for Video Service
 * All client-side API calls go through this module
 */

const MOTIA_API_URL = process.env.NEXT_PUBLIC_MOTIA_API_URL || 'http://localhost:4001'

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>
}

/**
 * Helper function to get Clerk headers for authentication
 */
async function getClerkHeaders(): Promise<Record<string, string>> {
  // In client components, we get the token from Clerk's useAuth hook
  // This is called from within functions that already have the token
  return {
    'Content-Type': 'application/json',
  }
}

/**
 * Fetch wrapper for API calls with error handling
 */
async function apiFetch(
  endpoint: string,
  options: FetchOptions = {},
  clerkHeaders?: Record<string, string>
) {
  const url = `${MOTIA_API_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(await getClerkHeaders()),
      ...(clerkHeaders || {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `API error: ${response.status}`)
  }

  return response.json()
}

/**
 * Video API Client
 */
export const videoApi = {
  /**
   * List all published videos with user watch progress
   */
  async listVideos(clerkHeaders: Record<string, string>) {
    return apiFetch('/api/videos', { method: 'GET' }, clerkHeaders)
  },

  /**
   * Get single video by ID with playback URL and watch progress
   */
  async getVideo(id: string, clerkHeaders: Record<string, string>) {
    return apiFetch(`/api/videos/${id}`, { method: 'GET' }, clerkHeaders)
  },

  /**
   * Update video watch progress
   */
  async updateProgress(
    id: string,
    position: number,
    duration: number,
    clerkHeaders: Record<string, string>
  ) {
    return apiFetch(
      `/api/videos/${id}/progress`,
      {
        method: 'POST',
        body: JSON.stringify({ position, duration }),
      },
      clerkHeaders
    )
  },
}

/**
 * Admin Video API Client
 */
export const adminVideoApi = {
  /**
   * List all videos (admin only)
   */
  async listVideos(clerkHeaders: Record<string, string>) {
    return apiFetch('/api/admin/videos', { method: 'GET' }, clerkHeaders)
  },

  /**
   * Add a new video (admin only)
   */
  async addVideo(
    data: {
      title: string
      muxPlaybackId: string
      description?: string
      instructor?: string
    },
    clerkHeaders: Record<string, string>
  ) {
    return apiFetch(
      '/api/admin/videos',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      clerkHeaders
    )
  },

  /**
   * Update video metadata (admin only)
   */
  async updateVideo(
    id: string,
    data: {
      title?: string
      description?: string
      instructor?: string
      isPublished?: boolean
    },
    clerkHeaders: Record<string, string>
  ) {
    return apiFetch(
      `/api/admin/videos/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      clerkHeaders
    )
  },

  /**
   * Delete video (admin only)
   */
  async deleteVideo(id: string, clerkHeaders: Record<string, string>) {
    return apiFetch(
      `/api/admin/videos/${id}`,
      { method: 'DELETE' },
      clerkHeaders
    )
  },

  /**
   * Get overall video analytics (admin only)
   */
  async getAnalytics(clerkHeaders: Record<string, string>) {
    return apiFetch(
      '/api/admin/analytics/videos',
      { method: 'GET' },
      clerkHeaders
    )
  },

  /**
   * Get detailed analytics for a specific video (admin only)
   */
  async getVideoAnalytics(
    id: string,
    clerkHeaders: Record<string, string>
  ) {
    return apiFetch(
      `/api/admin/analytics/videos/${id}`,
      { method: 'GET' },
      clerkHeaders
    )
  },
}

/**
 * Mux Upload API Client (for direct uploads)
 */
export const muxUploadApi = {
  /**
   * Create an upload session for Mux
   */
  async createUploadSession(clerkHeaders: Record<string, string>) {
    return apiFetch(
      '/api/admin/videos/upload',
      { method: 'POST' },
      clerkHeaders
    )
  },

  /**
   * Poll upload status and get playback ID when ready
   */
  async getUploadStatus(
    uploadId: string,
    clerkHeaders: Record<string, string>
  ) {
    return apiFetch(
      `/api/admin/videos/upload/${uploadId}/status`,
      { method: 'GET' },
      clerkHeaders
    )
  },
}
