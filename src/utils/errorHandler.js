/**
 * Error Handler Utility
 * Centralized error handling for NutriTrack application
 */

/**
 * Create a standardized error object
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 * @returns {Error} Standardized error object
 */
function createError(message, status = 500, code = 'INTERNAL_ERROR', details = {}) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.details = details;
  error.timestamp = new Date().toISOString();
  return error;
}

/**
 * Common error types
 */
const ErrorTypes = {
  VALIDATION_ERROR: (message, details) => createError(message, 400, 'VALIDATION_ERROR', details),
  UNAUTHORIZED: (message = 'Unauthorized access') => createError(message, 401, 'UNAUTHORIZED'),
  FORBIDDEN: (message = 'Access denied') => createError(message, 403, 'FORBIDDEN'),
  NOT_FOUND: (message = 'Resource not found') => createError(message, 404, 'NOT_FOUND'),
  CONFLICT: (message = 'Resource conflict') => createError(message, 409, 'CONFLICT'),
  INTERNAL_ERROR: (message = 'Internal server error') => createError(message, 500, 'INTERNAL_ERROR'),
  SERVICE_UNAVAILABLE: (message = 'Service temporarily unavailable') => createError(message, 503, 'SERVICE_UNAVAILABLE'),
  DATABASE_ERROR: (message = 'Database operation failed') => createError(message, 500, 'DATABASE_ERROR'),
  FILE_UPLOAD_ERROR: (message = 'File upload failed') => createError(message, 400, 'FILE_UPLOAD_ERROR'),
  AUTHENTICATION_ERROR: (message = 'Authentication failed') => createError(message, 401, 'AUTHENTICATION_ERROR')
};

/**
 * Handle async route errors
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped route handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Log error with context
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
function logError(error, context = {}) {
  const logData = {
    message: error.message,
    status: error.status || 500,
    code: error.code || 'UNKNOWN',
    timestamp: error.timestamp || new Date().toISOString(),
    stack: error.stack,
    context
  };
  
  console.error('Error occurred:', logData);
  
  // In production, you might want to send this to an error tracking service
  // like Sentry, LogRocket, etc.
}

/**
 * Get user-friendly error message
 * @param {Error} error - Error object
 * @returns {string} User-friendly message
 */
function getUserFriendlyMessage(error) {
  const friendlyMessages = {
    'VALIDATION_ERROR': 'Please check your input and try again.',
    'UNAUTHORIZED': 'Please log in to access this resource.',
    'FORBIDDEN': 'You don\'t have permission to perform this action.',
    'NOT_FOUND': 'The requested resource was not found.',
    'CONFLICT': 'This action conflicts with existing data.',
    'DATABASE_ERROR': 'We\'re experiencing technical difficulties. Please try again later.',
    'FILE_UPLOAD_ERROR': 'There was a problem uploading your file. Please try again.',
    'AUTHENTICATION_ERROR': 'Your login session has expired. Please log in again.',
    'SERVICE_UNAVAILABLE': 'Our service is temporarily unavailable. Please try again later.'
  };
  
  return friendlyMessages[error.code] || 'An unexpected error occurred. Please try again.';
}

/**
 * Format error for API responses
 * @param {Error} error - Error object
 * @param {boolean} includeStack - Whether to include stack trace
 * @returns {Object} Formatted error response
 */
function formatErrorResponse(error, includeStack = false) {
  const response = {
    error: {
      message: getUserFriendlyMessage(error),
      code: error.code || 'INTERNAL_ERROR',
      status: error.status || 500,
      timestamp: error.timestamp || new Date().toISOString()
    }
  };
  
  if (includeStack && process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
    response.error.details = error.details;
  }
  
  return response;
}

/**
 * Express error handler middleware
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(error, req, res, next) {
  // Log the error
  logError(error, {
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  // Determine if this is an API request
  const isApiRequest = req.path.startsWith('/api/') || req.get('Accept')?.includes('application/json');
  
  if (isApiRequest) {
    // Return JSON error response for API requests
    const response = formatErrorResponse(error, process.env.NODE_ENV === 'development');
    res.status(error.status || 500).json(response);
  } else {
    // Render error page for web requests
    const errorData = {
      errorCode: error.status || 500,
      errorTitle: getErrorTitle(error.status || 500),
      errorMessage: getUserFriendlyMessage(error),
      icon: getErrorIcon(error.status || 500),
      additionalInfo: getAdditionalInfo(error.status || 500),
      debugInfo: process.env.NODE_ENV === 'development' ? JSON.stringify({
        message: error.message,
        stack: error.stack,
        status: error.status,
        code: error.code,
        timestamp: error.timestamp
      }, null, 2) : null
    };
    
    res.status(error.status || 500).render('error/generic', errorData);
  }
}

/**
 * Get error title based on status code
 * @param {number} status - HTTP status code
 * @returns {string} Error title
 */
function getErrorTitle(status) {
  const titles = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Access Denied',
    404: 'Page Not Found',
    409: 'Conflict',
    500: 'Internal Server Error',
    503: 'Service Unavailable'
  };
  
  return titles[status] || 'Error';
}

/**
 * Get error icon based on status code
 * @param {number} status - HTTP status code
 * @returns {string} Icon class
 */
function getErrorIcon(status) {
  const icons = {
    400: 'ri-error-warning-line',
    401: 'ri-lock-line',
    403: 'ri-shield-cross-line',
    404: 'ri-file-search-line',
    409: 'ri-alert-line',
    500: 'ri-server-line',
    503: 'ri-tools-line'
  };
  
  return icons[status] || 'ri-error-warning-line';
}

/**
 * Get additional info based on status code
 * @param {number} status - HTTP status code
 * @returns {string} Additional info HTML
 */
function getAdditionalInfo(status) {
  const info = {
    400: `
      <ul class="space-y-2">
        <li>• Check your input for any errors</li>
        <li>• Make sure all required fields are filled</li>
        <li>• Try refreshing the page</li>
        <li>• Contact support if the problem persists</li>
      </ul>
    `,
    401: `
      <ul class="space-y-2">
        <li>• Make sure you're logged in</li>
        <li>• Check if your session has expired</li>
        <li>• Try logging out and back in</li>
        <li>• Contact support if you can't log in</li>
      </ul>
    `,
    403: `
      <ul class="space-y-2">
        <li>• Check if you have the necessary permissions</li>
        <li>• Make sure you're logged in with the correct account</li>
        <li>• Try logging out and back in</li>
        <li>• Contact an administrator for access</li>
      </ul>
    `,
    404: `
      <ul class="space-y-2">
        <li>• Check the URL for typos</li>
        <li>• The page might have been moved or deleted</li>
        <li>• Try using the navigation menu</li>
        <li>• Contact support if you believe this is an error</li>
      </ul>
    `,
    500: `
      <ul class="space-y-2">
        <li>• This is a temporary server issue</li>
        <li>• Our team has been notified</li>
        <li>• Try refreshing the page in a few minutes</li>
        <li>• Contact support if the problem persists</li>
      </ul>
    `,
    503: `
      <ul class="space-y-2">
        <li>• We're performing scheduled maintenance</li>
        <li>• High traffic might be causing delays</li>
        <li>• Try again in a few minutes</li>
        <li>• Check our status page for updates</li>
      </ul>
    `
  };
  
  return info[status] || `
    <ul class="space-y-2">
      <li>• Try refreshing the page</li>
      <li>• Check your internet connection</li>
      <li>• Clear your browser cache</li>
      <li>• Contact support if the issue continues</li>
    </ul>
  `;
}

module.exports = {
  createError,
  ErrorTypes,
  asyncHandler,
  logError,
  getUserFriendlyMessage,
  formatErrorResponse,
  errorHandler
};
