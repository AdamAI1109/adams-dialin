const CACHE_PREFIX="adams-dialin-";
self.addEventListener("install",function(){self.skipWaiting();});
self.addEventListener("activate",function(e){
  e.waitUntil((async function(){
    const ks=await caches.keys();
    await Promise.all(ks.filter(function(k){return k.startsWith(CACHE_PREFIX);}).map(function(k){return caches.delete(k);}));
    await self.registration.unregister();
    await self.clients.claim();
  })());
});
self.addEventListener("fetch",function(){});
