const productionApiUrl = "https://interview-e2zw.onrender.com";

export const ServerUrl = (
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "" : productionApiUrl)
).replace(/\/$/, "");
