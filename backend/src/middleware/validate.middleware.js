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
    // Controllers read req.body, so hand them the parsed copy: zod strips unknown keys (mass
    // assignment) and applies coercion/defaults. Schemas must not be .passthrough().
    if (result.data.body !== undefined) req.body = result.data.body
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = { validate }
