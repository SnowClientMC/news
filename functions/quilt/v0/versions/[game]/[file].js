// One Quilt loader version for one Minecraft version, as a launcher "partial version" file.
// GET /quilt/v0/versions/<minecraftVersion>/<loaderVersion>.json
// Fetched per Minecraft version on purpose: older versions need the "intermediary" mappings library,
// newer (unobfuscated) versions do not, so one shared file cannot work for all of them.
import { CORS } from '../../../../_lib.js'

const META = 'https://meta.quiltmc.org/v3/versions'

export async function onRequestGet({ params }) {
  const game = String(params.game || '')
  const loader = String(params.file || '').replace(/\.json$/, '')
  if (!/^[0-9A-Za-z._+-]{1,40}$/.test(game) || !/^[0-9A-Za-z.+-]{1,40}$/.test(loader)) {
    return new Response('Not found', { status: 404, headers: CORS })
  }
  try {
    const res = await fetch(
      `${META}/loader/${encodeURIComponent(game)}/${encodeURIComponent(loader)}/profile/json`,
      { cf: { cacheTtl: 3600, cacheEverything: true } },
    )
    if (!res.ok) return new Response(JSON.stringify({ error: `Quilt meta ${res.status}` }), { status: res.status, headers: CORS })
    const profile = await res.json()

    // Normalise the fields the launcher parses strictly.
    const now = new Date().toISOString()
    profile.time = now
    profile.releaseTime = now
    if (!profile.type) profile.type = 'release'

    return new Response(JSON.stringify(profile), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600', ...CORS },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 502, headers: CORS })
  }
}
