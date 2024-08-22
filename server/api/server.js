const express = require("express");
const { auth } = require('express-oauth2-jwt-bearer');
const { requiredScopes } = require('express-oauth2-jwt-bearer');
const dotenv = require('dotenv');
const app = express();

// Authorization middleware. When used, the Access Token must
// exist and be verified against the Auth0 JSON Web Key Set.
const checkJwt = auth({
  audience: 'https://weatherforecast',
  issuerBaseURL: `https://dev-m3jk3em3.us.auth0.com/`,
});

const checkScopes = requiredScopes('read:weather');

dotenv.config();
app.use((req, res, next) => {
  //  res.setHeader("Origin","http://localhost:3000")
  // req.headers.origin = "http://localhost:3000";
  // req.headers.referer = "http://localhost:3000";
  // req.headers["sec-fetch-site"] = "same-origin";
  next();
});


const summaries = [
  "Freezing", "Bracing", "Chilly", "Cool", "Mild",
  "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
];

function getWeatherForecast() {
  const rng = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  return Array.from({ length: 5 }, (_, index) => {
    return {
      date: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Date in YYYY-MM-DD format
      temperatureC: rng(-20, 55),
      summary: summaries[rng(0, summaries.length - 1)]
    };
  });
}

app.get('/api/weatherforecast', checkJwt, checkScopes, (req, res) => {
  res.json(getWeatherForecast());
});

app.listen(3002, function () {
  console.log("Listening on http://localhost:3002");
});
