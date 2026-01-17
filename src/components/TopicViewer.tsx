'use client'

import type { Topic } from '@/lib/supabase'

interface TopicViewerProps {
  topic: Topic
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} წუთი`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours} საათი`
  }
  return `${hours} საათი ${mins} წუთი`
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null

  // Handle various YouTube URL formats
  let videoId: string | null = null

  // youtube.com/embed/VIDEO_ID
  if (url.includes('/embed/')) {
    const match = url.match(/\/embed\/([a-zA-Z0-9_-]+)/)
    videoId = match ? match[1] : null
  }
  // youtube.com/watch?v=VIDEO_ID
  else if (url.includes('watch?v=')) {
    const match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/)
    videoId = match ? match[1] : null
  }
  // youtu.be/VIDEO_ID
  else if (url.includes('youtu.be/')) {
    const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
    videoId = match ? match[1] : null
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`
  }

  return null
}

export default function TopicViewer({ topic }: TopicViewerProps) {
  const embedUrl = topic.theory_video ? getYouTubeEmbedUrl(topic.theory_video) : null

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg overflow-hidden">
      {/* Topic Header */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
          {topic.name}
        </h2>
        {topic.description && (
          <p className="text-zinc-600 dark:text-zinc-400 mb-3">
            {topic.description}
          </p>
        )}
        {topic.duration > 0 && (
          <div className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDuration(topic.duration)}
          </div>
        )}
      </div>

      {/* Video Section */}
      {embedUrl && (
        <div className="aspect-video">
          <iframe
            src={embedUrl}
            title={topic.name}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Resources */}
      {topic.miro_link && (
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-700">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">
            რესურსები
          </h3>
          <a
            href={topic.miro_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.392 0H13.9l4.833 10.593L13.9 24h3.492l4.833-13.407L17.392 0zM6.608 0l4.833 10.593L6.608 24H10.1l4.833-13.407L10.1 0H6.608z"/>
            </svg>
            Miro Board
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {/* No content message */}
      {!embedUrl && !topic.miro_link && (
        <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
          <div className="text-5xl mb-3">📝</div>
          <p>ამ თემის მასალა მალე დაემატება</p>
        </div>
      )}
    </div>
  )
}
