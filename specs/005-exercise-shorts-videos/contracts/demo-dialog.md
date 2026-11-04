# Contract: Demo dialog (in-page video window)

## Trigger

- A "Watch demo" button on each session-plan row whose exercise has a non-null `demo`.
- Accessible name: `Watch demo: <exercise name>`.
- Rows with `demo: null` show no control (spec FR-001).

## Dialog

- Native `<dialog>` opened with `showModal()`, `aria-labelledby` pointing at its heading, which shows the exercise name.
- Iframe `src`: `https://www.youtube-nocookie.com/embed/<videoId>?autoplay=1&playsinline=1&rel=0&modestbranding=1`.
- The iframe is created on open and removed on close. No request to the video host happens before open (FR-004).

## Closing

Closes on: the close button, a click on the backdrop, the Escape key, and the browser Back action. Each close stops playback (the iframe is removed) and returns focus to the button that opened it (FR-003).

The Back action is handled by the "Watch demo" button, not the window. Opening the window adds one history entry; closing by any route removes it again, so the address and history match what they were before the window opened.

## Loading and failure

- The status reads "Loading the demo" until the player reports that it is ready.
- Ready is the player's `onReady` message. Failure is its `onError` message, for example code 152 or 153 when a video cannot play in an embed. Both are accepted only when they come from the embed origin and from this window's own frame.
- The embed URL includes `enablejsapi=1` so that the player sends these messages.
- If neither message arrives within 10 seconds, the window shows "This demo could not load." and the frame is removed (FR-008).
- "Open on YouTube" is always shown below the window (`https://www.youtube.com/shorts/<videoId>`, `target="_blank"`, `rel="noopener noreferrer"`), so a video the player refuses still leaves a way to YouTube.

## Accessibility

- Focus moves into the dialog on open and stays there while it is open.
- The close button and every control are reachable by keyboard.
- The dialog heading names the exercise for screen readers (FR-009).

## Navigation

The page URL does not change while the dialog is open or after it closes (SC-001).
