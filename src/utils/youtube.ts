const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/

export function extractYouTubeId(input: string): string | null {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  const segments = url.pathname.split('/').filter(Boolean)
  let id: string | null = null
  if (host === 'youtu.be') id = segments[0] ?? null
  if (
    [
      'youtube.com',
      'm.youtube.com',
      'music.youtube.com',
      'youtube-nocookie.com',
    ].includes(host)
  ) {
    if (url.pathname === '/watch') id = url.searchParams.get('v')
    else if (['embed', 'shorts', 'live'].includes(segments[0]))
      id = segments[1] ?? null
  }
  return id && VIDEO_ID.test(id) ? id : null
}

export function youtubeEmbedUrl(videoId: string): string {
  if (!VIDEO_ID.test(videoId)) throw new Error('Invalid YouTube video ID')
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`
}
