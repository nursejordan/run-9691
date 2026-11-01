# Memory Pocket progress
Approved: web app, calm design, capture/search/Today, Google + email auth, database persistence, AI on demand, export/delete.
Architecture: protected oRPC memory procedures, Better Auth, Turso notes + followups, AI gateway nano model. Preview workspace includes labeled example notes and browser-only demo edits. Real workspace requires sign-in.
Next: auth/schema, API, UI, build, browser/API verification, deliver.

Completed:
- Calm responsive Remember / Find / Today UI, keyboard dictation guidance, labeled browser-only demo.
- Better Auth Google managed + email/password; email signup/sign-in session flow tested in browser. Google integration wired but external provider round trip not tested.
- User-scoped Turso notes and follow-ups, edit/delete/export. Query caches scoped by user.
- On-demand AI summaries (cached) and cited memory retrieval; real gateway calls verified. Retrieval capped to 30 candidate notes/40k characters and acknowledges incomplete evidence. Per-process hourly burst guard, not a billing cap.
- Native modal focus management and Escape, mobile navigation, improved readable copy.
Verification: lint zero errors, production build passed. Browser tests passed demo capture/search/tasks, real signup/save/reload/edit/delete/export/signout; no JS errors or mobile overflow. API tests passed anonymous denial, cross-account isolation, summary, source citations, task status, summary invalidation and linked-task delete.
Dev server: tmux memory-pocket, web port 4200.
Limitations: cloud storage not E2E; no audio recording, document uploads, notifications, offline sync, password reset or archive-scale semantic index. Three empty verification accounts remain, all test notes deleted. Google needs user-side round-trip testing.
