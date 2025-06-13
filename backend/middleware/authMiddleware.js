const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization"); // Expecting "Bearer TOKEN"
    
    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }
 

    try {
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET); // Decode the token
        req.user = decoded; // Add decoded user data to request object
        console.log('Decoded token:', decoded);
        next();

    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
};

module.exports = authMiddleware;

