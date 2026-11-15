import dns from "node:dns";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "node:url";
dotenv.config({ path: fileURLToPath(new URL("./.env", import.meta.url)) });
// Use Google DNS only for local development.
// Render production will use its own DNS resolver.
if (process.env.NODE_ENV !== "production") {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

if (!process.env.GEMINI_API_KEY?.trim()) {
    throw new Error("GEMINI_API_KEY is required. Add it to the server environment before starting the API.");
}
if (!process.env.JWT_SECRET?.trim()) {
    throw new Error("JWT_SECRET is required. Add it to the server environment before starting the API.");
}
if (
    !process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() ||
    !process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim() ||
    !process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim()
) {
    throw new Error(
        "FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY are required."
    );
}

const [
    { default: connectDb },
    { default: cors },
    { default: authRouter },
    { default: userRouter },
    { default: interviewRouter },
    { default: paymentRouter },
] = await Promise.all([
    import("./config/connectDb.js"),
    import("cors"),
    import("./routes/auth.route.js"),
    import("./routes/user.route.js"),
    import("./routes/interview.route.js"),
    import("./routes/payment.route.js"),
]);

const app = express();
const productionFrontendOrigin = "https://interviewiq-client-md3a.onrender.com";
const allowedOrigins = new Set([
    (process.env.CLIENT_URL?.trim() || productionFrontendOrigin).replace(/\/$/, ""),
]);
if (process.env.NODE_ENV !== "production") {
    allowedOrigins.add("http://localhost:5173");
}
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Origin is not allowed by CORS."));
    },
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/interview",interviewRouter);
app.use("/api/payment",paymentRouter);

try {
    await connectDb();
    const PORT=process.env.PORT||6000;
    app.listen(PORT,()=>{
        console.log(`Server is running on port ${PORT}`);
    });
} catch (error) {
    console.error("API startup aborted because MongoDB is unavailable.", {
        errorName: error?.name || "Error",
        code: error?.code || "unknown",
    });
    process.exitCode = 1;
}
