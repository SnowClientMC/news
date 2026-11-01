// One Quilt loader version as a launcher "partial version" file.
// GET /quilt/v0/versions/<loaderVersion>.json
// Quilt's profile is fetched for a recent game version, then that game version is replaced by the
// launcher's placeholder so the same file works for every Minecraft version.
import { CORS } from '../../../_lib.js'

const META = 'https://meta.quiltmc.org/v3/versions'
const DUMMY = '${modrinth.gameVersion}'

async function getJson(url) {
  const res = await fetch(url, { cf: { cacheTtl: 3600, cacheEverything: true } })
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  return res.json()
}

export async function onRequestGet({ params }) {
  const loader = String(params.file || '').replace(/\.json$/, '')
  if (!/^[0-9A-Za-z.+-]{1,40}$/.test(loader)) return new Response('Not found', { status: 404, headers: CORS })
  try {
    const games = await getJson(`${META}/game`)
    const game = (games.find((g) => g.stable) || games[0]).version
    const profile = await getJson(
      `${META}/loader/${encodeURIComponent(game)}/${encodeURIComponent(loader)}/profile/json`,
    )

    const now = new Date().toISOString()
    profile.time = now
    profile.releaseTime = now
    if (!profile.type) profile.type = 'release'
    profile.id = `quilt-loader-${loader}-${DUMMY}`
    profile.inheritsFrom = DUMMY
    profile.libraries = (profile.libraries || []).map((lib) => {
      if (typeof lib.name === 'string' && lib.name.endsWith(`:${game}`)) {
        lib.name = lib.name.slice(0, -game.length) + DUMMY
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
