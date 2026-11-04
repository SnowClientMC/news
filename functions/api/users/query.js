// POST /api/users/query   body: {"uuids":["...", ...]}  (max 50)
// Answers which of those players are currently registered SnowClient users.
import { json, preflight } from '../../_lib.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const MAX = 50

export const onRequestOptions = () => preflight()

export async function onRequestPost({ request, env }) {
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON.' }, 400)
  }
  const ids = Array.isArray(body && body.uuids) ? body.uuids : []
  const uuids = [...new Set(ids.map((x) => String(x).toLowerCase()).filter((x) => UUID.test(x)))].slice(0, MAX)
  const hits = await Promise.all(uuids.map((u) => env.NEWS.get('u:' + u)))
  return json({ online: uuids.filter((_, i) => hits[i] !== null) }, 200, { 'Cache-Control': 'no-store' })
}
