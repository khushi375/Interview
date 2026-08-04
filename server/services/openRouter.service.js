import axios from "axios"
// import dotenv from "dotenv";



export const askAi=async (messages) => {
    try {
        if(!messages||!Array.isArray(messages)||messages.length===0){
            throw new Error("Messages array is empty.");
        }
        const openRouterKey = process.env.OPENROUTER_API_KEY;
        const openAiKey = process.env.OPENAI_API_KEY;

        if (!openRouterKey && !openAiKey) {
            throw new Error("AI API key is missing. Set OPENROUTER_API_KEY or OPENAI_API_KEY in the server environment.");
        }

        const useOpenRouter = Boolean(openRouterKey);
        const endpoint = useOpenRouter
            ? "https://openrouter.ai/api/v1/chat/completions"
            : "https://api.openai.com/v1/chat/completions";
        const apiKey = useOpenRouter ? openRouterKey : openAiKey;

        const requestBody = useOpenRouter
            ? { model: "openai/gpt-4o-mini", messages }
            : { model: "gpt-4o-mini", messages };

        const response = await axios.post(endpoint, requestBody, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": 'application/json',
            },
        });
        const content = response?.data?.choices?.[0]?.message?.content;
        if(!content|| !content.trim()){
            console.error("OpenRouter empty response:", response?.data);
            throw new Error("AI returned empty response.");
        }
        return content;
    } catch (error) {
        const errorDetail = error.response?.data || error.message || "Unknown OpenRouter error";
        console.error("OpenRouter Error:", errorDetail);
        const detailString = typeof errorDetail === "string" ? errorDetail : JSON.stringify(errorDetail);
        throw new Error(`OpenRouter API Error: ${detailString}`);
    }
    
}
