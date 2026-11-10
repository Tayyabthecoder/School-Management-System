/**
 * Wraps an async function so concurrent calls share one in-flight promise.
 * Once it settles (either way) the next call starts a fresh invocation.
 *
 * @template T
 * @param {() => Promise<T>} task
 * @returns {() => Promise<T>}
 */
export const createSingleFlight = (task) => {
  let inFlight = null
  return () => {
    if (!inFlight) {
      inFlight = Promise.resolve()
        .then(task)
        .finally(() => {
          inFlight = null
        })
    }
    return inFlight
  }
}

export default createSingleFlight
