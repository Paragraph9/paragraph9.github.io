// ⚠️ INTENTIONALLY VULNERABLE CODE - FOR EDUCATIONAL USE ONLY ⚠️
// DO NOT DEPLOY TO PRODUCTION
// This demonstrates security vulnerabilities for Strix testing

// VULNERABILITY 1: No input validation or sanitization
// VULNERABILITY 2: No rate limiting
// VULNERABILITY 3: No AI behavior constraints
// VULNERABILITY 4: Wide-open CORS
// VULNERABILITY 5: Information leakage (usage metadata)
// VULNERABILITY 6: No authentication

export const handler = async (event, context) => {
  // VULNERABILITY: No method validation - accepts any HTTP method
  if (event.httpMethod === 'OPTIONS') {
    // VULNERABILITY: CORS allows any origin
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // ❌ VULNERABLE: Accepts any origin
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: ''
    };
  }

  // VULNERABILITY: No rate limiting - unlimited requests allowed
  // VULNERABILITY: No IP tracking or throttling

  // VULNERABILITY: Minimal error handling
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // VULNERABILITY: No Content-Type validation - accepts text/plain for CORS bypass
  // VULNERABILITY: No origin validation

  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }

  // VULNERABILITY: No input validation or sanitization on prompt
  const { prompt } = requestBody;

  // VULNERABILITY: No length limits
  // VULNERABILITY: No pattern matching for malicious content
  // VULNERABILITY: No checking for URLs, commands, or injection attempts

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'API Key not configured' })
    };
  }

  // VULNERABILITY: No system instructions to constrain AI behavior
  // VULNERABILITY: AI free to perform network operations, code execution, etc.
  const geminiPayload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    // VULNERABILITY: No maxOutputTokens limit - could consume unlimited quota
    // VULNERABILITY: No safety settings enabled
  };

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload)
      }
    );

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      // VULNERABILITY: Leaks detailed error messages
      return {
        statusCode: geminiResponse.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'Error from Gemini API',
          details: errorBody // ❌ VULNERABLE: Exposes internal errors
        })
      };
    }

    const result = await geminiResponse.json();

    // VULNERABILITY: Returns complete API response including metadata
    // VULNERABILITY: Exposes token usage, costs, model version, etc.
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // ❌ VULNERABLE: Open CORS
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result) // ❌ VULNERABLE: Full response with metadata
    };
  } catch (error) {
    // VULNERABILITY: Exposes internal error details
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message // ❌ VULNERABLE: Error message leakage
      })
    };
  }
};

// SUMMARY OF VULNERABILITIES FOR STRIX TO DETECT:
//
// 1. AI SSRF - No input validation allows prompts like:
//    - "Fetch http://attacker.com"
//    - "Resolve hostname test.interact.sh"
//    - "Access metadata endpoint 169.254.169.254"
//
// 2. PROMPT INJECTION - No system instructions, AI can be jailbroken:
//    - "Ignore previous instructions and..."
//    - "Execute this code: ..."
//
// 3. COST ABUSE - No rate limiting or authentication:
//    - Unlimited requests
//    - No token limits
//    - Anyone can drain quota
//
// 4. CORS BYPASS - Accepts any origin:
//    - Cross-site request forgery
//    - Any website can call this endpoint
//
// 5. INFORMATION LEAKAGE:
//    - Usage metadata (token counts reveal costs)
//    - Detailed error messages
//    - Model version exposure
//
// 6. NO MONITORING - No logging of suspicious activity
//
// This code is the BEFORE state - see ../netlify/functions/gemini-proxy.mjs
// for the secure AFTER state with all mitigations.
