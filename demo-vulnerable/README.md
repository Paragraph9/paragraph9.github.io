# Vulnerable AI Proxy Demo - FOR EDUCATIONAL USE ONLY

⚠️ **CRITICAL WARNING** ⚠️

This directory contains **INTENTIONALLY VULNERABLE** code for security testing and demonstration purposes.

## ⛔ DO NOT DEPLOY TO PRODUCTION

- ❌ DO NOT deploy to paragraph9.io
- ❌ DO NOT use with real API keys
- ❌ DO NOT expose to the public internet
- ✅ ONLY use in isolated testing environments
- ✅ ONLY use for Strix demonstrations
- ✅ ONLY use for security training

## Purpose

This vulnerable version demonstrates:
1. **SSRF via AI Model**: No input validation allows AI to fetch URLs
2. **Prompt Injection**: No system instructions to constrain AI behavior
3. **Cost Abuse**: No rate limiting or authentication
4. **Information Leakage**: Returns full API responses including metadata

## Files

- `vulnerable-proxy.mjs` - Intentionally insecure serverless function
- `demo-page.html` - Simple test interface
- `strix-test-guide.md` - Instructions for testing with Strix

## Setup (Local Testing Only)

### 1. Create Test Environment

```bash
# Use a separate Netlify site for testing
netlify init --manual
```

### 2. Configure Test API Key

Create `.env` with a **LOW-QUOTA TEST KEY**:
```
GEMINI_API_KEY=your-test-key-with-low-quota
```

⚠️ **Use a restricted API key with:**
- Low daily quota (e.g., $1/day limit)
- No production access
- Easy to revoke

### 3. Deploy to Test Site

```bash
# Deploy to isolated test environment
netlify deploy --dir=demo-vulnerable --functions=demo-vulnerable
```

### 4. Run Strix Tests

See `strix-test-guide.md` for detailed testing instructions.

## Security Lessons Demonstrated

### Vulnerability 1: No Input Validation
```javascript
// VULNERABLE - No validation
const { prompt } = JSON.parse(event.body);
// Directly sends to AI without checking for malicious content
```

### Vulnerability 2: No AI Constraints
```javascript
// VULNERABLE - No system instructions
const geminiPayload = {
  contents: [{ role: "user", parts: [{ text: prompt }] }]
  // Missing systemInstruction to constrain AI behavior
};
```

### Vulnerability 3: No Rate Limiting
```javascript
// VULNERABLE - Anyone can spam requests
// No IP-based throttling
// No authentication required
```

### Vulnerability 4: Information Leakage
```javascript
// VULNERABLE - Returns everything
return {
  statusCode: 200,
  body: JSON.stringify(result) // Includes usageMetadata, costs, etc.
};
```

## Comparison: Vulnerable vs Secure

| Feature | Vulnerable Version | Secure Version |
|---------|-------------------|----------------|
| Input Validation | ❌ None | ✅ Regex patterns block malicious input |
| AI Constraints | ❌ None | ✅ System instructions forbid network ops |
| Rate Limiting | ❌ None | ✅ 10 req/min per IP |
| CORS | ❌ Wide open | ✅ Origin whitelist |
| Metadata | ❌ Exposed | ✅ Stripped from responses |
| Content-Type | ❌ Accepts text/plain | ✅ Requires application/json |
| Error Messages | ❌ Detailed errors | ✅ Generic errors |
| Monitoring | ❌ No logging | ✅ Security event logging |

## After Demonstration

### Cleanup

1. **Revoke test API key** immediately
2. **Delete test Netlify site**
3. **Remove vulnerable code** from repository
4. **Never commit** this to main branch

### Show the Fix

After demonstrating vulnerabilities, show the secure version:
- [netlify/functions/gemini-proxy.mjs](../netlify/functions/gemini-proxy.mjs)
- [AI-SECURITY.md](../AI-SECURITY.md)
- [STRIX-MITIGATION-REPORT.md](../STRIX-MITIGATION-REPORT.md)

## Legal & Ethical Considerations

✅ **Acceptable Use:**
- Security training for your team
- Demonstrating Strix capabilities
- Educational presentations
- Red team exercises in isolated environments

❌ **Prohibited Use:**
- Production deployments
- Public internet exposure
- Testing against other people's systems without permission
- Bug bounty submissions (this is intentional)

## Questions?

This demo is designed to help you:
1. Understand AI security risks
2. Practice using Strix
3. Learn mitigation techniques
4. Train your security team

For questions about the secure implementation, see [AI-SECURITY.md](../AI-SECURITY.md).

---

**Remember**: The goal is to learn and improve security, not to create exploitable systems.
