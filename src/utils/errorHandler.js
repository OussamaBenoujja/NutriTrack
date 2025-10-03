// Centralized Express error handler
// Ensures it does not leak stack traces in production but helps in development.

module.exports.errorHandler = (err, req, res, next) => {
  // Basic logging (could be replaced with a real logger later)
  console.error('[ERROR]', err);

  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  // Prefer explicit error view patterns we already have
  let viewName;
  if (status === 404) viewName = 'error/404';
  else if (status === 403) viewName = 'error/403';
  else if (status === 503) viewName = 'error/503';
  else if (status === 500) viewName = 'error/500';
  else viewName = 'error/generic';

  // Fallback data for template
  const templateData = {
    errorCode: status,
    errorTitle: err.title || err.name || 'Error',
    errorMessage: err.publicMessage || err.message || 'An unexpected error occurred.',
    debugInfo: isProd ? null : (err.stack || String(err)),
  };

  // If headers already sent, delegate to default handler
  if (res.headersSent) {
    return next(err);
  }

  try {
    res.status(status).render(viewName, templateData);
  } catch (renderErr) {
    console.error('[ERROR][RENDER_FAIL]', renderErr);
    // Last resort plain text
    res.status(status).type('text').send(isProd ? 'Server Error' : (err.stack || err.message));
  }
};
