import jwt from "jsonwebtoken";


const isAuth = async (req, res, next) => {
    try {
        const { token } = req.cookies || {};

        if (!token) {
            return res.status(401).json({ message: "Authentication token is missing." });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing in environment.");
            return res.status(500).json({ message: "Server configuration error: JWT secret missing." });
        }

        let verifyToken;
        try {
            verifyToken = jwt.verify(token, process.env.JWT_SECRET);
        } catch (verifyError) {
            return res.status(401).json({ message: "Invalid or expired authentication token." });
        }

        if (!verifyToken || !verifyToken.userId) {
            return res.status(401).json({ message: "User does not have a valid token." });
        }

        req.userId = verifyToken.userId;
        next();
    } catch (error) {
        console.error("isAuth unexpected error:", error);
        return res.status(500).json({ message: `isAuth error ${error.message || error}` });
    }
}

export default isAuth;