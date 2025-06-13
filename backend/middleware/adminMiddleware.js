// adminMiddleware.js
const jwt = require("jsonwebtoken");

const adminMiddleware = (req, res, next) => {
    const token = req.header("Authorization"); // Expecting "Bearer TOKEN"
    
    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        
        // Check if user is admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: "Admin privileges required" });
        }
        
        // Add additional checks if needed (e.g., email matches admin email)
        if (decoded.email !== 'admin@vetconnect.com') {
            return res.status(403).json({ message: "Invalid admin credentials" });
        }
        
        req.admin = decoded; // Attach admin data to request
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
};

module.exports = adminMiddleware;
