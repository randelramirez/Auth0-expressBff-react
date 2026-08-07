# Auth0 Express BFF React sample

Three processes demonstrating the Backend-for-Frontend pattern with Auth0: the
browser holds only a session cookie, the BFF holds the tokens, and the resource
API never talks to the SPA directly.

| Component     | Directory     | Port | Stack                                     |
| ------------- | ------------- | ---- | ----------------------------------------- |
| React client  | `client/`     | 5173 | React 18, Vite 5, TypeScript, reactstrap   |
| BFF           | `server/bff/` | 3000 | Express 4 + `express-openid-connect`       |
| Weather API   | `server/api/` | 3002 | Express 4 + `express-oauth2-jwt-bearer`    |

Request flow:

```
browser → (Vite proxy /auth, /api) → BFF :3000 → Bearer token → API :3002
```

The SPA only ever calls same-origin relative paths. Vite proxies `/auth` and
`/api` to the BFF with `changeOrigin: true`. The BFF attaches
`req.oidc.accessToken` as an `Authorization` header when forwarding to the API.

## Auth0 setup

You need a Regular Web Application (the BFF is confidential — it uses the
authorization code flow with a client secret) and an API.

**Application settings**

| Setting                     | Value                                  |
| --------------------------- | -------------------------------------- |
| Allowed Callback URLs       | `http://localhost:3000/auth/callback`  |
| Allowed Logout URLs         | `http://localhost:3000`                |

**API settings**

| Setting     | Value                     |
| ----------- | ------------------------- |
| Identifier  | `https://weatherforecast` |
| Permission  | `read:weather`            |

The BFF requests `openid offline_access read:weather` against the
`https://weatherforecast` audience, so make sure that scope exists on the API
and is granted to the application.

## Configure

Copy `server/bff/.env.template` to `server/bff/.env` and fill it in:

| Variable           | Value                                                     |
| ------------------ | --------------------------------------------------------- |
| `BASE_URL`         | `http://localhost:3000`                                    |
| `CLIENT_ID`        | The Auth0 application's client id                          |
| `ISSUER_BASE_URL`  | `https://<your-tenant>.us.auth0.com`                       |
| `SECRET`           | The Auth0 application's client secret                      |
| `AUTH_REQUIRED`    | `false`                                                    |
| `AUTH0_LOGOUT`     | `true`                                                     |

`server/api/.env.template` also exists, but it is a copy of the BFF's template
and the API reads none of those variables — its audience
(`https://weatherforecast`) and issuer (`https://dev-m3jk3em3.us.auth0.com/`)
are hardcoded in `server/api/server.js`. **Change the issuer there to your own
tenant**, or the API will validate tokens against someone else's.

## Run

Three terminals:

```powershell
Set-Location .\server\api
npm install
npm run dev

Set-Location .\server\bff
npm install
npm run dev

Set-Location .\client
npm install
npm run dev
```

`npm run dev` uses nodemon in the two server directories; `npm start` runs them
without it. The client also has `npm run build`, `npm run lint`, and
`npm run preview`. Vite has `open: true`, so it launches a browser for you.

Start the API before the BFF if you want the first weather call to succeed.

## BFF routes

`express-openid-connect` is mounted with its own `login` and `logout` routes
disabled (`routes: { login: false, logout: false }`) so the app can define them
under an `/auth` prefix that the Vite proxy forwards.

| Method     | Route                    | Auth | Behaviour                                                    |
| ---------- | ------------------------ | ---- | ------------------------------------------------------------ |
| GET        | `/auth/login`            | No   | `res.oidc.login()` with `returnTo` the client at :5173         |
| GET        | `/auth/logout`           | Yes  | `res.oidc.logout()` with `returnTo` :3000                      |
| GET / POST | `/auth/callback`         | No   | `res.oidc.callback()`; POST also parses urlencoded bodies      |
| GET        | `/auth/profile`          | Yes  | `{ isAuthenticated, claims: [sid, sub] }`                      |
| GET        | `/api/weatherforecast`   | Yes  | Forwards to the API with the access token                      |
| GET        | `/api/test`              | No   | `{ "message": "okay" }`                                        |
| GET        | `/`                      | No   | Redirects to the client at :5173                               |
| GET        | `/custom-logout`         | No   | Sends "Bye!"                                                   |

`requiresAuth()` guards the routes marked Yes — unauthenticated requests get a
401, which is what the client's `FetchData` watches for to trigger a login.

`/auth/profile` deliberately returns only `sid` and `sub` rather than the full
profile — the point of the pattern is that the SPA gets no tokens and no more
identity data than it needs.

## Client

```
src/
  App.tsx                 BrowserRouter and the route table
  context/AuthContext.tsx AuthProvider — fetches /auth/profile on mount
  context/useAuth.ts      Consumer hook
  pages/
    Layout.tsx            Wraps NavMenu + a Container
    NavMenu.tsx           reactstrap navbar; Login/Logout swap on auth state
    Home.tsx
    FetchData.tsx         Weather table from /api/weatherforecast
    User.tsx              Renders the claims from /auth/profile
    NotFound.tsx
```

| Route         | Behaviour                                                    |
| ------------- | ------------------------------------------------------------ |
| `/`           | `Home`                                                        |
| `/fetch-data` | `FetchData` when authenticated, otherwise calls `login()`      |
| `/user`       | `User` when authenticated, otherwise calls `login()`           |
| `/login`      | Redirects to `/`                                               |
| `/logout`     | Calls `logout()`                                               |
| `*`           | `NotFound`                                                     |

`login()` and `logout()` are full-page navigations (`window.location.href`), not
React Router transitions — they have to leave the SPA so the browser follows the
redirect chain to Auth0 and back.

`AuthProvider` calls `/auth/profile` once on mount to establish auth state.
Because `requiresAuth()` guards that route, an anonymous visitor gets a 401 and
the provider leaves `isAuthenticated` undefined, which renders as logged out.

## Rough edges

This is a sample, and a few things are half-finished:

- **The BFF swallows API errors.** In `/api/weatherforecast`, the `catch` block
  only `console.log`s. Nothing is sent back, so if the API is down or rejects the
  token the client request hangs until it times out rather than failing cleanly.
- **`postLogoutRedirect` points at a route that doesn't exist**
  (`/custom--redirect-logout`, with two hyphens; the defined route is
  `/custom-logout`). It doesn't bite in practice, because the `/auth/logout`
  handler passes an explicit `returnTo` that takes precedence.
- **`cors`, `helmet`, and `nocache` are dependencies in both servers but are
  never required or mounted.** CORS isn't needed anyway, since everything goes
  through the Vite proxy as same-origin.
- The `summaries` array in `server/bff/server.js` is dead — the real one lives in
  the API.
- `FetchData` leaves `loading` true on a non-200, non-401 response, so the page
  stays on "Loading..." forever.
