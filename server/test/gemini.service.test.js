import assert from "node:assert/strict";
import test from "node:test";
import {
    createGeminiService,
    GEMINI_FALLBACK_MODEL,
    GEMINI_MODEL,
} from "../services/gemini.service.js";

const validMessages = [
    { role: "system", content: "Follow these rules." },
    { role: "user", content: "Generate an answer." },
];

test("maps prompts to the Gemini SDK and returns trimmed text", async () => {
    let clientOptions;
    let request;
    const askAi = createGeminiService({
        getApiKey: () => "test-only-key",
        createClient: async options => {
            clientOptions = options;
            return {
                models: {
                    generateContent: async input => {
                        request = input;
                        return { text: "  Gemini response  " };
                    },
                },
            };
        },
    });

    const result = await askAi(validMessages, { responseMimeType: "application/json" });

    assert.equal(result, "Gemini response");
    assert.equal(clientOptions.apiKey, "test-only-key");
    assert.deepEqual(clientOptions.httpOptions, { timeout: 30_000 });
    assert.equal(request.model, GEMINI_MODEL);
    assert.deepEqual(request.contents, [
        { role: "user", parts: [{ text: "Generate an answer." }] },
    ]);
    assert.equal(request.config.systemInstruction, "Follow these rules.");
    assert.equal(request.config.responseMimeType, "application/json");
    assert.deepEqual(request.config.httpOptions, { timeout: 30_000 });
});

test("rejects malformed or missing prompts before contacting Gemini", async () => {
    let clientCreated = false;
    const askAi = createGeminiService({
        getApiKey: () => "test-only-key",
        createClient: async () => {
            clientCreated = true;
            throw new Error("Unexpected SDK call");
        },
    });

    await assert.rejects(askAi([]), { statusCode: 400 });
    await assert.rejects(askAi([{ role: "system", content: "Instructions only." }]), {
        statusCode: 400,
    });
    assert.equal(clientCreated, false);
});

test("reports missing configuration without constructing the SDK", async () => {
    const askAi = createGeminiService({
        getApiKey: () => "",
        createClient: async () => {
            throw new Error("Unexpected SDK call");
        },
    });

    await assert.rejects(askAi(validMessages), {
        statusCode: 500,
        message: "GEMINI_API_KEY is required by the server.",
    });
});

test("uses the fallback model after an upstream server error", async () => {
    const requestedModels = [];
    const askAi = createGeminiService({
        getApiKey: () => "test-only-key",
        createClient: async () => ({
            models: {
                generateContent: async ({ model }) => {
                    requestedModels.push(model);
                    if (model === GEMINI_MODEL) {
                        throw { status: 503 };
                    }
                    return { text: "Fallback response" };
                },
            },
        }),
    });

    const result = await askAi(validMessages);

    assert.equal(result, "Fallback response");
    assert.deepEqual(requestedModels, [GEMINI_MODEL, GEMINI_FALLBACK_MODEL]);
});

test("maps upstream rate limits, authentication errors, network errors, and empty output", async () => {
    const makeService = (generateContent) =>
        createGeminiService({
            getApiKey: () => "test-only-key",
            createClient: async () => ({ models: { generateContent } }),
        });

    await assert.rejects(
        makeService(async () => {
            throw { status: 429 };
        })(validMessages),
        { statusCode: 429 }
    );
    await assert.rejects(
        makeService(async () => {
            throw { status: 403 };
        })(validMessages),
        { statusCode: 502 }
    );
    await assert.rejects(
        makeService(async () => {
            throw new TypeError("network failure");
        })(validMessages),
        { statusCode: 503 }
    );
    await assert.rejects(
        makeService(async () => ({ text: "" }))(validMessages),
        { statusCode: 502 }
    );
});
