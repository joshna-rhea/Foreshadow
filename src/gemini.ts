import {GoogleGenAI} from "@google/genai"

const ai = new GoogleGenAI ({
    vertexai: true,
    project: "gen-lang-client-0273146539",
    location: "global"
} );

async function testGemini() {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Reply with exactly: FORESHADOW CONNECTED",
    });
    console.log(response.text);
}

testGemini();
