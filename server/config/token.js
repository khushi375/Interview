import jwt from "jsonwebtoken"

const genToken = async (userId) => {
    const secret = process.env.JWT_SECRET;
    if (!secret?.trim()) {
        const error = new Error("JWT_SECRET is missing from the server environment.");
        error.code = "JWT_SECRET_MISSING";
        throw error;
    }

    return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}
 export default genToken;