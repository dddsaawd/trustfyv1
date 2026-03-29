importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBnkoijQcoHqn7rH-07FqZXutD0N_9qmmQ",
  authDomain: "trustfy-5f02f.firebaseapp.com",
  projectId: "trustfy-5f02f",
  storageBucket: "trustfy-5f02f.firebasestorage.app",
  messagingSenderId: "194082251272",
  appId: "1:194082251272:web:e6b025453e3daf563627bd",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'TRUSTFY', {
    body: body || 'Nova atualização',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: payload.data,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
