const INVALID_TOKEN_CODES = new Set([
    "auth/argument-error",
    "auth/id-token-expired",
    "auth/id-token-revoked",
    "auth/invalid-id-token",
    "auth/user-disabled",
    "auth/user-not-found",
]);

export class FirebaseAuthError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.name = "FirebaseAuthError";
        this.statusCode = statusCode;
        this.code = code;
    }
}

const getFirebaseAdminAuth = async () => {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

    if (!projectId || !clientEmail || !privateKey) {
        throw new FirebaseAuthError(
            "Firebase Admin credentials are not configured.",
            500,
            "firebase-admin-not-configured"
        );
    }

    try {
        const [{ cert, getApps, initializeApp }, { getAuth }] = await Promise.all([
            import("firebase-admin/app"),
            import("firebase-admin/auth"),
        ]);
        const appName = "interviewiq";
        const app = getApps().find(existingApp => existingApp.name === appName) ||
            initializeApp({
                credential: cert({ projectId, clientEmail, privateKey }),
                projectId,
            }, appName);

        return getAuth(app);
    } catch {
        throw new FirebaseAuthError(
            "Firebase Admin could not be initialized.",
            500,
            "firebase-admin-initialization-failed"
        );
    }
};

export const createFirebaseTokenVerifier = ({ getAuth = getFirebaseAdminAuth } = {}) =>
    async (idToken) => {
        if (typeof idToken !== "string" || !idToken.trim()) {
            throw new FirebaseAuthError(
                "A Firebase ID token is required.",
                401,
                "firebase-token-missing"
            );
        }

        let auth;
        try {
            auth = await getAuth();
        } catch (error) {
            if (error instanceof FirebaseAuthError) {
                throw error;
            }
            throw new FirebaseAuthError(
                "Firebase Admin could not be initialized.",
                500,
                "firebase-admin-initialization-failed"
            );
        }

        try {
            return await auth.verifyIdToken(idToken.trim(), true);
        } catch (error) {
            if (INVALID_TOKEN_CODES.has(error?.code)) {
                throw new FirebaseAuthError(
                    "Firebase ID token is invalid or expired.",
                    401,
                    "firebase-token-invalid"
                );
            }
            throw new FirebaseAuthError(
                "Firebase token verification is temporarily unavailable.",
                503,
                "firebase-verification-unavailable"
            );
        }
    };

export const verifyFirebaseIdToken = createFirebaseTokenVerifier();
