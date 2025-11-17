// Secure Gemini API Proxy for Netlify Functions
// This function implements multiple security layers to prevent abuse

import { createHash } from 'crypto';

// In-memory rate limiting (consider Redis/KV for production multi-instance deployments)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per IP
const MAX_PROMPT_LENGTH = 500; // Maximum characters in prompt
const MAX_OUTPUT_TOKENS = 400; // Limit output tokens to control costs (increased for better responses)

// Allowed origins (configure based on your deployment)
const ALLOWED_ORIGINS = [
  'https://paragraph9.io',
  'https://www.paragraph9.io',
  // Add your development/staging URLs as needed
  // 'http://localhost:8888' // Uncomment for local testing
];

// Helper function to check rate limits
function checkRateLimit(identifier) {
  const now = Date.now();
  const userRequests = rateLimitStore.get(identifier) || [];

  // Remove expired entries
  const validRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (validRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  validRequests.push(now);
  rateLimitStore.set(identifier, validRequests);

  // Cleanup old entries periodically
  if (rateLimitStore.size > 10000) {
    const cutoff = now - RATE_LIMIT_WINDOW_MS;
    for (const [key, timestamps] of rateLimitStore.entries()) {
      if (timestamps.every(t => t < cutoff)) {
        rateLimitStore.delete(key);
      }
    }
  }

  return true;
}

// Helper function to validate origin
function validateOrigin(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

// Helper function to sanitize and validate prompt
function validatePrompt(prompt) {
  if (typeof prompt !== 'string') {
    return { valid: false, error: 'Prompt must be a string' };
  }

  if (prompt.length === 0) {
    return { valid: false, error: 'Prompt cannot be empty' };
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return { valid: false, error: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` };
  }

  return { valid: true };
}

// CORS headers helper
function getCorsHeaders(origin) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  };

  if (origin && validateOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Max-Age'] = '86400';
  }

  return headers;
}

export const handler = async (event, context) => {
  const origin = event.headers.origin || event.headers.Origin;

  // Handle OPTIONS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    if (!validateOrigin(origin)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Origin not allowed' })
      };
    }

    return {
      statusCode: 200,
      headers: getCorsHeaders(origin),
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: getCorsHeaders(origin),
      body: JSON.stringify({ error: 'Method not allowed. Only POST is supported.' })
    };
  }

  // Validate origin for POST requests
  if (!validateOrigin(origin)) {
    console.warn(`Blocked request from unauthorized origin: ${origin}`);
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Origin not allowed' })
    };
  }

  // Enforce Content-Type to prevent simple CORS bypass
  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
  if (!contentType.includes('application/json')) {
    return {
      statusCode: 400,
      headers: getCorsHeaders(origin),
      body: JSON.stringify({ error: 'Content-Type must be application/json' })
    };
  }

  // Rate limiting based on IP address
  const clientIp = event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   event.headers['client-ip'] ||
                   context.clientContext?.ip ||
                   'unknown';

  const rateLimitKey = createHash('sha256').update(clientIp).digest('hex').substring(0, 16);

  if (!checkRateLimit(rateLimitKey)) {
    console.warn(`Rate limit exceeded for IP hash: ${rateLimitKey}`);
    return {
      statusCode: 429,
      headers: getCorsHeaders(origin),
      body: JSON.stringify({
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
      })
    };
  }

  // Parse and validate request body
  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: getCorsHeaders(origin),
      body: JSON.stringify({ error: 'Invalid JSON in request body' })
    };
  }

  // Validate prompt
  const { prompt } = requestBody;
  const validation = validatePrompt(prompt);

  if (!validation.valid) {
    return {
      statusCode: 400,
      headers: getCorsHeaders(origin),
      body: JSON.stringify({ error: validation.error })
    };
  }

  // Check for API key in environment variables
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY environment variable is not set');
    return {
      statusCode: 500,
      headers: getCorsHeaders(origin),
      body: JSON.stringify({ error: 'Service configuration error' })
    };
  }

  // Prepare request to Gemini API with token limits
  const geminiPayload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.7,
    }
  };

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(geminiPayload)
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(`Gemini API error (${geminiResponse.status}):`, errorText);

      if (geminiResponse.status === 429) {
        return {
          statusCode: 429,
          headers: getCorsHeaders(origin),
          body: JSON.stringify({ error: 'API quota exceeded. Please try again later.' })
        };
      }

      return {
        statusCode: 502,
        headers: getCorsHeaders(origin),
        body: JSON.stringify({ error: 'Failed to process request with AI service' })
      };
    }

    const result = await geminiResponse.json();

    // Remove usage metadata to prevent cost leakage
    if (result.usageMetadata) {
      delete result.usageMetadata;
    }

    // Return sanitized response
    return {
      statusCode: 200,
      headers: getCorsHeaders(origin),
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(origin),
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
