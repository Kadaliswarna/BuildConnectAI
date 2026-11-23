# BuildConnectAI

## BuildConnect AI (React + Tailwind + Firebase)

React + TypeScript construction marketplace and project dashboard. Includes role-based Firebase sign-in,
builder and worker directories, worker bookings and chat, construction tracking, cost planning, material quote
comparison, safety issue reporting, project messaging, and browser-based voice navigation.

## Run
```bash
npm install
cp .env.example .env.local   # fill in your Firebase web-app config
npm run dev
```
Without `.env.local` the UI still loads using demo listings; accounts, bookings and chat need Firebase.

## Firebase setup
1. Create a project; enable **Authentication → Email/Password** and **Firestore**.
2. Register a Web app and copy its config into `.env.local`.
3. Deploy rules: `npx firebase-tools deploy --only firestore:rules`.
4. To upload project photos, configure the Storage bucket and deploy both sets of rules:
   `npx firebase-tools deploy --only firestore:rules,storage`.
5. Optional: add builder/worker documents to the `builders` / `workers` collections (shapes in `src/types.ts`).
   While those collections are empty the app shows the bundled demo data.

## Added project modules
- Customers can create projects, assign a registered builder, track 12 stages, maintain tasks and expenses,
  read daily reports, view site photos and message the assigned builder. Builders can update stages, reports,
  expenses and photos. Firestore rules restrict project access to the customer and assigned builder.
- In the absence of Firebase, projects and issue reports are local browser demos. Demo data does not sync
  between users or devices. Do not use this mode for private production data.
- The cost estimator uses editable illustrative unit rates, not live prices. Users can export a CSV or print
  the estimate to PDF. Verify every rate and quantity with local suppliers and an engineer.
- Material price comparison records quotes entered by the user. No supplier feed or price verification is
  connected. Quantity guidance is only for early planning.
- Voice input uses the browser Web Speech API where available. It performs a small set of navigation commands;
  there is no AI service or speech backend.
- Emergency support presents India’s integrated emergency number 112. Issue reports are not an emergency channel.

## Production setup and remaining integrations
- Add the Firebase web-app values to `.env.local`, enable Email/Password Authentication, create Firestore and
  Storage, then deploy `firestore.rules` and `storage.rules`. Rules have not been verified in the Firebase
  emulator in this workspace; test them before using real customer data.
- Push notifications, email/SMS alerts, AI conversation, live supplier price feeds, payment processing,
  builder quotation/review workflows, and server-side report generation are not connected. Browser speech
  assistance is limited to the navigation commands documented in the UI.
- The current estimator is a transparent deterministic calculator. Its adjustable defaults are illustrative;
  it is not an AI estimate or substitute for a structural design and local quotations.

## Data model
| Path | Who reads | Who writes |
|---|---|---|
| `users/{uid}` | that user | that user (role immutable) |
| `workers/{uid}`, `builders/{uid}` | everyone | the owner (workers cannot set their rating) |
| `bookings/{id}` | its customer and worker | customer creates; worker changes `status` only |
| `chats/{bookingId}/messages/{id}` | the booking's two parties | the two parties |
| `projects/{id}` | customer and assigned builder | customer creates; customer edits basics/tasks; assigned builder updates progress/tasks/expenses |
| `projectChats/{projectId}/messages/{id}` | project customer and builder | project customer and builder |
| `issueReports/{id}` | reporting user | signed-in user creates their own report |

Project site photos are uploaded to Firebase Storage at `projects/{projectId}/{fileName}`. `storage.rules`
limits uploads to assigned project builders, images, and files below 5 MiB. Deploy these rules before enabling
photo uploads in a Firebase-backed deployment.

## Notes
- Demo workers (`w1`…`w10`) are not real accounts, so bookings made to them never receive a reply. Register a Worker account in a second browser to test accept/decline and chat end to end.
- `firestore.rules` has not been run against the emulator (it cannot be downloaded in the build sandbox). Test it in the Rules Playground or with `firebase emulators:start` before launch.
