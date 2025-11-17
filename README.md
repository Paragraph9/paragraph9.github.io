# AI-Innovation: Innovation & Adoption Rate Comparison

An interactive visualization comparing the innovation and adoption rates of Cloud Computing, AI, and Social Media technologies from 1995 to 2027.

## Features

- Interactive Chart.js visualization
- Click-to-explain functionality powered by Google Gemini AI
- Responsive design with Tailwind CSS
- Secure API proxy implementation

## Security

This project implements a secure serverless proxy for the Gemini API with the following protections:

- Origin validation and CORS protection
- Rate limiting (10 requests/minute per IP)
- Input validation and sanitization
- Content-Type enforcement
- Cost controls (max output tokens)
- Security headers (HSTS, CSP, etc.)

See [SECURITY.md](SECURITY.md) for the complete security audit and remediation details.

## Deployment

This site is deployed on Netlify with serverless functions.

**Quick Deploy:**
1. Set `GEMINI_API_KEY` environment variable in Netlify Dashboard
2. Push to main branch - auto-deploys via Netlify

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Project Structure

```
AI-Innovation/
├── innovationgraph.html         # Main visualization page
├── netlify/
│   └── functions/
│       └── gemini-proxy.mjs     # Secure API proxy function
├── netlify.toml                 # Netlify configuration
├── .env.example                 # Environment variable template
├── .gitignore                   # Git ignore rules
├── SECURITY.md                  # Security documentation
├── DEPLOYMENT.md                # Deployment guide
└── README.md                    # This file
```

## Local Development

1. Install Netlify CLI:
```batch
npm install -g netlify-cli
```

2. Create `.env` file:
```
GEMINI_API_KEY=your-api-key-here
```

3. Run locally:
```batch
netlify dev
```

4. Access at: http://localhost:8888

## Environment Variables

Required environment variables:

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `GEMINI_API_KEY` | Google Gemini API key | [Google AI Studio](https://makersuite.google.com/app/apikey) |

## API Endpoints

### POST /.netlify/functions/gemini-proxy

Secure proxy for Gemini API requests.

**Request:**
```json
{
  "prompt": "Your question here"
}
```

**Response:**
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "AI-generated response"
          }
        ]
      }
    }
  ]
}
```

**Rate Limits:**
- 10 requests per minute per IP
- Max prompt length: 500 characters
- Max output tokens: 200

## Security Features

- **Authentication:** Origin-based validation
- **Authorization:** Whitelist of allowed domains
- **Rate Limiting:** IP-based throttling
- **Input Validation:** Prompt length and type checking
- **Cost Controls:** Token output limits
- **CORS Protection:** Preflight enforcement
- **Security Headers:** CSP, HSTS, X-Frame-Options, etc.

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Technologies Used

- **Frontend:** HTML5, Tailwind CSS, Chart.js
- **Backend:** Netlify Functions (Node.js 18)
- **AI:** Google Gemini 2.5 Flash
- **Deployment:** Netlify
- **Security:** CORS, rate limiting, CSP

## License

See [LICENSE](LICENSE) file for details.

## Support

For issues or questions:
- Review [SECURITY.md](SECURITY.md) for security-related issues
- Review [DEPLOYMENT.md](DEPLOYMENT.md) for deployment issues
- Check Netlify function logs for runtime errors
- Review Google Cloud Console for API quota issues

## Changelog

### 2025-11-16 - Security Hardening
- Implemented secure API proxy with origin validation
- Added rate limiting (10 req/min per IP)
- Added input validation and cost controls
- Removed usage metadata from responses
- Added comprehensive security headers
- Created security and deployment documentation

### 2024-08-23 - Initial Release
- Interactive innovation rate visualization
- AI-powered explanations via Gemini API
- Responsive chart design

## Credits

Created with the help of Google Gemini Flash 2.5 and Claude Code.

## Maintenance

See [SECURITY.md](SECURITY.md) for recommended maintenance schedule:
- Weekly: Review logs and API usage
- Monthly: Audit security settings
- Quarterly: Rotate API keys and security audit
