/**
 * Shared utilities and middlewares for API steps
 * This file is imported by API steps and will be compiled along with them
 */

import { ApiMiddleware, ApiRouteConfig } from 'motia'
import { PrismaClient } from '@prisma/client'
import { Mux } from '@mux/mux-node'

// Configure PrismaClient with connection pooling limits
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})

// Ensure proper cleanup on shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

/**
 * Get formatted memory usage
 */
const getMemoryUsage = () => {
  const usage = process.memoryUsage()
  return {
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    external: `${Math.round(usage.external / 1024 / 1024)}MB`,
  }
}

/**
 * Memory Logging Middleware
 * Logs memory usage before and after each request
 */
export const memoryLoggerMiddleware: ApiMiddleware = async (req, ctx, next) => {
  const { logger } = ctx
  const startMemory = process.memoryUsage().heapUsed

  logger.info('Request started', {
    path: req.pathParams,
    memory: getMemoryUsage(),
  })

  const result = await next()

  const endMemory = process.memoryUsage().heapUsed
  const memoryDelta = Math.round((endMemory - startMemory) / 1024 / 1024)

  logger.info('Request completed', {
    memoryDelta: `${memoryDelta}MB`,
    memory: getMemoryUsage(),
  })

  return result
}

/**
 * Error Handler Middleware
 * Catches all errors and formats them properly
 */
export const errorHandlerMiddleware: ApiMiddleware = async (req, ctx, next) => {
  const { logger } = ctx

  try {
    return await next()
  } catch (error: any) {
    logger.error('Error while processing request', {
      error: error.message,
      stack: error.stack,
    })

    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return {
        status: 400,
        body: {
          error: 'Validation error',
          details: error.errors,
        },
      }
    }

    return {
      status: 500,
      body: { error: error.message || 'Internal Server Error' },
    }
  }
}

/**
 * Clerk Authentication Middleware
 * Extracts userId from Clerk headers, fetches user from DB (or creates if not exists), and attaches to context
 */
export const clerkAuthMiddleware: ApiMiddleware = async (req, ctx, next) => {
  const { logger } = ctx

  try {
    // Extract Clerk userId from headers
    const clerkUserId = req.headers['x-clerk-user-id'] as string

    if (!clerkUserId) {
      logger.warn('No Clerk user ID found in headers')
      return {
        status: 401,
        body: { error: 'Unauthorized - No authentication token provided' },
      }
    }

    // Extract email from headers if available (Clerk sends this)
    const email = req.headers['x-clerk-user-email'] as string || `user-${clerkUserId}@clerk.local`
    const firstName = req.headers['x-clerk-user-first-name'] as string || null
    const lastName = req.headers['x-clerk-user-last-name'] as string || null

    // Use upsert to create or update user atomically
    // This prevents race conditions and handles both new and existing users
    const user = await prisma.user.upsert({
      where: { clerkId: clerkUserId },
      update: {
        // Update email, firstName, lastName if they changed in Clerk
        email,
        firstName,
        lastName,
      },
      create: {
        clerkId: clerkUserId,
        email,
        firstName,
        lastName,
      },
    })

    // Attach user to context for use in handlers
    ;(ctx as any).user = user

    logger.info('User authenticated successfully', { userId: user.id, email: user.email })

    return await next()
  } catch (error: any) {
    logger.error('Authentication error', { error: error.message, stack: error.stack })
    return {
      status: 500,
      body: { error: 'Internal authentication error' },
    }
  }
}

/**
 * Admin Authorization Middleware
 * Verifies that the authenticated user is an admin
 */
export const adminAuthMiddleware: ApiMiddleware = async (req, ctx, next) => {
  const { logger } = ctx
  const user = (ctx as any).user

  if (!user) {
    logger.warn('Admin auth middleware called without authenticated user')
    return {
      status: 401,
      body: { error: 'Unauthorized - Authentication required' },
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    logger.error('ADMIN_EMAIL environment variable not set')
    return {
      status: 500,
      body: { error: 'Server configuration error' },
    }
  }

  if (user.email !== adminEmail) {
    logger.warn('Non-admin user attempted to access admin endpoint', {
      userId: user.id,
      userEmail: user.email,
    })
    return {
      status: 403,
      body: { error: 'Forbidden - Admin access required' },
    }
  }

  logger.info('Admin access granted', { userId: user.id })

  return await next()
}

/**
 * Shared Prisma client for API steps
 */
export { prisma }

// ============================================
// Rate Limiting Middleware
// ============================================

interface RateLimitConfig {
  maxRequests: number
  windowSeconds: number
  keyExtractor?: (req: any, ctx: any) => string
  errorMessage?: string
}

const createRateLimiter = (config: RateLimitConfig): ApiMiddleware => {
  const {
    maxRequests,
    windowSeconds,
    keyExtractor,
    errorMessage = `Too many requests. Maximum ${config.maxRequests} requests per ${config.windowSeconds} seconds allowed.`,
  } = config

  return async (req, ctx, next) => {
    const { state, logger } = ctx

    let clientId: string
    if (keyExtractor) {
      clientId = keyExtractor(req, ctx)
    } else {
      const user = (ctx as any).user
      const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
      clientId = user?.id || `ip:${ip}`
    }

    const rateLimitKey = `ratelimit:${req.path}:${clientId}`
    const now = Date.now()

    try {
      const rateLimitData = (await state.get(rateLimitKey)) as { count: number; resetTime: number } | null

      if (!rateLimitData) {
        await state.set(rateLimitKey, { count: 1, resetTime: now + windowSeconds * 1000 }, { ttl: windowSeconds })
        return await next()
      }

      if (now >= rateLimitData.resetTime) {
        await state.set(rateLimitKey, { count: 1, resetTime: now + windowSeconds * 1000 }, { ttl: windowSeconds })
        return await next()
      }

      if (rateLimitData.count >= maxRequests) {
        const retryAfter = Math.ceil((rateLimitData.resetTime - now) / 1000)
        logger.warn('Rate limit exceeded', { clientId, path: req.path, count: rateLimitData.count, maxRequests })
        return {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitData.resetTime).toISOString(),
          },
          body: { error: errorMessage, retryAfter },
        }
      }

      const newCount = rateLimitData.count + 1
      await state.set(rateLimitKey, { count: newCount, resetTime: rateLimitData.resetTime }, { ttl: Math.ceil((rateLimitData.resetTime - now) / 1000) })

      const result = await next()
      return {
        ...result,
        headers: {
          ...result.headers,
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': (maxRequests - newCount).toString(),
          'X-RateLimit-Reset': new Date(rateLimitData.resetTime).toISOString(),
        },
      }
    } catch (error: any) {
      logger.error('Rate limiting error', { error: error.message, clientId })
      return await next()
    }
  }
}

export const RateLimiters = {
  strict: createRateLimiter({ maxRequests: 5, windowSeconds: 900, errorMessage: 'Too many attempts. Please try again in 15 minutes.' }),
  moderate: createRateLimiter({ maxRequests: 30, windowSeconds: 60 }),
  lenient: createRateLimiter({ maxRequests: 100, windowSeconds: 60 }),
  perIP: createRateLimiter({
    maxRequests: 20,
    windowSeconds: 60,
    keyExtractor: (req) => `ip:${req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'}`,
  }),
  custom: createRateLimiter,
}

// ============================================
// Sanitization Middleware
// ============================================

const htmlEntities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' }

const sanitizeHTML = (str: string): string => (typeof str !== 'string' ? str : str.replace(/[&<>"'\/]/g, (char) => htmlEntities[char] || char))
const stripHTML = (str: string): string => (typeof str !== 'string' ? str : str.replace(/<[^>]*>/g, ''))
const removeControlCharacters = (str: string): string => (typeof str !== 'string' ? str : str.replace(/[\x00-\x1F\x7F]/g, ''))
const trimAndLimit = (str: string, maxLength: number = 1000): string => (typeof str !== 'string' ? str : str.trim().slice(0, maxLength))

const sanitizeString = (str: string, options: { stripHTML?: boolean; maxLength?: number } = {}): string => {
  if (typeof str !== 'string') return str
  let sanitized = removeControlCharacters(str)
  sanitized = trimAndLimit(sanitized, options.maxLength || 1000)
  sanitized = options.stripHTML ? stripHTML(sanitized) : sanitizeHTML(sanitized)
  return sanitized
}

const sanitizeObject = (obj: any, options: { stripHTML?: boolean; maxLength?: number; fieldsToStrip?: string[] } = {}): any => {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'string') return sanitizeString(obj, options)
  if (Array.isArray(obj)) return obj.map((item) => sanitizeObject(item, options))
  if (typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        const shouldStrip = options.fieldsToStrip?.includes(key)
        sanitized[key] = sanitizeString(value, { ...options, stripHTML: shouldStrip || options.stripHTML })
      } else {
        sanitized[key] = sanitizeObject(value, options)
      }
    }
    return sanitized
  }
  return obj
}

export const sanitizationMiddleware = (options: { stripHTML?: boolean; maxLength?: number; fieldsToStrip?: string[] } = {}): ApiMiddleware => {
  return async (req, ctx, next) => {
    const { logger } = ctx
    try {
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body, options)
      }
      if (req.query && typeof req.query === 'object') {
        for (const [key, value] of Object.entries(req.query)) {
          if (typeof value === 'string') {
            req.query[key] = sanitizeString(value, options)
          }
        }
      }
      return await next()
    } catch (error: any) {
      logger.error('Sanitization error', { error: error.message, path: req.path })
      return { status: 400, body: { error: 'Invalid input detected' } }
    }
  }
}

export const SanitizationPresets = {
  strict: sanitizationMiddleware({ stripHTML: true, maxLength: 1000 }),
  moderate: sanitizationMiddleware({ stripHTML: false, maxLength: 5000 }),
  medicalNotes: sanitizationMiddleware({ stripHTML: true, maxLength: 10000, fieldsToStrip: ['notes', 'reason', 'bio'] }),
}

// ============================================
// Mux Video Service
// ============================================

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
})

interface CreateUploadResponse {
  uploadId: string
  url: string
}

interface PollUploadStatusResponse {
  status: 'waiting' | 'processing' | 'ready' | 'errored'
  assetId?: string
  playbackId?: string
  duration?: number
  error?: string
}

export async function createUploadSession(): Promise<CreateUploadResponse> {
  try {
    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
      },
    })
    return { uploadId: upload.id, url: upload.url }
  } catch (error) {
    console.error('Error creating upload session:', error)
    throw new Error('Failed to create upload session')
  }
}

export async function getUploadStatus(uploadId: string): Promise<PollUploadStatusResponse> {
  try {
    const upload = await mux.video.uploads.retrieve(uploadId)
    if (!upload) throw new Error('Upload not found')
    if (upload.status === 'waiting') return { status: 'waiting' }
    if (upload.status === 'preparing' || upload.status === 'processing') return { status: 'processing' }
    if (upload.status === 'ready' && upload.asset_id) {
      const asset = await mux.video.assets.retrieve(upload.asset_id)
      if (asset.playback_ids && asset.playback_ids.length > 0) {
        return { status: 'ready', assetId: asset.id, playbackId: asset.playback_ids[0].id, duration: asset.duration }
      }
    }
    if (upload.status === 'errored') {
      return { status: 'errored', error: upload.error?.messages?.join(', ') || 'Upload failed' }
    }
    return { status: 'processing' }
  } catch (error) {
    console.error('Error getting upload status:', error)
    throw new Error('Failed to get upload status')
  }
}

export async function getAssetDetails(assetId: string) {
  try {
    const asset = await mux.video.assets.retrieve(assetId)
    if (!asset) throw new Error('Asset not found')
    return {
      id: asset.id,
      playbackId: asset.playback_ids?.[0]?.id,
      duration: asset.duration,
      thumbnailUrl: `https://image.mux.com/${asset.playback_ids?.[0]?.id}/thumbnail.jpg`,
      status: asset.status,
    }
  } catch (error) {
    console.error('Error getting asset details:', error)
    throw new Error('Failed to get asset details')
  }
}

// Dummy config to satisfy Motia's requirement that all .step.ts files have a config
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'SharedUtilities',
  description: 'Shared utilities - not a real endpoint',
  path: '/__internal/shared',
  method: 'GET',
  emits: [],
  flows: [],
  middleware: [],
}

// Dummy handler (never actually called)
export const handler = async () => ({ status: 404, body: { error: 'Not found' } })
