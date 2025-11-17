# Deployment Guide

## Quick Start

This guide walks you through deploying the secure Gemini API proxy to Netlify.

## Prerequisites

1. Netlify account (sign up at https://netlify.com)
2. Google Gemini API key (get one at https://makersuite.google.com/app/apikey)
3. Git repository connected to Netlify (or Netlify CLI installed)

## Step-by-Step Deployment

### 1. Configure Environment Variables

**In Netlify Dashboard:**

1. Go to https://app.netlify.com
2. Select your site (paragraph9.io)
3. Navigate to **Site Settings > Environment Variables**
4. Click **Add a variable**
5. Add:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** Your Gemini API key (from Google AI Studio)
   - **Scopes:** Production, Deploy Previews, Branch deploys (or All scopes)
6. Click **Create variable**

**Using Netlify CLI (alternative):**

```batch
netlify env:set GEMINI_API_KEY "your-api-key-here"
```

### 2. Review Allowed Origins

Edit `netlify/functions/gemini-proxy.mjs` and verify the allowed origins match your domains:

```javascript
const ALLOWED_ORIGINS = [
  'https://paragraph9.io',
  'https://www.paragraph9.io',
];
```

For local testing, you can temporarily add:
```javascript
  'http://localhost:8888'  // Remove before production deploy
```

### 3. Deploy to Netlify

**Option A: Git Push (Recommended)**

```batch
git add .
git commit -m "Deploy secure Gemini API proxy"
git push origin main
```

Netlify will automatically build and deploy.

**Option B: Netlify CLI**

```batch
netlify build
netlify deploy --prod
```

**Option C: Manual Deploy via Dashboard**

1. Drag and drop your project folder to Netlify Dashboard
2. Or use the "Deploy manually" option

### 4. Verify Deployment

After deployment completes:

1. Check the deploy log for errors
2. Visit your site: https://paragraph9.io
3. Test the proxy endpoint is working

### 5. Security Testing

Run these tests to verify security controls:

**Test 1: Unauthorized Origin (should fail)**
```batch
curl -X POST https://paragraph9.io/.netlify/functions/gemini-proxy ^
  -H "Origin: https://unauthorized-site.com" ^
  -H "Content-Type: application/json" ^
  -d "{\"prompt\":\"test\"}"
```
Expected: `{"error":"Origin not allowed"}` with status 403

**Test 2: Valid Request (should succeed)**
```batch
curl -X POST https://paragraph9.io/.netlify/functions/gemini-proxy ^
  -H "Origin: https://paragraph9.io" ^
  -H "Content-Type: application/json" ^
  -d "{\"prompt\":\"Explain cloud computing in one sentence.\"}"
```
Expected: JSON response with candidates array

**Test 3: Rate Limiting (should throttle)**
Run this command 15 times rapidly:
```batch
for /L %%i in (1,1,15) do curl -s -o nul -w "%%{http_code}\n" ^
  -X POST https://paragraph9.io/.netlify/functions/gemini-proxy ^
  -H "Origin: https://paragraph9.io" ^
  -H "Content-Type: application/json" ^
  -d "{\"prompt\":\"test\"}"
```
Expected: First 10 requests return 200, subsequent requests return 429

**Test 4: Wrong Content-Type (should fail)**
```batch
curl -X POST https://paragraph9.io/.netlify/functions/gemini-proxy ^
  -H "Origin: https://paragraph9.io" ^
  -H "Content-Type: text/plain" ^
  -d "{\"prompt\":\"test\"}"
```
Expected: `{"error":"Content-Type must be application/json"}` with status 400

### 6. Monitor Function Performance

**Via Netlify Dashboard:**
1. Go to **Functions** tab
2. Select `gemini-proxy`
3. Monitor invocations, errors, and duration

**Set up alerts:**
1. Netlify Analytics for traffic patterns
2. Google Cloud Console for API quota alerts

## Local Development & Testing

### Setup Local Environment

1. Install Netlify CLI:
```batch
npm install -g netlify-cli
```

2. Create a local `.env` file (don't commit this):
```batch
GEMINI_API_KEY=your-api-key-here
```

3. Run Netlify Dev:
```batch
netlify dev
```

4. Access locally at: http://localhost:8888

### Test Locally

Update the ALLOWED_ORIGINS in `gemini-proxy.mjs` to include localhost:
```javascript
const ALLOWED_ORIGINS = [
  'https://paragraph9.io',
  'https://www.paragraph9.io',
  'http://localhost:8888'  // For local testing only
];
```

Remember to remove localhost before deploying to production.

## Troubleshooting

### Function Returns 500 Error

**Cause:** GEMINI_API_KEY not set
**Fix:** Verify environment variable in Netlify Dashboard

### CORS Errors in Browser

**Cause:** Origin not in ALLOWED_ORIGINS list
**Fix:** Add your domain to the whitelist in gemini-proxy.mjs

### Rate Limit Too Strict

**Cause:** Default is 10 requests/minute
**Fix:** Adjust these constants in gemini-proxy.mjs:
```javascript
const MAX_REQUESTS_PER_WINDOW = 20; // Increase limit
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // Or extend window
```

### High API Costs

**Cause:** Token limits may be too high
**Fix:** Reduce limits in gemini-proxy.mjs:
```javascript
const MAX_PROMPT_LENGTH = 300; // Reduce from 500
const MAX_OUTPUT_TOKENS = 100; // Reduce from 200
```

### Function Timeout

**Cause:** Gemini API slow response
**Fix:** Add timeout to fetch in gemini-proxy.mjs or increase Netlify function timeout

## Rollback Procedure

If you need to rollback:

```batch
netlify rollback
```

Or via Dashboard:
1. Go to **Deploys**
2. Find previous working deploy
3. Click **Publish deploy**

## Security Checklist Before Going Live

- [ ] GEMINI_API_KEY set in Netlify environment variables
- [ ] ALLOWED_ORIGINS contains only your production domains
- [ ] No localhost entries in ALLOWED_ORIGINS for production
- [ ] .env file is in .gitignore (never committed)
- [ ] Rate limits are appropriate for your use case
- [ ] Google Cloud budget alerts configured
- [ ] Netlify Analytics enabled for monitoring
- [ ] Security headers verified in browser DevTools
- [ ] All security tests pass (see Step 5)

## Maintenance

### Regular Tasks

**Weekly:**
- Review Netlify function logs for anomalies
- Check API usage in Google Cloud Console

**Monthly:**
- Review rate limit settings
- Audit allowed origins list
- Check for Netlify/Node.js updates
- Review security documentation updates

**Quarterly:**
- Rotate API keys
- Security audit
- Review and update CSP headers

## Support & Resources

- Netlify Functions Docs: https://docs.netlify.com/functions/overview/
- Google Gemini API Docs: https://ai.google.dev/docs
- Security Report: See SECURITY.md
- Issues: https://github.com/anthropics/claude-code/issues

## Next Steps

After successful deployment:

1. Monitor for 24-48 hours
2. Review function invocation patterns
3. Adjust rate limits if needed
4. Set up long-term monitoring
5. Consider implementing user authentication for additional security

**Deployment Complete!** Your secure Gemini API proxy is now live.
