<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Self-host the site’s production fonts and preload only critical above-the-fold faces to avoid third-party font latency.
- Keep showcase gesture ownership in ObserverShowcase, using stable stage geometry and separate wheel/finger directions, so mobile browser chrome and swipe momentum cannot skip panels.
- Restore missing bundled media through generated Lovable Assets pointers while preserving originals in external storage; do not change application database routing during media-only repairs.
- Keep the media copy catalog build-resolved and process copies in bounded batches; persist the URL map so retries reuse completed files without overwrites.
- Run replacement cleanup only after authorized saves succeed and all media references are read successfully; never delete shared files or branding originals.
- Put logo sharing metadata on leaf routes through the shared brand-media module, never on the root layout.
