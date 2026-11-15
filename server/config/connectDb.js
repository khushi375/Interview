import mongoose from "mongoose";

const connectDb = async () => {
    if (!process.env.MONGODB_URL?.trim()) {
        throw new Error("MONGODB_URL is required before the API can start.");
    }

    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB");
    } catch (error) {
        const serverErrors = Array.from(error?.reason?.servers?.values?.() || [])
            .map(server => server.error)
            .filter(Boolean);
        console.error("MongoDB connection failed.", {
            code: error?.code || "unknown",
            errorName: error?.name || "Error",
            causeCodes: [...new Set(serverErrors.flatMap(serverError => [
                serverError.code,
                serverError.codeName,
                serverError.cause?.code,
                serverError.cause?.cause?.code,
            ]).filter(Boolean))],
        });
        throw error;
    }
};

export default connectDb;