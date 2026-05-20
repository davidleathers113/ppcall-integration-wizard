# src/components/layout/

App chrome: sidebar navigation and outer frame.

## Contents

- `Sidebar.tsx` — Primary nav. Each entry maps to a `currentView` string consumed by `App.tsx`.

## Conventions

- **No react-router.** Navigation is a single `currentView` string in `App.tsx`; the sidebar dispatches view changes via the `onNavigate` prop (or similar). Don't add `<Link>` / `<NavLink>` here.
- **One source of truth for view keys** — they're declared in `App.tsx`. If you add a new view, update the union there first, then add the sidebar entry, so TypeScript catches typos.
- Keep this directory small. Header / footer / breadcrumbs, when they come, live here. Reusable primitives (buttons, badges) belong in `shared/`.
