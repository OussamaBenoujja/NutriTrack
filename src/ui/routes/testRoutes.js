const express = require('express');
const router = express.Router();
const { ErrorTypes, asyncHandler } = require('../../utils/errorHandler');

// Test routes for error handling (remove in production)
if (process.env.NODE_ENV === 'development') {
  
  // Test 404 error
  router.get('/test/404', (req, res, next) => {
    const error = ErrorTypes.NOT_FOUND('Test resource not found');
    next(error);
  });
  
  // Test 500 error
  router.get('/test/500', (req, res, next) => {
    const error = ErrorTypes.INTERNAL_ERROR('Test server error');
    next(error);
  });
  
  // Test 403 error
  router.get('/test/403', (req, res, next) => {
    const error = ErrorTypes.FORBIDDEN('Test access denied');
    next(error);
  });
  
  // Test async error
  router.get('/test/async-error', asyncHandler(async (req, res) => {
    throw ErrorTypes.DATABASE_ERROR('Test database error');
  }));
  
  // Test validation error
  router.get('/test/validation', (req, res, next) => {
    const error = ErrorTypes.VALIDATION_ERROR('Test validation failed', {
      field: 'email',
      message: 'Invalid email format'
    });
    next(error);
  });
  
  // Test file upload error
  router.get('/test/upload-error', (req, res, next) => {
    const error = ErrorTypes.FILE_UPLOAD_ERROR('Test file upload failed');
    next(error);
  });
  
  // Test service unavailable
  router.get('/test/503', (req, res, next) => {
    const error = ErrorTypes.SERVICE_UNAVAILABLE('Test service unavailable');
    next(error);
  });
  
  // Test custom error
  router.get('/test/custom', (req, res, next) => {
    const error = new Error('Custom test error');
    error.status = 418;
    error.code = 'TEAPOT_ERROR';
    next(error);
  });
}

module.exports = router;
