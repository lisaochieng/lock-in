# lock in

**lock in** is a calming study-session web app. Pick a peaceful study space, start a Pomodoro timer, track your tasks and goals, watch your progress build up, and study alongside friends in a shared room — all with gentle YouTube ambience in the background.

## Getting started

```bash
npm install
npm run dev
```

Then open the local URL it prints (usually `http://localhost:5173`). That's it — everything saves automatically in your browser, so your tasks, goals, and progress are waiting for you next time.

## How to use lock in

### Pick your study space
Open the side menu and browse the space library. Search by name or filter by mood — rain, night, cafe, nature, and more. Click any space to make it your backdrop.

### Turn on the ambience
Hit **play ambience** (or the play button up top) to swap the still image for a calming YouTube scene with sound. Want your own vibe? Paste any YouTube link into the dock at the bottom and press **play**.

### Start a focus session
Use the timer widget to run a Pomodoro. Switch between **focus**, **break**, and **long** modes, then press start. When a focus session finishes, your minutes, sessions, and streak update on their own.

### Track tasks and goals
- Add study tasks in the tasks widget, check them off, edit them, or delete them.
- Set your focus length, break length, and daily/weekly minute goals in **goal tracking**.
- Watch the progress widget for your focus minutes, streak, task completion, and a 7-day chart.

### Study with friends
Name your room in the room widget and tap **copy invite** to share the link. Anyone who opens it lands in the same room.

### Plan ahead
In the **calendar** panel, pick Google, Yahoo, Outlook, or ICS and add your next session straight to your calendar.

### Make an account
Head to **profile** to sign in with email or continue with Google, so your space feels like yours.

## Tips
- Drag any widget by its handle to arrange the screen the way you like.
- Your layout, tasks, goals, and stats are remembered automatically between visits.
- Everything is lowercase on purpose — keep it calm.

## Deploying your own copy

```bash
npm run build
```

Deploy the generated `dist` folder to any static host (Vercel, Netlify, or Cloudflare Pages). If you connect the repo directly, use:

- Build command: `npm run build`
- Publish directory: `dist`
