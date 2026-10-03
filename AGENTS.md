# Project architecture rules

- Preserve existing routes, API contracts, hooks, and TV/D-pad attributes during visual work because the deployed interaction layer is already mature.
- Build visual changes through semantic CSS tokens and existing presentation components so the theme remains consistent without duplicating behavior.
- Source home featured artwork from the existing trending response's `backdrop_path` and keep its slide state local to the home view, so no API or route changes are required.