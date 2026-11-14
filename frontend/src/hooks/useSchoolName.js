import { useEffect, useState } from 'react'
import api from '../lib/axios'
import { logError } from '../lib/logger'

export const DEFAULT_SCHOOL_NAME = 'School Management System'

// One request per page load, shared by every component that shows the school name.
let cachedName = null
let inflight = null

const loadSchoolName = () => {
  if (cachedName) return Promise.resolve(cachedName)
  if (!inflight) {
    inflight = api.get('/settings')
      .then((res) => {
        cachedName = res.data?.data?.schoolName?.trim() || DEFAULT_SCHOOL_NAME
        return cachedName
      })
      .catch((err) => {
        logError('Failed to load school name:', err)
        return DEFAULT_SCHOOL_NAME
      })
      .finally(() => { inflight = null })
  }
  return inflight
}

/** The configured school name (Settings > School Profile), or a neutral default while loading. */
export function useSchoolName() {
  const [name, setName] = useState(cachedName || DEFAULT_SCHOOL_NAME)

  useEffect(() => {
    let active = true
    loadSchoolName().then((value) => { if (active) setName(value) })
    return () => { active = false }
  }, [])

  return name
}
