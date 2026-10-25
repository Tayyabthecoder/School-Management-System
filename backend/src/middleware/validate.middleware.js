const { ApiError } = require('./error.middleware')

const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    })

    if (!result.success) {
      const details = result.error.issues.map(issue => ({
        field: issue.path.join('.').replace(/^(body|query|params)\./, ''),
        message: issue.message,
      }))
      throw new ApiError(400, 'Validation failed', details)
    }

    req.validatedData = result.data
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = { validate }
