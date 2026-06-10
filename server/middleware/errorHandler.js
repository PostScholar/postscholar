function errorHandler(err, req, res, _next) {
  const status = err.statusCode || err.status || 500
  const isProd = process.env.NODE_ENV === 'production'

  console.error('[error]', {
    method: req.method,
    path: req.path,
    status,
    message: err.message,
    ...(isProd ? {} : { stack: err.stack }),
  })

  if (err.status === 429) {
    return res.status(429).json({ error: err.message || 'Too many requests' })
  }

  res.status(status).json({
    error: status >= 500 && isProd ? 'Internal server error' : (err.message || 'Internal server error'),
    ...(err.code ? { code: err.code } : {}),
  })
}

module.exports = errorHandler
