import { NextResponse } from 'next/server'

// Get the backend API URL from environment
const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/**
 * API Proxy Route - Forwards all requests to Cloudflare Workers backend
 *
 * This enables same-origin authentication with cookies by proxying requests.
 * From the browser's perspective, API calls go to postscholar.org/api/*
 * which then forwards to the Workers backend at ummaraali.workers.dev
 *
 * Benefits:
 * - Cookies work (same-origin from browser perspective)
 * - No CORS issues
 * - Simplified auth flow
 */

async function handler(request, { params }) {
  try {
    console.log('[API Proxy] Request:', request.method, request.url)
    console.log('[API Proxy] BACKEND_URL:', BACKEND_URL)

    // Extract path segments from catch-all route
    const path = params.path ? params.path.join('/') : ''

    // Build the backend URL
    const backendUrl = `${BACKEND_URL}/${path}`
    console.log('[API Proxy] Forwarding to:', backendUrl)

    // Get search params from original request
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    const fullUrl = queryString ? `${backendUrl}?${queryString}` : backendUrl

    // Prepare headers to forward (exclude host-specific headers)
    const headers = new Headers()
    request.headers.forEach((value, key) => {
      // Skip headers that should not be forwarded
      if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
        headers.set(key, value)
      }
    })

    // Get request body if present
    let body = null
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.text()
    }

    // Forward request to backend
    const backendResponse = await fetch(fullUrl, {
      method: request.method,
      headers,
      body,
      // Include credentials for cookie forwarding
      credentials: 'include',
    })

    // Get response body
    const responseBody = await backendResponse.text()

    // Create response with same status and headers
    const response = new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
    })

    // Handle Set-Cookie headers - parse and re-set for frontend domain
    const setCookieHeader = backendResponse.headers.get('set-cookie')
    if (setCookieHeader) {
      console.log('[API Proxy] Backend Set-Cookie:', setCookieHeader)

      // Parse cookie: "name=value; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800"
      const cookieParts = setCookieHeader.split(';').map(p => p.trim())
      const [nameValue] = cookieParts
      const [name, value] = nameValue.split('=')

      // Extract cookie attributes
      const options = {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      }

      cookieParts.slice(1).forEach(part => {
        const lower = part.toLowerCase()
        if (lower === 'httponly') options.httpOnly = true
        else if (lower === 'secure') options.secure = true
        else if (lower.startsWith('samesite=')) {
          options.sameSite = part.split('=')[1].toLowerCase()
        } else if (lower.startsWith('path=')) {
          options.path = part.split('=')[1]
        } else if (lower.startsWith('max-age=')) {
          options.maxAge = parseInt(part.split('=')[1])
        } else if (lower.startsWith('domain=')) {
          // Skip domain from backend, let browser use current domain
        }
      })

      // Set cookie on response using NextResponse.cookies API
      // Domain is automatically set to the current request domain (postscholar.org)
      response.cookies.set(name, value, options)
      console.log('[API Proxy] Set cookie:', name, 'with options:', options)
    }

    // Forward other response headers (exclude set-cookie since we handled it)
    backendResponse.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding', 'set-cookie'].includes(key.toLowerCase())) {
        response.headers.set(key, value)
      }
    })

    console.log('[API Proxy] Response status:', backendResponse.status)
    return response
  } catch (error) {
    console.error('[API Proxy] ERROR:', error)
    console.error('[API Proxy] Error details:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    })
    return NextResponse.json(
      { error: 'Failed to proxy request to backend', details: error.message },
      { status: 502 }
    )
  }
}

// Export handlers for all HTTP methods
export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
export const PATCH = handler
export const OPTIONS = handler
export const HEAD = handler

// Disable static optimization for this route
export const dynamic = 'force-dynamic'