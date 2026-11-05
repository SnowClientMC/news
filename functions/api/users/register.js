// POST /api/users/register   body: {"uuid":"<player uuid>","name":"<player name>"}
// Marks a player as "using SnowClient" for 2 hours (the mod re-sends it every 90 minutes).
// Stored by UUID and by name, because some servers hand out different UUIDs per arena.
import { json, preflight } from '../../_lib.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const NAME = /^[A-Za-z0-9_]{1,16}$/
const TTL_SECONDS = 2 * 60 * 60

export const onRequestOptions = () => preflight()

export async function onRequestPost({ request, env }) {
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON.' }, 400)
  }
  const uuid = String((body && body.uuid) || '').toLowerCase()
  if (!UUID.test(uuid)) return json({ error: 'Invalid uuid.' }, 400)
  const name = String((body && body.name) || '')
  const writes = [env.NEWS.put('u:' + uuid, '1', { expirationTtl: TTL_SECONDS })]
  if (NAME.test(name)) writes.push(env.NEWS.put('n:' + name.toLowerCase(), '1', { expirationTtl: TTL_SECONDS }))
  await Promise.all(writes)
  return json({ ok: true })
}
