# Product media and font performance

## Changes
- Make the first product gallery image eager, high-priority, and asynchronously decoded; leave later images lazy.
- Generate and bundle a lightweight hero poster from the existing entrance video, and pass it to the video element.
- Replace the global repeating scroll playback handler with a one-time passive listener while retaining autoplay recovery.
- Self-host the currently used Cormorant Garamond and Jost webfonts, define them locally with `font-display: swap`, and preload only the critical regular files.

## Validation
- Confirm product pages emit the intended image loading attributes.
- Confirm the homepage displays the poster before video playback and no external Google Fonts request remains.
- Check desktop and mobile rendering, browser errors, and the latest preview build result.
