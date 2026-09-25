export const sendNativeNotification = (title, body) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        vibrate: [200, 100, 200],
        tag: 'd-chat-message'
      });
    });
  } else {
    new Notification(title, { body, icon: '/icon.svg' });
  }
};
