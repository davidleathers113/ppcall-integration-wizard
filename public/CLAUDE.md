# public/

Static assets served as-is by Vite at the site root.

## Contents

- `favicon.svg` — Browser tab icon.
- `icons.svg` — SVG sprite sheet referenced by `<use href="/icons.svg#name">`. Add new icons here rather than inline in components, so they can be cached and reused.

## Conventions

- Anything in this directory is publicly accessible — do not put secrets, internal docs, or unminified source maps here.
- Prefer SVG over PNG/JPG; this app is icon- and illustration-light.
- Reference assets with absolute paths (`/icons.svg`), not relative — Vite copies the contents of `public/` to the build root.
