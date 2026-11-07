/**
 * Secure blob download utility with filename sanitization
 */
export const downloadBlobResponse = (response, fallbackName = 'document') => {
  if (!response || !response.data) return

  const disposition = response.headers?.['content-disposition'] || response.headers?.['Content-Disposition'] || ''
  let filename = fallbackName

  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/)
    if (match && match[1]) {
      filename = match[1].trim()
    }
  }

  // Strip path traversal and illegal filesystem characters
  const sanitizedFilename = filename.replace(/[/\\?%*:|"<>]/g, '_').trim() || fallbackName

  const blob = new Blob([response.data], {
    type: response.headers?.['content-type'] || 'application/octet-stream',
  })

  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.setAttribute('download', sanitizedFilename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(downloadUrl)
}

export default downloadBlobResponse
