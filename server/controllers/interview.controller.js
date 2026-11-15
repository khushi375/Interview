import fs from 'fs';
import { PdfReader } from 'pdfreader';
import { askAi, GeminiServiceError } from "../services/gemini.service.js";
import User from "../models/user.model.js";
import Interview from "../models/interview.model.js"

const parseJsonResponse = (response) => {
    if (typeof response !== "string" || !response.trim()) {
        throw new Error("AI returned an empty response.");
    }

    const jsonText = response.trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");
    try {
        return JSON.parse(jsonText);
    } catch {
        throw new GeminiServiceError("AI returned invalid JSON.", 502);
    }
};

const isStringArray = (value) =>
    Array.isArray(value) && value.every(item => typeof item === "string");

const extractTextWithPdfReader = (filepath) => {
    return new Promise((resolve, reject) => {
        const rows = {};
        new PdfReader().parseFileItems(filepath, (err, item) => {
            if (err) {
                return reject(err);
            }
            if (!item) {
                const text = Object.keys(rows)
                    .sort((a, b) => parseFloat(a) - parseFloat(b))
                    .map(key => rows[key].join(' '))
                    .join('\n');
                return resolve(text);
            }
            if (item.text) {
                const y = item.y || 0;
                rows[y] = rows[y] || [];
                rows[y].push(item.text);
            }
        });
    });
};

export const analyzeResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Resume required" });
        }
        const filepath = req.file.path

        await fs.promises.readFile(filepath)
        let resumeText = "";

        try {
            const fallbackText = await extractTextWithPdfReader(filepath);
            resumeText = (fallbackText || "").replace(/\s+/g, " ").trim();
        } catch (fallbackError) {
            console.error("Resume PDF fallback parse error:", fallbackError);
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ message: "Uploaded resume must be a valid PDF file." });
        }

        if (!resumeText) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ message: "Unable to extract text from the uploaded resume." });
        }

        const messages = [
            {
                role: "system",
                content: `
                Extract structured data from resume.
                
                Return strictly JSON:
                {
                "role": "string",
                "experience": "string",
                "projects": ["project1","project2"],
                "skills": ["skill1","skill2"]
                }
                `
            },
            {
                role: "user",
                content: resumeText
            }
        ];

        let aiResponse;
        try {
            aiResponse = await askAi(messages, { responseMimeType: "application/json" });
        } catch (error) {
            console.error("Resume analysis Gemini request failed:", {
                statusCode: error?.statusCode || 500,
                message: error?.message || "Unknown Gemini error",
            });
            fs.unlinkSync(filepath);
            return res.json({
                role: "",
                experience: "",
                projects: [],
                skills: [],
                resumeText,
                warning: "PDF text was extracted, but AI analysis is temporarily unavailable. Retry or fill the fields manually."
            });
        }

        let parsed;
        try {
            parsed = parseJsonResponse(aiResponse);
        } catch {
            fs.unlinkSync(filepath);
            return res.json({
                role: "",
                experience: "",
                projects: [],
                skills: [],
                resumeText,
                warning: "Resume analysis returned an unexpected response. Please fill the fields manually."
            });
        }

        if (
            !parsed ||
            typeof parsed !== "object" ||
            typeof parsed.role !== "string" ||
            typeof parsed.experience !== "string" ||
            !isStringArray(parsed.projects) ||
            !isStringArray(parsed.skills)
        ) {
            fs.unlinkSync(filepath);
            return res.json({
                role: "",
                experience: "",
                projects: [],
                skills: [],
                resumeText,
                warning: "Resume analysis returned invalid data. Please fill the fields manually."
            });
        }

        fs.unlinkSync(filepath);
        res.json({
            role: parsed.role,
            experience: parsed.experience,
            projects: parsed.projects,
            skills: parsed.skills,
            resumeText
        });

    } catch (error) {
        console.error(error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({ message: error.message });

    }

};

export const generateQuestion = async (req, res) => {
    try {

        let { role, experience, mode, resumeText, projects, skills } = req.body
        role = role?.trim();
        experience = experience?.trim();
        mode = mode?.trim();
        if (!role || !experience || !mode) {
            return res.status(400).json({ message: "Role , Experience and Mode are required." })
        }
        const user = await User.findById(req.userId)
        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }
        if (user.credits < 50) {
            return res.status(400).json({
                message: "Not enough credits. Minimum 50 required"
            });
        }

        const projectText = Array.isArray(projects) && projects.length
            ? projects.join(",")
            : "None";
        const skillsText = Array.isArray(skills) && skills.length
            ? skills.join(",")
            : "None";

        const safeResume = resumeText?.trim() || "None";

        const userPrompt = `
        Role:${role}
        Experience : ${experience}
        InterviewMode:${mode}
        Projects:${projectText}
        Skills:${skillsText}
        Resume:${safeResume}`;

        if (!userPrompt.trim()) {
            return res.status(400).json({
                message: "Prompt content is empty."
            });
        }

        const messages = [
            {
                role: "system",
                content: `
                You are real human interviewer conducting a professional interview.
                
                Speak in simple, natural English as if you are directly talking to the candidate.
                
                Generate exactly 5 interview questions.
                
                Strict Rules:
                -Each question must contain between 15 and 25 words.
                -Each question must be a simple complete sentence.
                -Do NOT number them.
                -Do NOT add explanations.
                -Do NOT add extra text before or after.
                -One question per line only.
                -Keep language simple and conversational.
                -Questions must feel practical and realistic.
                
                Difficulty progression:
                Question 1 -> easy
                Question 2 -> easy
                Question 3 -> medium
                Question 4 -> medium
                Question 5 -> hard
                
                Make questions based on the candidate's role, experience,interviewMode, projects, skills, and resume details.`
            },
            {
                role: "user",
                content: userPrompt
            }
        ];

        const aiResponse = await askAi(messages)
        if (!aiResponse || !aiResponse.trim()) {
           
            return res.status(500).json({
                message: "AI returned empty response."
            });
            
        }
        const questionsArray = aiResponse
            .split("\n")
            .map(q => q.trim().replace(/^\s*(?:[-*]\s*|\d+[.)]\s*)/, ""))
            .filter(q => q.length > 0);

        if (questionsArray.length !== 5) {
            return res.status(502).json({
                message: "AI returned an invalid set of interview questions."
            });
        }
        user.credits -= 50;
        await user.save();

        const interview = await Interview.create({
            userId: req.userId,
            role,
            experience,
            mode,
            resumeText: safeResume,
            questions: questionsArray.map((q, index) => ({
                question: q,
                difficulty: ["easy", "easy", "medium", "medium", "hard"][index],
                timeLimit: [60, 60, 90, 90, 120][index],
            }))
        })

        res.json({
            interviewId: interview._id,
            creditsLeft: user.credits,
            userName: user.name,
            questions: interview.questions

        });

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : "Failed to create interview."
        });

    }
}

export const submitAnswer = async (req, res) => {
    try {
        const { interviewId, questionIndex, answer, timeTaken } = req.body;

        if (!interviewId || !Number.isInteger(questionIndex)) {
            return res.status(400).json({ message: "A valid interview and question index are required." });
        }

        const interview = await Interview.findOne({ _id: interviewId, userId: req.userId });
        if (!interview) {
            return res.status(404).json({ message: "Interview not found." });
        }
        const question = interview.questions[questionIndex];
        if (!question) {
            return res.status(400).json({ message: "Question index is invalid." });
        }

        if (typeof answer !== "string" || !answer.trim()) {
            question.score = 0;
            question.feedback = "You did not submit an answer.";
            question.answer = "";

            await interview.save();
            return res.json({ feedback: question.feedback });
        }

        if (timeTaken > question.timeLimit) {
            question.score = 0;
            question.feedback = "Time limit exceeded. Answer not evaluated.";
            question.answer = answer;

            await interview.save();
            return res.json({ feedback: question.feedback });
        }

        const messages = [
            {
                role: "system",
                content: `
You are a professional human interviewer evaluating a candidate's answer in a real interview.

Evaluate naturally and fairly, like a real person would.

Score the answer in these areas (0 to 10):

1. Confidence – Does the answer sound clear, confident, and well-presented?
2. Communication – Is the language simple, clear, and easy to understand?
3. Correctness – Is the answer accurate, relevant, and complete?

Rules:
- Be realistic and unbiased.
- Do not give random high scores.
- If the answer is weak, score low.
- If the answer is strong and detailed, score high.
- Consider clarity, structure, and relevance.

Calculate:
finalScore = average of confidence, communication, and correctness (rounded to nearest whole number).

Feedback Rules:
- Write natural human feedback.
- 10 to 15 words only.
- Must be non-empty and directly address the answer.
- Sound like real interview feedback.
- Can suggest improvement if needed.
- Do NOT repeat the question.
- Do NOT explain scoring.
- Keep tone professional and honest.

Return ONLY valid JSON in this format:

{
  "confidence": number,
  "communication": number,
  "correctness": number,
  "finalScore": number,
  "feedback": "short human feedback"
}
`
            },
            {
                role: "user",
                content: `
Question: ${question.question}
Answer: ${answer}
`,
            },
        ];

        const aiResponse = await askAi(messages, { responseMimeType: "application/json" });
        const parsed = parseJsonResponse(aiResponse);
        const scoreFields = ["confidence", "communication", "correctness"];
        if (
            !parsed ||
            typeof parsed.feedback !== "string" ||
            !parsed.feedback.trim() ||
            !scoreFields.every(field =>
                Number.isFinite(parsed[field]) && parsed[field] >= 0 && parsed[field] <= 10
            )
        ) {
            return res.status(502).json({ message: "AI returned invalid answer feedback." });
        }
        const feedbackText = parsed.feedback.trim();
        const finalScore = Math.round(
            scoreFields.reduce((total, field) => total + parsed[field], 0) / scoreFields.length
        );

        question.answer = answer;
        question.confidence = parsed.confidence;
        question.communication = parsed.communication;
        question.correctness = parsed.correctness;
        question.score = finalScore;
        question.feedback = feedbackText;

        await interview.save();
        return res.status(200).json({ feedback: feedbackText });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : "Failed to submit answer."
        });
    }
}

export const finishInterview = async (req,res)=>{
    try {
        const {interviewId}= req.body;
        const interview = await Interview.findOne({ _id: interviewId, userId: req.userId })
        if(!interview){
            return res.status(400).json({message: "failed to find Interview"})
        }

        const totalQuestions = interview.questions.length;

        let totalScore =0;
        let totalConfidence=0;
        let totalCommunication=0;
        let totalCorrectness=0;

        interview.questions.forEach((q)=>{
             totalScore += q.score||0;
         totalConfidence += q.confidence||0;
         totalCommunication += q.communication||0;
         totalCorrectness += q.correctness||0;
        });

        const finalScore = totalQuestions
        ? totalScore / totalQuestions
        :0;

        const  avgConfidence  = totalQuestions
        ?  totalConfidence  / totalQuestions
        :0;

        const  avgCommunication  = totalQuestions
        ?  totalCommunication  / totalQuestions
        :0;
        
        const  avgCorrectness  = totalQuestions
        ?  totalCorrectness  / totalQuestions
        :0;

        interview.finalScore = finalScore;
        interview.status= "Completed";

        await interview.save();
        return res.status(200).json({
  finalScore: Number(finalScore.toFixed(1)),
  confidence: Number(avgConfidence.toFixed(1)),
  communication: Number(avgCommunication.toFixed(1)),
  correctness: Number(avgCorrectness.toFixed(1)),
  questionWiseScore: interview.questions.map((q) => ({
    question: q.question,
    score: q.score || 0,
    feedback: q.feedback || "",
    confidence: q.confidence || 0,
    communication: q.communication || 0,
    correctness: q.correctness || 0,
  })),
})
 } catch (error) {
        return res.status(500).json({ message:`failed to finish Interview ${error}` });
        
    }
}

export const getMyInterviews = async (req,res)=>{
    try{
        const interviews = await Interview.find({userId: req.userId})
        .sort({createdAt: -1})
        .select("role experience mode finalScore status createdAt")
        return res.status(200).json(interviews)

    }catch(error){
 return res.status(500).json({ message:`failed to find currentUser Interview ${error}` });
    }
}

export const getInterviewReport = async (req,res)=>{
    try{
        const interview = await Interview.findOne({ _id: req.params.id, userId: req.userId })
        if(!interview){
            return res.status(404).json({message: "Interview not found"});
        }
         const totalQuestions = interview.questions.length;

        let totalConfidence=0;
        let totalCommunication=0;
        let totalCorrectness=0;

        interview.questions.forEach((q)=>{
         totalConfidence += q.confidence||0;
         totalCommunication += q.communication||0;
         totalCorrectness += q.correctness||0;
        });

        const  avgConfidence  = totalQuestions
        ?  totalConfidence  / totalQuestions
        :0;

        const  avgCommunication  = totalQuestions
        ?  totalCommunication  / totalQuestions
        :0;
        
        const  avgCorrectness  = totalQuestions
        ?  totalCorrectness  / totalQuestions
        :0;

      return  res.json({
            finalScore: interview.finalScore,
            confidence: Number(avgConfidence.toFixed(1)),
            communication: Number(avgCommunication.toFixed(1)),
            correctness: Number(avgCorrectness.toFixed(1)),
            questionWiseScore: interview.questions.map((q) => ({
                question: q.question,
                score: q.score || 0,
                feedback: q.feedback || "",
                confidence: q.confidence || 0,
                communication: q.communication || 0,
                correctness: q.correctness || 0,
            })),
        });
    }
    catch(error){
 return res.status(500).json({ message:"Failed to retrieve interview report." });
    }
}
