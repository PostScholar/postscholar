class AppError extends Error {
  constructor(message, statusCode = 400, code = null) {
    super(message)
    this.statusCode = statusCode
    this.code = code
  }
}

module.exports = AppError
