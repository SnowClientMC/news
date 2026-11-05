// POST /api/users/query   body: {"players":[{"uuid":"...","name":"..."}, ...]}  (max 50)
// (older mods send {"uuids":[...]}, still accepted)
// Answers which of those players are currently registered SnowClient users, matching by UUID or by name.
// Response: {"online":[<uuid>, ...]}  - the UUIDs from the request that matched.
import { json, preflight } from '../../_lib.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const NAME = /^[A-Za-z0-9_]{1,16}$/
const MAX = 50

export const onRequestOptions = () => preflight()

export async function onRequestPost({ request, env }) {
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON.' }, 400)
  }
  let raw = []
  if (Array.isArray(body && body.players)) raw = body.players
  else if (Array.isArray(body && body.uuids)) raw = body.uuids.map((u) => ({ uuid: u }))

  const seen = new Set()
  const players = []
  for (const p of raw) {
    const uuid = String((p && p.uuid) || '').toLowerCase()
    if (!UUID.test(uuid) || seen.has(uuid)) continue
    seen.add(uuid)
    const name = String((p && p.name) || '')
    players.push({ uuid, name: NAME.test(name) ? name.toLowerCase() : '' })
    if (players.length >= MAX) break
  }

  const hits = await Promise.all(
    players.map(async (p) => {
      if ((await env.NEWS.get('u:' + p.uuid)) !== null) return true
      return p.name ? (await env.NEWS.get('n:' + p.name)) !== null : false
    }),
  )
  return json({ online: players.filter((_, i) => hits[i]).map((p) => p.uuid) }, 200, { 'Cache-Control': 'no-store' })
}
