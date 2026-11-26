// GeoResist – funciona sem internet depois do primeiro acesso
const APP='georesist-app-v5', TILES='georesist-tiles-v2';
const SHELL=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','municipios.json'];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(APP).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting())); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==APP&&k!==TILES).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', e=>{
  const u=new URL(e.request.url);
  if (e.request.method!=='GET') return;
  if (u.hostname.endsWith('arcgisonline.com') || u.hostname.endsWith('arcgis.com')){ // satélite: guarda as imagens já vistas para usar sem sinal
    e.respondWith(caches.open(TILES).then(async c=>{ const hit=await c.match(e.request); if(hit) return hit;
      try{ const r=await fetch(e.request); if(r.ok||r.type==='opaque') c.put(e.request,r.clone()); return r; }catch(err){ return Response.error(); } }));
    return;
  }
  if (u.origin===location.origin){ // app: com internet usa a versão mais nova; sem sinal usa a guardada
    e.respondWith((async()=>{ const c=await caches.open(APP);
      try{ const ctl=new AbortController(); const t=setTimeout(()=>ctl.abort(),4000);
        const r=await fetch(e.request,{cache:'no-cache',signal:ctl.signal}); clearTimeout(t);
        if(r.ok) c.put(e.request,r.clone()); return r; }
      catch(err){ return (await c.match(e.request,{ignoreSearch:true})) || (await c.match('index.html')) || Response.error(); } })());
  }
});
