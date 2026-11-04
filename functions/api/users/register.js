// POST /api/users/register   body: {"uuid":"<player uuid>"}
// Marks a player as "using SnowClient" for 2 hours (the mod re-sends it every 90 minutes).
import { json, preflight } from '../../_lib.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const TTL_SECONDS = 2 * 60 * 60

export const onRequestOptions = () => preflight()

export async function onRequestPost({ request, env }) {
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON.' }, 400)
  }
  const uuid = String(body && body.uuid || '').toLowerCase()
  if (!UUID.test(uuid)) return json({ error: 'Invalid uuid.' }, 400)
  await env.NEWS.put('u:' + uuid, '1', { expirationTtl: TTL_SECONDS })
  return json({ ok: true })
}
