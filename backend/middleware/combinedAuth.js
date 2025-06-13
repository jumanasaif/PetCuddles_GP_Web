// middleware/combinedAuth.js
const jwt = require("jsonwebtoken");

const combinedAuth = (req, res, next) => {
  const token = req.header("Authorization");
  
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    
    // Attach to request based on role
    if (decoded.role === 'admin') {
      req.admin = decoded;
    } else {
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = combinedAuth;
