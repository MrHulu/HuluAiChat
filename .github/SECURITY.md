# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 3.72.x  | :white_check_mark: |
| 3.71.x  | :white_check_mark: |
| < 3.70  | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Option 1: GitHub Security Advisory (Recommended)**

1. Go to [Security Advisories](https://github.com/MrHulu/HuluAiChat/security/advisories)
2. Click "Report a vulnerability"
3. Fill in the details

**Option 2: Email**

Send an email to: **491849417@qq.com**

Subject: `[Security] HuluChat Vulnerability Report`

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact info (for follow-up)

### Response Time

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 7 days
  - High: 14 days
  - Medium: 30 days
  - Low: Next release

### Disclosure Policy

- Please do not disclose the vulnerability publicly until a fix is released
- We will credit you in the security advisory (if desired)

## Security Best Practices for Users

### API Keys

- **Never share your API keys** with anyone
- Store API keys securely in HuluChat settings (encrypted locally)
- Rotate keys if you suspect they've been compromised

### Local Data

- HuluChat stores all data locally on your device
- Regular backups are recommended
- Use OS-level encryption (FileVault, BitLocker, etc.) for additional protection

### Updates

- Always update to the latest version for security patches
- Enable auto-update in settings

## Known Security Considerations

### Data Storage

- All chat history is stored in local SQLite database
- API keys are stored in encrypted format
- No data is sent to external servers (except AI providers you configure)

### Network Communication

- HuluChat only connects to:
  - AI provider APIs (OpenAI, DeepSeek, etc.) - for chat
  - RAG knowledge base (if enabled) - local only
- No telemetry or analytics

### Third-Party Dependencies

We regularly audit dependencies for known vulnerabilities using:
- GitHub Dependabot
- `npm audit`
- `pip audit`

---

*Last updated: 2026-03-16*
