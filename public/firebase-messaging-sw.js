// Firebase Cloud Messaging Service Worker
// Replace with your Firebase config when connecting FCM

// importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// firebase.initializeApp({
//   apiKey: '',
//   authDomain: '',
//   projectId: '',
//   storageBucket: '',
//   messagingSenderId: '',
//   appId: '',
// });

// const messaging = firebase.messaging();

// messaging.onBackgroundMessage((payload) => {
//   const { title, body } = payload.notification || {};
//   self.registration.showNotification(title || 'TRUSTFY', {
//     body: body || 'Nova atualização',
//     icon: '/icons/icon-192.png',
//     badge: '/icons/icon-72.png',
//     data: payload.data,
//   });
// });

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.notification?.title || data.title || 'TRUSTFY';
  const options = {
    body: data.notification?.body || data.body || 'Nova atualização na sua operação',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    data: data.data || {},
    actions: [
      { action: 'open', title: 'Abrir' },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
