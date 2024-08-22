const express = require("express");
const { auth, requiresAuth } = require("express-openid-connect");
const dotenv = require('dotenv');
const app = express();

dotenv.config();

const config = {
  authRequired: process.env.AUTH_REQUIRED,
  auth0Logout: process.env.AUTH0_LOGOUT,
  baseURL: process.env.BASE_URL,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
  secret: process.env.SECRET,
  // routes:{login: '/auth/login', callback: '/auth/callback', logout: '/auth/logout'}
};


console.log({config});

// The `auth` router attaches /login, /logout
// and /callback routes to the baseURL
// app.use(auth(config));

app.use(
  auth({
    ...config,
    routes: {
      // Override the default login route to use your own login route as shown below
      login: false,
      // Pass a custom path to redirect users to a different
      // path after logout.
      postLogoutRedirect: "/custom--redirect-logout",
      
      logout: false,

      // Override the default callback route to use your own callback route as shown below
    },
  })
);

app.get("/auth/login", async (req, res) => {
  //  res.setHeader("Origin","http://localhost:3000")
  // req.headers.origin = "http://localhost:3000";
  // req.headers.referer = "http://localhost:3000";
  // req.headers["sec-fetch-site"] = "same-origin";
  return await res.oidc.login({
    returnTo: "http://localhost:5173",
    authorizationParams: {
      redirect_uri: "http://localhost:3000/auth/callback",
    },
  });
});

app.get("/auth/logout", (req, res) => {
  // req.headers.origin = "http://localhost:3000";
  // req.headers.referer = "http://localhost:3000";
  // req.headers["sec-fetch-site"] = "same-origin";
  res.oidc.logout({
    returnTo: "http://localhost:3000",
  });
});

app.get("/custom-logout", (req, res) => res.send("Bye!"));

app.get(
  "/auth/callback",
  async (req, res) =>
    await res.oidc.callback({
      redirectUri: "http://localhost:3000/auth/callback",
    })
);

app.post(
  "/auth/callback",
  express.urlencoded({ extended: false }),
  async (req, res) =>
    await res.oidc.callback({
      redirectUri: "http://localhost:3000/auth/callback",
    })
);

// req.oidc.isAuthenticated is provided from the auth router
app.get("/", (req, res) => {
  // res.send(req.oidc.isAuthenticated() ? "Logged in" : "Logged out");
  res.redirect("http://localhost:5173/");
});

// The /profile route will show the user profile as JSON
app.get(
  "/api/profile",
  requiresAuth((req) => {
    // req.headers.origin = "http://localhost:3000";
    // req.headers.referer = "http://localhost:3000";
    req.headers["sec-fetch-site"] = "same-origin";
  }),
  (req, res) => {
    let data = { isAuthenticated: req.oidc.isAuthenticated() };
    console.log(data);
    if (req.oidc.isAuthenticated()) {
      data = {
        ...data,
        claims: [
          { type: "sid", value: req.oidc.user.sid },
          { type: "sub", value: req.oidc.user.sub },
        ],
      };
    }
    res.send(JSON.stringify(data, null, 2));
  }
);

app.get("/api/test", (req, res) => {
  res.send(JSON.stringify({ message: "okay" }, null, 2));
});



const summaries = [
  "Freezing", "Bracing", "Chilly", "Cool", "Mild",
  "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
];


app.get('/api/weatherforecast', async(req, res) => {
  const data = await fetch("http://localhost:3002/api/weatherforecast");
  console.log(data);
  res.send(await data.json());
});


app.listen(3000, function () {
  console.log("Listening on http://localhost:3000");
});
