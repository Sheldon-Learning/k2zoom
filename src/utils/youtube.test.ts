import { describe, expect, it } from 'vitest'
import { extractYouTubeId, youtubeEmbedUrl } from './youtube'

const id = 'M7lc1UVf-VE'

describe('YouTube links', () => {
  it.each([
    `https://www.youtube.com/watch?v=${id}&t=10`,
    `https://youtu.be/${id}`,
    `https://youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://m.youtube.com/watch?v=${id}`,
  ])('extracts a video ID from %s', (url) => {
    expect(extractYouTubeId(url)).toBe(id)
  })

  it.each([
    'https://example.com/watch?v=M7lc1UVf-VE',
    'javascript:alert(1)',
    'https://youtube.com/watch?v=short',
    'not a link',
  ])('rejects %s', (url) => expect(extractYouTubeId(url)).toBeNull())

  it('constructs a privacy enhanced embed URL only from a valid ID', () => {
    expect(youtubeEmbedUrl(id)).toContain(`youtube-nocookie.com/embed/${id}`)
    expect(() => youtubeEmbedUrl('bad')).toThrow()
  })
})
