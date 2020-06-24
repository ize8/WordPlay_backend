var jwt = require("jsonwebtoken");

exports.CORS = async (req, res, next) => {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  next();
};

exports.checkToken = async (req, res, next) => {
  const token = req.body.token;
  if (!token) {
    res.json({ error: "No token found! " });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = decoded;
    next();
  } catch (err) {
    res.json({ error: err });
    return;
  }
};
