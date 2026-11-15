export const GEMINI_MODEL = "gemini-3.8-flash";
export const GEMINI_FALLBACK_MODEL = "gemini-3.6-flash";
const REQUEST_TIMEOUT_MS = 30_000;

export class GeminiServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = "GeminiServiceError";
        this.statusCode = statusCode;
    }
}

const createSdkClient = async (options) => {
    const { GoogleGenAI } = await import("@google/genai");
    return new GoogleGenAI(options);
};

export const createGeminiService = ({
    getApiKey = () => process.env.GEMINI_API_KEY,
    createClient = createSdkClient,
} = {}) => {
    let client;

    return async (messages, { responseMimeType } = {}) => {
        if (!Array.isArray(messages) || messages.length === 0) {
            throw new GeminiServiceError("AI messages are required.", 400);
        }

        const systemInstructions = [];
        const contents = [];

        for (const message of messages) {
            if (
                !message ||
                !["system", "user", "assistant"].includes(message.role) ||
                typeof message.content !== "string" ||
                !message.content.trim()
            ) {
                throw new GeminiServiceError("AI messages contain invalid content.", 400);
            }

            if (message.role === "system") {
                systemInstructions.push(message.content.trim());
            } else {
                contents.push({
                    role: message.role === "assistant" ? "model" : "user",
                    parts: [{ text: message.content.trim() }],
                });
            }
        }

        if (contents.length === 0) {
            throw new GeminiServiceError("An AI user message is required.", 400);
        }

        const apiKey = getApiKey()?.trim();
        if (!apiKey) {
            throw new GeminiServiceError("GEMINI_API_KEY is required by the server.", 500);
        }

        try {
            if (!client) {
                client = await createClient({
                    apiKey,
                    httpOptions: { timeout: REQUEST_TIMEOUT_MS },
                });
            }

            const config = {
                httpOptions: { timeout: REQUEST_TIMEOUT_MS },
            };
            if (systemInstructions.length) {
                config.systemInstruction = systemInstructions.join("\n\n");
            }
            if (responseMimeType) {
                config.responseMimeType = responseMimeType;
            }

            let response;
            try {
                response = await client.models.generateContent({
                    model: GEMINI_MODEL,
                    contents,
                    config,
                });
            } catch (error) {
                const status = Number(error?.status || error?.statusCode);
                if (!Number.isFinite(status) || status < 500 || status >= 600) {
                    throw error;
                }

                console.warn("Gemini primary model returned a server error; trying fallback.", {
                    model: GEMINI_MODEL,
                    statusCode: status,
                    errorName: error?.name || "Error",
                });
                response = await client.models.generateContent({
                    model: GEMINI_FALLBACK_MODEL,
                    contents,
                    config,
                });
            }
            const text = response?.text;
            if (typeof text !== "string" || !text.trim()) {
                throw new GeminiServiceError("Gemini returned an empty response.", 502);
            }
            return text.trim();
        } catch (error) {
            if (error instanceof GeminiServiceError) {
                throw error;
            }

            const status = Number(error?.status || error?.statusCode);
            if (status === 429) {
                throw new GeminiServiceError("Gemini rate limit exceeded. Please try again later.", 429);
            }
            if (status === 401 || status === 403) {
                throw new GeminiServiceError(
                    "Gemini authentication failed. Verify the server GEMINI_API_KEY configuration.",
                    502
                );
            }
            if (status >= 500) {
                throw new GeminiServiceError("Gemini is temporarily unavailable. Please try again later.", 503);
            }
            if (!status || error?.name === "AbortError" || error?.name === "TimeoutError") {
                throw new GeminiServiceError("Gemini request failed due to a network error or timeout.", 503);
            }
            throw new GeminiServiceError(`Gemini request failed (HTTP ${status}).`, 502);
        }
    };
};

export const askAi = createGeminiService();
