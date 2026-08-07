# React client

The SPA for the Auth0 Express BFF sample. See the [root README](../README.md)
for the Auth0 setup and how the three processes fit together.

React 18 · TypeScript 5.5 · Vite 5 · React Router 6 · reactstrap + Bootstrap 5

```bash
npm install
npm run dev
```

Runs on **http://localhost:5173** and opens a browser automatically
(`server.open` is on). The BFF at :3000 must be running for anything
authentication-related to work.

| Script            | What it does               |
| ----------------- | -------------------------- |
| `npm run dev`     | Vite dev server            |
| `npm run build`   | `tsc -b` then `vite build` |
| `npm run lint`    | ESLint                     |
| `npm run preview` | Serve the production build |

## Proxy

`vite.config.ts` forwards two prefixes to the BFF with `changeOrigin: true`:

| Prefix  | Target                  |
| ------- | ----------------------- |
| `/api`  | `http://localhost:3000` |
| `/auth` | `http://localhost:3000` |

Everything in the app calls relative paths, so the session cookie is sent as
same-origin and no CORS setup is involved.

## Structure

```
src/
  App.tsx                  BrowserRouter and the route table
  context/AuthContext.tsx  AuthProvider — auth state, login, logout
  context/useAuth.ts       Consumer hook
  pages/
    Layout.tsx             NavMenu + content container
    NavMenu.tsx            Navbar; swaps Login/Logout on auth state
    Home.tsx
    FetchData.tsx          Weather table from /api/weatherforecast
    User.tsx               Claims from /auth/profile
    NotFound.tsx
```

## Auth handling

`AuthProvider` fetches `/auth/profile` once on mount. That route is guarded on
the BFF, so an anonymous visitor gets a 401 and the app renders as logged out.

`login()` and `logout()` set `window.location.href` to `/auth/login` and
`/auth/logout`. They are deliberately full-page navigations rather than router
transitions — the browser has to follow the redirect chain out to Auth0 and
back, which a client-side route change can't do.

Route guarding is done inline in `App.tsx`: `/fetch-data` and `/user` render
their page when `isAuthenticated`, and otherwise render a component that calls
`login()` and returns `null`.

`FetchData` also redirects to `/auth/login` if the API call comes back 401,
which covers the case where the session expires while the app is open. It does
not handle other error statuses — the view stays on "Loading..." if one occurs.
