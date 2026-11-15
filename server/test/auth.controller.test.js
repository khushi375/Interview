import assert from "node:assert/strict";
import test from "node:test";
import {
    createGoogleAuthHandler,
    getSessionCookieOptions,
} from "../controllers/auth.controller.js";

const makeUser = (fields) => ({
    ...fields,
    save: async function save() {
        return this;
    },
    toObject() {
        const { save, toObject, ...publicFields } = this;
        return publicFields;
    },
});

const makeUserModel = (initialUsers = []) => {
    const users = initialUsers;
    return {
        users,
        findOne(criteria) {
            const user = users.find(candidate =>
                Object.entries(criteria).every(([key, value]) =>
                    value instanceof RegExp ? value.test(candidate[key]) : candidate[key] === value
                )
            );
            return { select: async () => user || null };
        },
        async create(fields) {
            if (users.some(user =>
                user.email === fields.email || user.firebaseUid === fields.firebaseUid
            )) {
                throw Object.assign(new Error("Duplicate key"), { code: 11000 });
            }
            const user = makeUser({ ...fields, _id: `user-${users.length + 1}`, credits: 500 });
            users.push(user);
            return user;
        },
    };
};

const makeResponse = () => ({
    cookies: [],
    statusCode: 200,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    },
    cookie(...args) {
        this.cookies.push(args);
        return this;
    },
});

test("creates a user only from verified Firebase claims and sets the session cookie", async () => {
    const UserModel = makeUserModel();
    const response = makeResponse();
    const handler = createGoogleAuthHandler({
        UserModel,
        verifyToken: async idToken => {
            assert.equal(idToken, "firebase-id-token");
            return {
                uid: "firebase-uid",
                email: "Candidate@Example.com",
                email_verified: true,
                name: "Candidate",
            };
        },
        issueToken: async userId => {
            assert.equal(userId, "user-1");
            return "backend-jwt";
        },
    });

    await handler({ body: { idToken: "firebase-id-token", email: "attacker@example.com" } }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(UserModel.users[0].email, "candidate@example.com");
    assert.equal(UserModel.users[0].firebaseUid, "firebase-uid");
    assert.equal(response.body.email, "candidate@example.com");
    assert.equal("firebaseUid" in response.body, false);
    assert.deepEqual(response.cookies[0], [
        "token",
        "backend-jwt",
        getSessionCookieOptions(),
    ]);
});

test("links an existing email account only after verified identity", async () => {
    const legacyUser = makeUser({
        _id: "existing-user",
        email: "Candidate@Example.com",
        name: "Existing Candidate",
        credits: 125,
    });
    const UserModel = makeUserModel([legacyUser]);
    const response = makeResponse();
    const handler = createGoogleAuthHandler({
        UserModel,
        verifyToken: async () => ({
            uid: "verified-firebase-uid",
            email: "candidate@example.com",
            email_verified: true,
            name: "Verified Candidate",
        }),
        issueToken: async () => "backend-jwt",
    });

    await handler({ body: { idToken: "firebase-id-token" } }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(UserModel.users.length, 1);
    assert.equal(legacyUser.firebaseUid, "verified-firebase-uid");
    assert.equal(legacyUser.name, "Verified Candidate");
    assert.equal(response.body.credits, 125);
});

test("rejects unverified and conflicting identities without issuing a session", async () => {
    const UserModel = makeUserModel([
        makeUser({
            _id: "existing-user",
            email: "candidate@example.com",
            firebaseUid: "different-uid",
            name: "Candidate",
            credits: 500,
        }),
    ]);
    let tokenIssued = false;
    const handler = createGoogleAuthHandler({
        UserModel,
        verifyToken: async () => ({
            uid: "new-uid",
            email: "candidate@example.com",
            email_verified: true,
            name: "Candidate",
        }),
        issueToken: async () => {
            tokenIssued = true;
            return "backend-jwt";
        },
    });
    const conflictResponse = makeResponse();

    await handler({ body: { idToken: "firebase-id-token" } }, conflictResponse);

    assert.equal(conflictResponse.statusCode, 409);
    assert.equal(tokenIssued, false);

    const unverifiedResponse = makeResponse();
    const unverifiedHandler = createGoogleAuthHandler({
        UserModel,
        verifyToken: async () => ({
            uid: "new-uid",
            email: "candidate@example.com",
            email_verified: false,
        }),
        issueToken: async () => {
            tokenIssued = true;
            return "backend-jwt";
        },
    });
    await unverifiedHandler({ body: { idToken: "firebase-id-token" } }, unverifiedResponse);
    assert.equal(unverifiedResponse.statusCode, 401);
    assert.equal(tokenIssued, false);
});
