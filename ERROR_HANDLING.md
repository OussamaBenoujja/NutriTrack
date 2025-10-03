# Error Handling System Documentation

## Overview
The NutriTrack application now includes a comprehensive error handling system with beautiful error pages, centralized error management, and toast notifications.

## File Structure
```
src/
├── ui/views/
│   ├── layouts/
│   │   └── error.ejs          # Main error layout template
│   └── error/
│       ├── 404.ejs            # 404 Not Found page
│       ├── 403.ejs            # 403 Forbidden page
│       ├── 500.ejs            # 500 Internal Server Error page
│       ├── 503.ejs            # 503 Service Unavailable page
│       └── generic.ejs         # Generic error page
├── utils/
│   └── errorHandler.js        # Error handling utilities
└── ui/routes/
    └── testRoutes.js         # Test routes for error handling
```

## Features

### 🎨 **Beautiful Error Pages**
- **Consistent Design**: Matches your Persian green theme
- **Responsive Layout**: Works on all devices
- **Animated Elements**: Floating icons and smooth transitions
- **Helpful Information**: Context-specific guidance for users

### 🛠 **Error Types Supported**
- **404 Not Found**: Page doesn't exist
- **403 Forbidden**: Access denied
- **500 Internal Server Error**: Server-side errors
- **503 Service Unavailable**: Maintenance or overload
- **Custom Errors**: Any other error type

### 📱 **User Experience**
- **Clear Navigation**: Easy ways to get back to the app
- **Helpful Links**: Support, refresh, and contact options
- **Toast Notifications**: Error-specific notifications
- **Debug Information**: Development-only error details

## Usage

### Basic Error Handling
```javascript
const { ErrorTypes, asyncHandler } = require('./utils/errorHandler');

// Throw a specific error
router.get('/some-route', (req, res, next) => {
  if (someCondition) {
    const error = ErrorTypes.NOT_FOUND('Resource not found');
    return next(error);
  }
  res.json({ success: true });
});

// Handle async errors
router.get('/async-route', asyncHandler(async (req, res) => {
  const data = await someAsyncOperation();
  res.json(data);
}));
```

### Error Types Available
```javascript
ErrorTypes.VALIDATION_ERROR(message, details)
ErrorTypes.UNAUTHORIZED(message)
ErrorTypes.FORBIDDEN(message)
ErrorTypes.NOT_FOUND(message)
ErrorTypes.CONFLICT(message)
ErrorTypes.INTERNAL_ERROR(message)
ErrorTypes.SERVICE_UNAVAILABLE(message)
ErrorTypes.DATABASE_ERROR(message)
ErrorTypes.FILE_UPLOAD_ERROR(message)
ErrorTypes.AUTHENTICATION_ERROR(message)
```

### Custom Error Creation
```javascript
const { createError } = require('./utils/errorHandler');

const customError = createError(
  'Custom error message',
  418, // HTTP status
  'TEAPOT_ERROR', // Error code
  { additional: 'data' } // Details
);
```

## Error Pages

### 404 - Page Not Found
- **Icon**: File search
- **Message**: Page doesn't exist or has been moved
- **Actions**: Go to Dashboard, Go Back

### 403 - Access Denied
- **Icon**: Shield with cross
- **Message**: Permission denied
- **Actions**: Login, Contact Admin

### 500 - Internal Server Error
- **Icon**: Server
- **Message**: Server-side error
- **Actions**: Refresh, Contact Support

### 503 - Service Unavailable
- **Icon**: Tools
- **Message**: Service temporarily down
- **Actions**: Try Again Later, Check Status

## Toast Notifications

Error pages include toast notifications for:
- **Error Context**: Additional error information
- **User Guidance**: Next steps and suggestions
- **Auto-refresh**: For certain error types
- **Status Updates**: Service availability

## Development Features

### Test Routes (Development Only)
Access these routes in development mode:
- `/test/404` - Test 404 error
- `/test/500` - Test 500 error
- `/test/403` - Test 403 error
- `/test/async-error` - Test async error handling
- `/test/validation` - Test validation error
- `/test/upload-error` - Test file upload error
- `/test/503` - Test service unavailable
- `/test/custom` - Test custom error

### Debug Information
In development mode, error pages show:
- **Error Stack**: Full error stack trace
- **Error Details**: Additional error context
- **Request Info**: URL, method, timestamp
- **User Agent**: Browser information

## Production Considerations

### Error Logging
- All errors are logged with context
- Consider integrating with error tracking services (Sentry, LogRocket)
- Monitor error rates and patterns

### User Experience
- Error pages are user-friendly
- No technical details exposed to users
- Clear paths to resolution

### Security
- No sensitive information in error messages
- Proper error sanitization
- Rate limiting for error endpoints

## Customization

### Styling
Error pages use your existing design system:
- **Colors**: Persian green theme
- **Typography**: Manrope font family
- **Layout**: Responsive grid system
- **Animations**: Smooth transitions

### Content
Customize error messages in:
- `src/utils/errorHandler.js` - Error messages and titles
- `src/ui/views/error/` - Page-specific content
- `src/ui/views/layouts/error.ejs` - Layout and styling

## Testing

### Manual Testing
1. Visit test routes in development
2. Check error page rendering
3. Verify toast notifications
4. Test responsive design

### Automated Testing
Consider adding tests for:
- Error page rendering
- Error handling middleware
- Toast notification display
- User navigation flows

## Best Practices

### Error Handling
1. **Use Specific Error Types**: Choose appropriate error types
2. **Provide Context**: Include helpful error messages
3. **Log Everything**: Track all errors for debugging
4. **User-Friendly**: Never expose technical details to users

### Error Pages
1. **Consistent Design**: Match your app's design system
2. **Clear Navigation**: Provide easy ways to recover
3. **Helpful Information**: Guide users to resolution
4. **Mobile-Friendly**: Ensure responsive design

### Toast Notifications
1. **Appropriate Timing**: Show notifications at the right time
2. **Clear Messages**: Use simple, actionable language
3. **Visual Hierarchy**: Use appropriate colors and icons
4. **Auto-dismiss**: Don't overwhelm users

## Integration

The error handling system is fully integrated with:
- **Express.js**: Middleware-based error handling
- **EJS Templates**: Server-side rendering
- **Toast System**: Client-side notifications
- **Session Management**: User context preservation
- **Route Protection**: Authentication-aware errors

This comprehensive error handling system ensures your NutriTrack application provides a professional, user-friendly experience even when things go wrong.
