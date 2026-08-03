import axios from "axios"
// import dotenv from "dotenv";



export const askAi=async (messages) => {
    try {
        if(!messages||!Array.isArray(messages)||messages.length===0){
            throw new Error("Messages array is empty.");
        }
        if(!process.env.OPENROUTER_API_KEY){
            throw new Error("OpenRouter API key is missing. Add OPENROUTER_API_KEY to the server .env file.");
        }
        const response=await axios.post("https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-4o-mini",
                messages: messages
            },
            {
                headers:{
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type":'application/json',
                
            },});
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
