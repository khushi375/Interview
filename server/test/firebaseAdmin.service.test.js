import assert from "node:assert/strict";
import test from "node:test";
import {
    createFirebaseTokenVerifier,
} from "../services/firebaseAdmin.service.js";

test("verifies the supplied Firebase token and checks revocation", async () => {
    const identity = {
        uid: "firebase-user-id",
        email: "candidate@example.com",
        email_verified: true,
    };
    let verificationArgs;
    const verifyToken = createFirebaseTokenVerifier({
        getAuth: async () => ({
            verifyIdToken: async (...args) => {
                verificationArgs = args;
                return identity;
            },
        }),
    });

    assert.equal(await verifyToken("firebase-id-token"), identity);
    assert.deepEqual(verificationArgs, ["firebase-id-token", true]);
});

test("rejects missing and expired Firebase tokens as unauthorized", async () => {
    let authLoaded = false;
    const verifyToken = createFirebaseTokenVerifier({
        getAuth: async () => {
            authLoaded = true;
            return {
                verifyIdToken: async () => {
                    throw { code: "auth/id-token-expired" };
                },
            };
        },
    });

    await assert.rejects(verifyToken(""), { statusCode: 401 });
    assert.equal(authLoaded, false);
    await assert.rejects(verifyToken("expired-token"), { statusCode: 401 });
});

test("reports Firebase verification outages without leaking SDK errors", async () => {
    const verifyToken = createFirebaseTokenVerifier({
        getAuth: async () => ({
            verifyIdToken: async () => {
                throw { code: "auth/internal-error", message: "private SDK details" };
            },
        }),
    });

    await assert.rejects(verifyToken("firebase-id-token"), {
        statusCode: 503,
        message: "Firebase token verification is temporarily unavailable.",
    });
});
