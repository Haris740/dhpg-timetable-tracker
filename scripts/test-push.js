const webpush = require('web-push');
const path = require('path');
require('dotenv').config();

const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error('Error: VAPID keys not found in .env file.');
  process.exit(1);
}

webpush.setVapidDetails(
  'mailto:example@yourdomain.org',
  vapidPublicKey,
  vapidPrivateKey
);

const subscriptionStr = process.argv[2];

if (!subscriptionStr) {
  console.error('Error: Please provide the subscription JSON string as an argument.');
  console.log('Usage: node scripts/test-push.js \'<subscription_json>\'');
  process.exit(1);
}

const pushSubscription = JSON.parse(subscriptionStr);

const payload = JSON.stringify({
  title: 'Test Notification',
  body: 'This is a test push notification from your Timetable Pro PWA!',
  url: '/'
});

webpush.sendNotification(pushSubscription, payload)
  .then(response => {
    console.log('Push notification sent successfully!');
    console.log('Status Code:', response.statusCode);
  })
  .catch(error => {
    console.error('Error sending push notification:', error);
  });
