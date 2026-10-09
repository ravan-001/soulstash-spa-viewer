# Project architecture rules

- Preserve existing routes, API contracts, hooks, and TV/D-pad attributes during visual work because the deployed interaction layer is already mature.
- Build visual changes through semantic CSS tokens and existing presentation components so the theme remains consistent without duplicating behavior.
- Keep detail artwork and fade styling owned by DetailHero and semantic global CSS, with route-exit cleanup, so movie/series backgrounds cannot leak onto other pages.