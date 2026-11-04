// PUBLIC endpoint read by the SnowClient launcher.
// GET /api/news -> { news: [{ id, title, description, image, url, date }] }  (newest first)
import { json, loadNews, preflight } from '../_lib.js'

export async function onRequestGet({ request, env }) {
  const origin = new URL(request.url).origin
  const items = await loadNews(env)
  const news = items.map((n) => ({
    id: n.id,
    title: n.title,
    description: n.description,
    image: n.hasImage ? `${origin}/api/image/${n.id}?v=${n.updated || 0}` : null,
    url: n.url || '',
    date: n.created || 0,
  }))
  return json({ news }, 200, { 'Cache-Control': 'public, max-age=30' })
}

export function onRequestOptions() {
  return preflight()
}
