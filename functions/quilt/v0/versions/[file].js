// LEGACY route: older launcher caches still point at /quilt/v0/versions/<loader>.json (no Minecraft version).
// Serves a profile built from 1.21.1 (which has the "intermediary" mappings library) with the game version
// replaced by the launcher's placeholder, so it works for every Minecraft version that uses intermediary.
// New manifests use /quilt/v0/versions/<minecraftVersion>/<loader>.json instead.
import { CORS } from '../../../_lib.js'

const META = 'https://meta.quiltmc.org/v3/versions'
const TEMPLATE_GAME = '1.21.1'
const DUMMY = '${modrinth.gameVersion}'

export async function onRequestGet({ params }) {
  const loader = String(params.file || '').replace(/\.json$/, '')
  if (!/^[0-9A-Za-z.+-]{1,40}$/.test(loader)) return new Response('Not found', { status: 404, headers: CORS })
  try {
    const res = await fetch(`${META}/loader/${TEMPLATE_GAME}/${encodeURIComponent(loader)}/profile/json`, {
      cf: { cacheTtl: 3600, cacheEverything: true },
    })
    if (!res.ok) return new Response(JSON.stringify({ error: `Quilt meta ${res.status}` }), { status: res.status, headers: CORS })
    const profile = await res.json()

    const now = new Date().toISOString()
    profile.time = now
    profile.releaseTime = now
    if (!profile.type) profile.type = 'release'
    profile.id = `quilt-loader-${loader}-${DUMMY}`
    profile.inheritsFrom = DUMMY
    profile.libraries = (profile.libraries || []).map((lib) => {
      if (typeof lib.name === 'string' && lib.name.endsWith(`:${TEMPLATE_GAME}`)) {
        lib.name = lib.name.slice(0, -TEMPLATE_GAME.length) + DUMMY
      }
      return lib
    })

    return new Response(JSON.stringify(profile), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600', ...CORS },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 502, headers: CORS })
  }
}
