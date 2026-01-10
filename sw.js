
const CACHE_NAME = 'mathmaster-pro-v3';
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
  let data = { title: 'تنبيه جديد', body: 'لديك تحديث في منصة الرياضيات', url: './index.html' };
  
  if (event.data) {
    try {
      // محاولة قراءة البيانات كـ JSON إذا كانت مرسلة من السيرفر
      data = event.data.json();
    } catch (e) {
      // إذا كانت نصاً عادياً
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

// ماذا يحدث عند النقر على الإشعار؟
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // محاولة العثور على نافذة مفتوحة بالفعل
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // إذا لم توجد، فتح نافذة جديدة
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
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
