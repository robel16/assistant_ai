require("dotenv").config();
const {GoogleGenerativeAI} = require("@google/generative-ai");
const { GEMINI_API_KEY } = require("../config/config");

console.log("Gemini API Key:", GEMINI_API_KEY ? "Present" : "Missing");
console.log("Key length:", GEMINI_API_KEY ? GEMINI_API_KEY.length : 0);

const testBasicGemini = async () => {
    try {
        console.log("Creating Gemini client...");
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        
        console.log("Getting model...");
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash"
        });
        
        console.log("Generating content...");
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        const text = response.text();
        
        console.log("✅ Success! Response:", text);
    } catch (error) {
        console.log("❌ Error:", error.message);
        console.log("Full error:", error);
    }
};

testBasicGemini();
