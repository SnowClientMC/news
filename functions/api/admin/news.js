// ADMIN endpoint (password protected) used by the management page.
//   GET    /api/admin/news            -> list (also verifies the password)
//   POST   /api/admin/news            -> add   (multipart: title, description, url?, image)
//   PUT    /api/admin/news?id=<id>    -> edit  (multipart: title?, description?, url?, image?)
//   DELETE /api/admin/news?id=<id>    -> remove
import {
  cleanDescription,
  cleanTitle,
  cleanUrl,
  json,
  loadNews,
  newId,
  preflight,
  readImage,
  requireAdmin,
  saveNews,
} from '../../_lib.js'

const MAX_NEWS = 30

export async function onRequestGet({ request, env }) {
  const denied = requireAdmin(request, env)
  if (denied) return denied
  const origin = new URL(request.url).origin
  const news = (await loadNews(env)).map((n) => ({
    id: n.id,
    title: n.title,
    description: n.description,
    url: n.url || '',
    image: n.hasImage ? `${origin}/api/image/${n.id}?v=${n.updated || 0}` : null,
  }))
  return json({ news })
}

export async function onRequestPost({ request, env }) {
  const denied = requireAdmin(request, env)
  if (denied) return denied

  const form = await request.formData()
  const title = cleanTitle(form.get('title'))
  const description = cleanDescription(form.get('description'))
  const url = cleanUrl(form.get('url'))
  if (!title) return json({ error: 'Title is required (max 70 characters).' }, 400)
  if (!description) return json({ error: 'Description is required (max 160 characters).' }, 400)
  if (url === null) return json({ error: 'The link must start with https://' }, 400)

  const { image, error } = await readImage(form.get('image'))
  if (error) return json({ error }, 400)
  if (!image) return json({ error: 'Please choose a landscape image.' }, 400)

  const news = await loadNews(env)
  if (news.length >= MAX_NEWS) return json({ error: `Limit of ${MAX_NEWS} posts reached. Remove an old one first.` }, 400)

  const id = newId()
  const now = Date.now()
  await env.NEWS.put(`img:${id}`, image.buffer, { metadata: { type: image.type } })
  news.unshift({ id, title, description, url, hasImage: true, created: now, updated: now })
  await saveNews(env, news)
  return json({ ok: true, id }, 201)
}

export async function onRequestPut({ request, env }) {
  const denied = requireAdmin(request, env)
  if (denied) return denied

  const id = new URL(request.url).searchParams.get('id')
  const news = await loadNews(env)
  const post = news.find((n) => n.id === id)
  if (!post) return json({ error: 'Post not found.' }, 404)

  const form = await request.formData()
  if (form.has('title')) {
    const title = cleanTitle(form.get('title'))
    if (!title) return json({ error: 'Title is required (max 70 characters).' }, 400)
    post.title = title
  }
  if (form.has('description')) {
    const description = cleanDescription(form.get('description'))
    if (!description) return json({ error: 'Description is required (max 160 characters).' }, 400)
    post.description = description
  }
  if (form.has('url')) {
    const url = cleanUrl(form.get('url'))
    if (url === null) return json({ error: 'The link must start with https://' }, 400)
    post.url = url
  }
  const { image, error } = await readImage(form.get('image'))
  if (error) return json({ error }, 400)
  if (image) {
    await env.NEWS.put(`img:${id}`, image.buffer, { metadata: { type: image.type } })
    post.hasImage = true
  }
  post.updated = Date.now()
  await saveNews(env, news)
  return json({ ok: true })
}

export async function onRequestDelete({ request, env }) {
  const denied = requireAdmin(request, env)
  if (denied) return denied

  const id = new URL(request.url).searchParams.get('id')
  const news = await loadNews(env)
  if (!news.some((n) => n.id === id)) return json({ error: 'Post not found.' }, 404)
  await env.NEWS.delete(`img:${id}`)
  await saveNews(env, news.filter((n) => n.id !== id))
  return json({ ok: true })
}

export function onRequestOptions() {
  return preflight()
}
