const CACHE_NAME = "askai-v1";
 
self.addEventListener("install", function () {

    console.log("AskAI Service Worker installed");

});


self.addEventListener("activate", function () {

    console.log("AskAI Service Worker activated");

});


self.addEventListener("fetch", function (event) {

    event.respondWith(
        fetch(event.request).catch(function () {
            return caches.match(event.request);
        })
    );

});
