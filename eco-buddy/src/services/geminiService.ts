
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse } from '../types';

const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    overallSummary: {
      type: Type.STRING,
      description: "A brief, encouraging summary bridging the user's situation to the positive suggestions. If a user name is provided, address the user directly."
    },
    currentActivityAnalysis: {
      type: Type.OBJECT,
      description: "Analysis of the user's current activity.",
      properties: {
        harm: { type: Type.STRING, description: "A clear explanation of the harm the user's current option is causing." },
        emissionAnalogy: { type: Type.STRING, description: "A simple, relatable analogy for the carbon emissions cost of the current activity (e.g., 'This has the same carbon footprint as charging 10,000 smartphones.')." },
        futureImpact: { type: Type.STRING, description: "The probable future impact if this activity continues." },
      },
      required: ["harm", "emissionAnalogy", "futureImpact"]
    },
    suggestions: {
      type: Type.ARRAY,
      description: "A list of 2-4 actionable, sustainable alternatives.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "The concise title of the suggestion." },
          description: { type: Type.STRING, description: "A detailed explanation of the suggestion and how to implement it." },
          positiveImpact: { type: Type.INTEGER, description: "A score from 1 (small positive impact) to 5 (major positive impact) representing the potential environmental benefit." },
          pros: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of benefits of this suggestion (environmental, financial, health, etc.)." },
          cons: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of potential drawbacks, challenges, or things to consider." },
          imageQuery: { type: Type.STRING, description: "A simple, descriptive query for generating a background image (e.g., 'electric bicycle commuting', 'second-hand clothing store', 'planting vegetables in a garden')." },
          emissionReductionAnalogy: {
             type: Type.STRING,
             description: "A simple analogy explaining how this option reduces emissions compared to the user's original plan (e.g., 'This switch saves enough energy to power a home for 3 days.')."
          },
        },
        required: ["title", "description", "positiveImpact", "pros", "cons", "imageQuery", "emissionReductionAnalogy"]
      }
    }
  },
  required: ["overallSummary", "currentActivityAnalysis", "suggestions"]
};


export async function getEcoSuggestions(activity: string, userName: string): Promise<AnalysisResponse> {
  const model = "gemini-2.5-flash";

  const systemInstruction = `You are an expert environmental scientist and lifestyle coach named Eco-Buddy. Your goal is to help users make climate-smart decisions in a friendly, non-judgmental, and empowering way. Your responses must be concise and to the point.
Address the user directly by their name if it is provided. If no name is given, use a friendly, general tone.
First, analyze the user's provided activity. Provide a brief analysis of the user's current situation, keeping each point to a single, impactful sentence:
1.  The specific harm it causes to the environment.
2.  A quantitative cost of the emissions, translated into a simple, relatable analogy for a general audience (e.g., "equivalent to driving a gas car for 50 miles").
3.  The probable future impact if this behavior is continued on a larger scale.

Then, provide a list of sustainable alternatives. For each suggestion:
- The 'description' should be concise, ideally 1-2 sentences.
- The 'positiveImpact' score should be an integer from 1 to 5.
- The 'pros' and 'cons' should be brief bullet points.
- For 'emissionReductionAnalogy', provide a simple, powerful analogy to quantify the positive change against the user's original activity.
Your tone should be informative and empowering. Motivate the user by showing clear, comparable data and positive outcomes without unnecessary text.`;

  const prompt = userName
    ? `Please analyze the following activity for a user named ${userName}: "${activity}"`
    : `Please analyze the following user activity: "${activity}"`;

  try {
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.7,
        }
    });

    const jsonText = response.text.trim();
    const cleanedJsonText = jsonText.replace(/^```json\s*|```$/g, '');
    
    const parsed = JSON.parse(cleanedJsonText);

    if (!parsed.overallSummary || !parsed.currentActivityAnalysis || !Array.isArray(parsed.suggestions)) {
        throw new Error("Invalid JSON structure received from API.");
    }
    
    return parsed as AnalysisResponse;

  } catch (error) {
    console.error("Error generating eco suggestions:", error);
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse the response from the AI. The format was invalid.");
    }
    throw new Error("Failed to get suggestions from the API. Please try again later.");
  }
}


export async function generateSuggestionImage(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: `A serene, photorealistic, and slightly artistic image representing: ${prompt}. The image should have a soft, encouraging, and minimalist tone.`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
        console.warn("Image generation returned no images for prompt:", prompt);
        return ""; // Return empty string to not block UI
    }
  } catch (error) {
    console.error(`Error generating image for prompt "${prompt}":`, error);
    return ""; // Return empty string on error to avoid breaking the user experience
  }
}
