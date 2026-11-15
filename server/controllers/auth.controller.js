import User from "../models/user.model.js";
import genToken from "../config/token.js";
import { FirebaseAuthError, verifyFirebaseIdToken } from "../services/firebaseAdmin.service.js";

class AccountConflictError extends Error {
    constructor() {
        super("This account is linked to a different Google identity.");
        this.name = "AccountConflictError";
        this.statusCode = 409;
    }
}

export const getSessionCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    };
};

const findUser = async (UserModel, criteria) => {
    let query = UserModel.findOne(criteria);
    if (typeof query?.select === "function") {
        query = query.select("+firebaseUid");
    }
    return query;
};

const findUserByEmail = async (UserModel, email) => {
    const exactMatch = await findUser(UserModel, { email });
    if (exactMatch) {
        return exactMatch;
    }

    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return findUser(UserModel, { email: new RegExp(`^${escapedEmail}$`, "i") });
};

const applyVerifiedIdentity = async (user, firebaseUid, email, name) => {
    if (user.firebaseUid && user.firebaseUid !== firebaseUid) {
        throw new AccountConflictError();
    }

    user.firebaseUid = firebaseUid;
    user.email = email;
    if (name) {
        user.name = name;
    }
    await user.save();
    return user;
};

const findOrCreateUser = async (UserModel, { firebaseUid, email, name }) => {
    let user = await findUser(UserModel, { firebaseUid });

    if (user) {
        const emailOwner = await findUserByEmail(UserModel, email);
        if (emailOwner && String(emailOwner._id) !== String(user._id)) {
            throw new AccountConflictError();
        }
        if (user.email !== email || (name && user.name !== name)) {
            user.email = email;
            if (name) {
                user.name = name;
            }
            await user.save();
        }
        return user;
    }

    user = await findUserByEmail(UserModel, email);
    if (user) {
        return applyVerifiedIdentity(user, firebaseUid, email, name);
    }

    try {
        return await UserModel.create({ firebaseUid, email, name });
    } catch (error) {
        if (error?.code !== 11000) {
            throw error;
        }

        const matchingUid = await findUser(UserModel, { firebaseUid });
        if (matchingUid?.email === email) {
            return matchingUid;
        }

        const matchingEmail = await findUserByEmail(UserModel, email);
        if (matchingEmail && !matchingEmail.firebaseUid) {
            return applyVerifiedIdentity(matchingEmail, firebaseUid, email, name);
        }
        throw new AccountConflictError();
    }
};

const publicUser = (user) => {
    const result = typeof user.toObject === "function" ? user.toObject() : { ...user };
    delete result.firebaseUid;
    return result;
};

export const createGoogleAuthHandler = ({
    UserModel = User,
    verifyToken = verifyFirebaseIdToken,
    issueToken = genToken,
} = {}) => async (req, res) => {
    const idToken = req.body?.idToken;
    if (typeof idToken !== "string" || !idToken.trim()) {
        return res.status(401).json({ message: "Google sign-in could not be verified. Please sign in again." });
    }

    try {
        const identity = await verifyToken(idToken);
        const firebaseUid = identity?.uid;
        const email = typeof identity?.email === "string" ? identity.email.trim().toLowerCase() : "";
        const name = typeof identity?.name === "string" ? identity.name.trim() : "";

        if (!firebaseUid || !email || identity.email_verified !== true) {
            return res.status(401).json({ message: "Google sign-in could not be verified. Please sign in again." });
        }

        const user = await findOrCreateUser(UserModel, {
            firebaseUid,
            email,
            name: name || email.split("@")[0],
        });
        const token = await issueToken(user._id);
        if (typeof token !== "string" || !token) {
            throw new Error("JWT creation returned an invalid session token.");
        }

        res.cookie("token", token, getSessionCookieOptions());
        return res.status(200).json(publicUser(user));
    } catch (error) {
        if (error instanceof FirebaseAuthError && error.statusCode === 401) {
            return res.status(401).json({ message: "Google sign-in could not be verified. Please sign in again." });
        }
        if (error instanceof AccountConflictError) {
            return res.status(409).json({ message: error.message });
        }

        const code = error?.code || "unknown";
        console.error("Google authentication failed.", {
            code,
            errorName: error?.name || "Error",
        });
        const statusCode = error instanceof FirebaseAuthError ? error.statusCode : 500;
        return res.status(statusCode).json({
            message: statusCode === 503
                ? "Google sign-in is temporarily unavailable. Please try again."
                : "Google sign-in could not be completed. Please try again.",
        });
    }
};

export const googleAuth = createGoogleAuthHandler();

export const logout = async (req, res) => {
    try {
        const cookieOptions = getSessionCookieOptions();
        delete cookieOptions.maxAge;
        res.clearCookie("token", cookieOptions);
        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.error("Logout failed.", {
            code: error?.code || "unknown",
            errorName: error?.name || "Error",
        });
        return res.status(500).json({ message: "Logout could not be completed." });
    }
};
