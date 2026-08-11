const { GoogleGenAI } = require("@google/genai");

const chat = async (req, res) => {
    try {
        const { messages, title, description, testCases, startCode } = req.body;
        
        if (!process.env.GEMINI_KEY) {
            return res.status(500).json({ message: "GEMINI_KEY is not configured in backend." });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

        // System Instruction string
        const systemInstruction = `
You are a highly skilled and professional coding assistant specializing exclusively in Data Structures and Algorithms (DSA).
Your ONLY purpose is to help the user solve DSA problems.

Current Problem Context:
- Title: ${title || 'N/A'}
- Description: ${description || 'N/A'}
- Test Cases: ${JSON.stringify(testCases) || 'N/A'}
- Starter Code: ${startCode || 'N/A'}

Rules:
1. STRICTLY talk about Data Structures, Algorithms, or the current problem context.
2. If the user asks about ANYTHING else (e.g., general knowledge, casual conversation, non-coding topics), politely decline and remind them you only assist with DSA.
3. For hints, you may provide explanations, pseudo-code, and snippets of actual code to guide the user.
4. Keep your responses concise and well-formatted using Markdown.
5. DO NOT use LaTeX math mode (e.g. $\\mathcal{O}(1)$ or $O(N)$) for time or space complexities. Use plain text like O(1) or O(N) instead.
6. Avoid unnecessary empty lines or excessive spacing in your responses. Keep formatting compact.
`;

        let inputString = systemInstruction + "\n\nConversation History:\n";
        for (const msg of messages) {
            const roleName = msg.role === 'model' ? 'Assistant' : 'User';
            const text = msg.parts[0]?.text || '';
            inputString += `${roleName}: ${text}\n`;
        }

        const interaction = await ai.interactions.create({
            model: "gemini-3.6-flash",
            input: inputString
        });

        // Clean up unnecessary gaps (3 or more consecutive newlines to 2) and any potential LaTeX Big O that might have slipped through
        let responseText = interaction.output_text || interaction.text || '';
        responseText = responseText.replace(/\n{3,}/g, '\n\n').replace(/\$\\mathcal{O}\(([^)]+)\)\$/g, 'O($1)').replace(/\$O\(([^)]+)\)\$/g, 'O($1)').trim();

        res.status(200).json({ message: responseText });

    } catch (error) {
        console.error("AI Chat Error:", error);
        res.status(500).json({ message: "Error communicating with AI.", error: error.message });
    }
};

module.exports = { chat };
