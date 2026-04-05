# Dev Progress Tracker

## Push Notifications (FCM)

This project is configured for Firebase Cloud Messaging token registration and backend-driven reminder scheduling so notifications can arrive when the app is closed.

### 1) Configure environment

Copy `.env.example` to `.env` and fill Firebase web app + VAPID values:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_VAPID_KEY`
- `VITE_REMINDER_API_BASE_URL` (backend URL)

### 2) Service worker

`public/firebase-messaging-sw.js` handles `push` and `notificationclick` events and displays notifications in the background.

### 3) Backend requirements

You must provide backend endpoints:

- `POST /api/push/token` to save an FCM token
- `POST /api/reminders/schedule` to schedule reminders and trigger FCM send at reminder time

Expected schedule payload:

```json
{
  "token": "<FCM_TOKEN>",
  "taskId": "<TASK_ID>",
  "title": "Task title",
  "date": "2026-04-06",
  "startTime": "14:00",
  "reminders": [
    { "minutesBeforeStart": 15, "triggerAt": "2026-04-06T13:45:00.000Z" }
  ]
}
```

### 4) Run

```bash
npm install
npm run dev
```

### Notes

- Frontend no longer relies on `setTimeout` for reminder delivery.
- Closed-app delivery requires backend scheduling + FCM send.
- On iOS, push requires PWA install and iOS/web push support conditions.
