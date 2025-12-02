# Version Display Setup

## Overview
The application now shows version information in the lower right corner of every page, including:
- Environment (production/staging/development)
- App version (from package.json)
- Git commit hash (short)
- Build timestamp

## Color Coding
- **Green**: Production (Railway)
- **Orange**: Staging (k3s)
- **Blue**: Development (local)

## Configuration

### Local Development
No configuration needed. The component will show:
- Environment: `development`
- Commit: `local`
- Build time: Current time

### Woodpecker CI (k3s/Staging)
Automatically configured in `.woodpecker.yml`. Build args are passed during Docker build:
```yaml
- docker build --build-arg COMMIT_HASH=${CI_COMMIT_SHA} --build-arg BUILD_TIME=${BUILD_TIME} --build-arg ENVIRONMENT=staging ...
```

### Railway (Production)
Railway needs manual configuration in the dashboard:

1. Go to your Railway project settings
2. Navigate to **Variables** tab
3. Add the following **Build-time variables**:

```
COMMIT_HASH=${{RAILWAY_GIT_COMMIT_SHA}}
BUILD_TIME=${{RAILWAY_DEPLOYMENT_CREATED_AT}}
ENVIRONMENT=production
```

Railway provides these automatic variables:
- `RAILWAY_GIT_COMMIT_SHA`: Full commit hash
- `RAILWAY_DEPLOYMENT_CREATED_AT`: ISO timestamp

**Note**: Railway's build-time variable syntax uses `${{VAR_NAME}}` which gets resolved during build.

## Files Modified
- `src/components/version-display.tsx` - New component
- `src/app/layout.tsx` - Added VersionDisplay component
- `Dockerfile` - Added ARG declarations and ENV exports
- `.woodpecker.yml` - Added build args to docker build command

## Verification
After deployment, check the lower right corner of any page:
- **k3s/staging**: Should show orange badge with actual commit hash
- **Railway/production**: Should show green badge with actual commit hash
- **Local dev**: Should show blue badge with "local" commit

## Troubleshooting

### Version shows "unknown" or "local" in production
Check that Railway build-time variables are configured correctly in the dashboard.

### Version badge not visible
- Check browser console for errors
- Verify the component is rendering (inspect element)
- Check z-index conflicts with other UI elements

### Wrong environment color
Verify the `ENVIRONMENT` build arg is set correctly:
- Railway: `production`
- k3s: `staging`
- Local: `development` (default)
# Version Display Feature
