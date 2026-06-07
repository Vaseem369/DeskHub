/**
 * CORS for json-server (GitHub Pages → Render, and live-server → :3001).
 * Loaded via: json-server ... --middlewares scripts/cors-middleware.cjs
 */
module.exports = (req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    "*"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,PUT,DELETE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
};
