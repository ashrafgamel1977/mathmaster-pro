
const CACHE_NAME = 'mathmaster-pro-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap',
  'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate and Cleanup Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy: Stale-While-Revalidate for most, Cache fallback for navigation
self.addEventListener('fetch', (event) => {
  // Navigation requests (HTML): Network First, fallback to Cache (index.html)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('./index.html')
            .then(res => res || caches.match('./'));
        })
    );
    return;
  }

  // Asset requests: Cache First, fallback to Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((response) => {
        // Optional: Cache new dynamic assets if needed
        return response;
      });
    })
  );
});

// Push Notifications
self.addEventListener('push', (event) => {
  let data = { title: 'تنبيه جديد', body: 'لديك تحديث في منصة الرياضيات', url: './index.html' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/3426/3426653.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/3426/3426653.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || './index.html',
      dateOfArrival: Date.now()
    },
    actions: [
      { action: 'open', title: 'عرض التفاصيل 👁️' },
    ],
    dir: 'rtl',
    lang: 'ar'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
