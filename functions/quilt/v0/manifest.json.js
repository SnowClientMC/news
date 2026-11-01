// Quilt loader list in the format the SnowClient launcher expects.
// Built live from the official Quilt meta (https://meta.quiltmc.org) and cached for an hour.
import { CORS } from '../../_lib.js'

const META = 'https://meta.quiltmc.org/v3/versions'
const MAX_LOADERS = 25

async function getJson(url) {
  const res = await fetch(url, { cf: { cacheTtl: 3600, cacheEverything: true } })
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  return res.json()
}

export async function onRequestGet({ request }) {
  try {
    const origin = new URL(request.url).origin
    const [games, loaders] = await Promise.all([getJson(`${META}/game`), getJson(`${META}/loader`)])

    const loaderList = loaders.slice(0, MAX_LOADERS).map((l) => ({
      id: l.version,
      url: `${origin}/quilt/v0/versions/${encodeURIComponent(l.version)}.json`,
      stable: !/[-+]/.test(l.version),
    }))

    const gameVersions = games.map((g) => ({
      id: g.version,
      stable: Boolean(g.stable),
      loaders: loaderList,
    }))

    return new Response(JSON.stringify({ gameVersions }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=600', ...CORS },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 502, headers: CORS })
  }
}
