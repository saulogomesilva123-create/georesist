// GeoResist – funciona sem internet depois do primeiro acesso
const APP='georesist-app-v1', TILES='georesist-tiles-v1';
const SHELL=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(APP).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==APP&&k!==TILES).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', e=>{
  const u=new URL(e.request.url);
  if (e.request.method!=='GET') return;
  if (u.hostname.includes('arcgisonline.com')){ // imagens de satélite: guarda as já vistas para usar sem sinal
    e.respondWith(caches.open(TILES).then(async c=>{ const hit=await c.match(e.request); if(hit) return hit;
      try{ const r=await fetch(e.request); if(r.ok||r.type==='opaque') c.put(e.request,r.clone()); return r; }catch(err){ return hit||Response.error(); } }));
    return;
  }
  if (u.origin===location.origin){ // app: usa a versão salva e atualiza em segundo plano
    e.respondWith(caches.open(APP).then(async c=>{ const hit=await c.match(e.request,{ignoreSearch:true});
      const net=fetch(e.request).then(r=>{ if(r.ok) c.put(e.request,r.clone()); return r; }).catch(()=>null);
      return hit || (await net) || c.match('index.html'); }));
  }
});
