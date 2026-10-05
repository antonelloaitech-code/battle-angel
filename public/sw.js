// battle angel offline shell.
// The page itself: network first so a new deploy always wins, saved copy when there's no signal.
// Built files in /assets are content-hashed: cached once, pruned when a newer build ships.
// Supabase requests are never touched.
const CACHE = 'battle-angel-shell-v1'
const NAV_TIMEOUT_MS = 4000

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell().catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key.startsWith('battle-angel-shell-') && key !== CACHE).map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstShell(request, event))
    return
  }
  if (url.pathname.startsWith('/assets/')) event.respondWith(cacheFirst(request))
})

async function precacheShell() {
  const response = await fetch('/', { cache: 'no-cache' })
  if (response.ok) await storeShell(response)
}

async function storeShell(response) {
  const cache = await caches.open(CACHE)
  const html = await response.clone().text()
  await cache.put('/', response)
  const assets = [...new Set([...html.matchAll(/["'](\/assets\/[^"']+)["']/g)].map((match) => match[1]))]
  await Promise.all(assets.map(async (path) => {
    if (await cache.match(path)) return
    try {
      const assetResponse = await fetch(path)
      if (assetResponse.ok) await cache.put(path, assetResponse)
    } catch {
      // Picked up on the next visit.
    }
  }))
  const keep = new Set(assets)
  const keys = await cache.keys()
  await Promise.all(keys.map((key) => {
    const path = new URL(key.url).pathname
    return path.startsWith('/assets/') && !keep.has(path) ? cache.delete(key) : null
  }))
}

function rejectAfter(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
}

async function networkFirstShell(request, event) {
  const network = fetch(request).then((response) => {
    if (response.ok) {
      const saving = storeShell(response.clone()).catch(() => {})
      try {
        event.waitUntil(saving)
      } catch {
        // Response already delivered from cache; the save still runs.
      }
    }
    return response
  })
  try {
    return await Promise.race([network, rejectAfter(NAV_TIMEOUT_MS)])
  } catch {
    const cache = await caches.open(CACHE)
    const cached = await cache.match('/')
    return cached || network
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) cache.put(request, response.clone()).catch(() => {})
  return response
}
