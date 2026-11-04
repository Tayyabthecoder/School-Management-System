export const downloadBlobResponse = async (response, fallbackName) => {
  const disposition = response.headers['content-disposition'] || response.headers['Content-Disposition'] || ''
  let filename = fallbackName
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^"]+)"?/)
    if (match && match[1]) {
      filename = match[1]
    }
  }

  const blob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/octet-stream',
  })
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(downloadUrl)
}
