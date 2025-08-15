# Environment Configuration Guide

This document explains how to configure environment variables for the Project Management Application.

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Update the values** in `.env.local` for your development environment

3. **Start the application:**
   ```bash
   npm run dev
   ```

## Environment Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `.env.example` | Template with all available variables | Reference and initial setup |
| `.env.local` | Local development settings | Development environment |
| `.env.production` | Production configuration template | Production deployment |

## Required Variables

### Development
- `NEXT_PUBLIC_API_URL` - API backend URL (defaults to localhost)
- `NEXT_PUBLIC_USE_MOCK_API` - Use mock data (true for development)

### Production
- `NEXT_PUBLIC_API_URL` - Production API URL
- `NEXT_PUBLIC_USE_MOCK_API` - Should be false
- `AUTH_SECRET` - JWT secret key (must be secure)
- `DATABASE_URL` - Database connection string

## Variable Categories

### 🌐 API Configuration
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_USE_MOCK_API=true
NEXT_PUBLIC_API_TIMEOUT=10000
```

### 🔐 Authentication
```env
NEXT_PUBLIC_AUTH_PROVIDER=local
NEXT_PUBLIC_AUTH_TIMEOUT=3600000
AUTH_SECRET=your-jwt-secret
```

### 📊 Features
```env
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_EXPORT=true
NEXT_PUBLIC_ENABLE_BULK_OPERATIONS=true
```

### 🌍 Localization
```env
NEXT_PUBLIC_DEFAULT_LANGUAGE=en
NEXT_PUBLIC_SUPPORTED_LANGUAGES=en,ar
NEXT_PUBLIC_FALLBACK_LANGUAGE=en
```

### ⚡ Performance
```env
NEXT_PUBLIC_API_TIMEOUT=10000
NEXT_PUBLIC_DEBOUNCE_DELAY=300
NEXT_PUBLIC_PAGINATION_DEFAULT_LIMIT=20
```

### 🛡️ Security
```env
NEXT_PUBLIC_SESSION_TIMEOUT=1800000
NEXT_PUBLIC_CSRF_PROTECTION=true
NEXT_PUBLIC_RATE_LIMIT_REQUESTS=100
```

## Mock API vs Real API

### Development with Mock API (Default)
```env
NEXT_PUBLIC_USE_MOCK_API=true
NEXT_PUBLIC_API_URL=http://localhost:3001/api  # Not used when mock is true
```
- Uses simulated data
- No backend required
- Includes Arabic examples
- Simulates network delays

### Development with Real API
```env
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```
- Requires running backend server
- Real database integration
- Full API functionality

### Production
```env
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_URL=https://api.yourcompany.com/api
```
- Real production API
- Secure configuration
- Performance optimized

## File Upload Configuration

```env
# Maximum file size (10MB = 10485760 bytes)
NEXT_PUBLIC_MAX_FILE_SIZE=10485760

# Allowed file types
NEXT_PUBLIC_ALLOWED_FILE_TYPES=.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif
```

## Database Configuration (Backend)

```env
# PostgreSQL connection
DATABASE_URL=postgresql://username:password@localhost:5432/pma_db

# Individual settings (alternative to DATABASE_URL)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=pma_db
DATABASE_USER=pma_user
DATABASE_PASSWORD=secure_password
```

## External Services

### Email/SMTP
```env
SMTP_HOST=smtp.your-domain.com
SMTP_PORT=587
SMTP_USER=noreply@your-domain.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=PMA System <noreply@your-domain.com>
```

### AWS S3 (File Storage)
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=pma-documents
```

### Monitoring
```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
```

## Security Best Practices

### Development
- Use mock API for initial development
- Keep sensitive data in `.env.local` (not committed)
- Use localhost URLs

### Production
- Use strong, unique passwords
- Enable HTTPS only
- Configure proper CORS settings
- Set secure JWT secrets
- Enable rate limiting
- Use environment-specific databases

## Environment Validation

The application automatically validates environment variables:

```typescript
import { validateEnvironment } from '@/config/environment';

const validation = validateEnvironment();
if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors);
}
```

## Debugging Configuration

Enable debug logging in development:

```env
NEXT_PUBLIC_ENABLE_CONSOLE_LOGS=true
LOG_LEVEL=debug
```

This will show:
- API service selection (Mock vs Real)
- Configuration summary
- Environment validation results

## Common Issues

### Mock API Not Working
- Check `NEXT_PUBLIC_USE_MOCK_API=true`
- Verify no backend URL conflicts

### API Connection Errors
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check if backend is running
- Confirm network connectivity

### Authentication Issues
- Ensure `AUTH_SECRET` is set
- Check token expiration settings
- Verify JWT configuration

### File Upload Failures
- Check `NEXT_PUBLIC_MAX_FILE_SIZE` limit
- Verify allowed file types
- Confirm storage configuration

## Example Configurations

### Local Development
```env
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_USE_MOCK_API=true
NEXT_PUBLIC_ENABLE_DEVTOOLS=true
```

### Staging Environment
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://staging-api.yourcompany.com/api
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_ENABLE_DEVTOOLS=true
```

### Production Environment
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourcompany.com/api
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_ENABLE_DEVTOOLS=false
```

## Support

For configuration issues:
1. Check this README
2. Validate environment variables
3. Review console logs (if enabled)
4. Check application configuration summary
