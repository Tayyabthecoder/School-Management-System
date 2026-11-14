// Lets non-React code (the axios interceptor) navigate through the router instead of forcing
// a full page reload with window.location, which discarded the in-memory access token and all
// app state. App registers the router's navigate function once at start-up.
let navigateFn = null

export const registerNavigator = (fn) => {
  navigateFn = fn
}

export const navigateTo = (path) => {
  if (navigateFn) {
    navigateFn(path, { replace: true })
  } else if (typeof window !== 'undefined') {
    window.location.assign(path)
  }
}
