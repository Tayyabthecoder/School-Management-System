const { isValidObjectId } = require('mongoose')
const { ApiError } = require('../middleware/error.middleware')

/**
 * Validates that an ID string is a valid MongoDB ObjectId.
 * Throws ApiError(400) if invalid to prevent Mongoose CastError leaking schema internals.
 *
 * @param {string} id - The ID string to test
 * @param {string} fieldName - Human-readable parameter name for error message
 */
const validateObjectId = (id, fieldName = 'ID') => {
  if (id && !isValidObjectId(id)) {
    throw new ApiError(400, `Invalid ${fieldName} identifier format`)
  }
}

module.exports = {
  validateObjectId,
}
