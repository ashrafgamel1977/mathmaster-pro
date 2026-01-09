
const CACHE_NAME = 'mathmaster-pro-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap',
  'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css'
];

// تثبيت الـ Service Worker وحفظ الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// استراتيجية عرض الملفات (أولاً من الكاش لسرعة استجابة التطبيق)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// التعامل مع الإشعارات الفورية القادمة (Push Events)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {
    title: 'تنبيه جديد من الأستاذ أشرف جميل',
    body: 'لديك تحديث جديد في منصة الرياضيات، اضغط للمتابعة.',
    icon: 'https://cdn-icons-png.flaticon.com/512/3426/3426653.png'
  };

  const options = {
    body: data.body,
    icon: data.icon || 'https://cdn-icons-png.flaticon.com/512/3426/3426653.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/3426/3426653.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || './index.html'
    },
    actions: [
      { action: 'open', title: 'عرض الآن 📖' },
      { action: 'close', title: 'إغلاق' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ماذا يحدث عند النقر على الإشعار؟
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow(event.notification.data.url);
    })
  );
});

// تحديث الكاش عند إصدار نسخة جديدة
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
    })
  );
});
