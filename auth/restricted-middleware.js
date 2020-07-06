const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const { authorization } = req.headers;

  if (authorization) {
    secret = process.env.JWT_SECRET || "is it secret, is it safe?";

    jwt.verify(authorization, secret, function (err, decodedToken) {
      if (err) {
        res.status(401).json({ message: "Inavlid Token" });
      } else {
        req.token = decodedToken;
        next();
      }
    });
  } else {
    res.status(400).json({ message: "please login and try again!" });
  }
};
