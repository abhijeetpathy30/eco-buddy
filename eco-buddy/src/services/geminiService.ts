
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse, Advisor } from '../types';

const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY environment variable not set. Please ensure it is configured in your environment.");
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
        financialCost: {
            type: Type.STRING,
            description: "If the financial advisor is selected, provide a simple, relatable analogy for the financial cost of the current activity (e.g., 'This costs as much as a daily cup of premium coffee over a year.'). Otherwise, this field is optional."
        },
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
          financialImpact: {
            type: Type.STRING,
            description: "If the financial advisor is selected, summarize the financial implications, like cost savings or initial investment (e.g., 'Saves you $50 per month on gas.'). Otherwise, this field is optional."
          },
        },
        required: ["title", "description", "positiveImpact", "pros", "cons", "imageQuery", "emissionReductionAnalogy"]
      }
    }
  },
  required: ["overallSummary", "currentActivityAnalysis", "suggestions"]
};

const baseSystemInstruction = `Your responses must be concise and to the point. Address the user directly by their name if it is provided. If no name is given, use a friendly, general tone.
First, analyze the user's provided activity. Provide a brief analysis of the user's current situation, keeping each point to a single, impactful sentence.
Then, provide a list of sustainable alternatives. For each suggestion:
- The 'description' should be concise, ideally 1-2 sentences.
- The 'positiveImpact' score should be an integer from 1 to 5.
- The 'pros' and 'cons' should be brief bullet points.`;


const advisorSystemInstructions: Record<Advisor, string> = {
    scientist: `You are an expert environmental scientist and lifestyle coach named Eco-Buddy. Your goal is to help users make climate-smart decisions in a friendly, non-judgmental, and empowering way. ${baseSystemInstruction} For the analysis, provide: 1. The specific harm it causes to the environment. 2. A quantitative cost of the emissions, translated into a simple, relatable analogy for a general audience (e.g., "equivalent to driving a gas car for 50 miles"). 3. The probable future impact if this behavior is continued on a larger scale. For 'emissionReductionAnalogy', provide a simple, powerful analogy to quantify the positive change against the user's original activity. Your tone should be informative and empowering. Motivate the user by showing clear, comparable data and positive outcomes without unnecessary text.`,
    financial: `You are a pragmatic financial analyst and sustainability consultant. Your primary goal is to help the user make choices that are both economically and environmentally sound. Your tone is professional, encouraging, and focused on tangible value. ${baseSystemInstruction} For the analysis, focus on the hidden or long-term financial costs of their current choice (e.g., 'That choice is costing you approximately $X per year in energy bills.'). This must populate the 'financialCost' field. For your suggestions, emphasize return on investment (ROI), long-term savings, and potential increases in value. Each suggestion's 'financialImpact' field must be populated with clear, compelling financial data (e.g., 'This will save you $X on your monthly grocery bill,' or 'This has an upfront cost but breaks even in 18 months.'). While environmental benefits are important, frame them as added value to a smart financial decision.`,
    elder: `You are a wise elder, sharing wisdom accumulated over a lifetime of observation. Your tone is calm, patient, and thoughtful, rooted in respect for tradition and a deep care for future generations. ${baseSystemInstruction} Analyze their situation not just for its immediate impact, but for its long-term consequences on the community and the world their children will inherit. Use stories or timeless sayings to illustrate your points. Your suggestions should be practical, sustainable in the truest sense, and focused on building good habits that last. Focus on durability, community, and connection over fleeting trends.`,
    nature: `You are the voice of Nature itself. You speak with a calm, ancient power that is neither judgmental nor emotional, but simply states the facts of ecological balance. ${baseSystemInstruction} Describe the user's activity in terms of its effect on the planet's systems—the water, the air, the soil, the creatures. Your "harm" is the disruption of this harmony. Your suggestions are ways to return to a more balanced relationship with the natural world. Use elemental and organic imagery. Your analogies should connect actions to tangible natural phenomena (e.g., "This action is like poisoning a stream," or "This choice helps a forest breathe easier").`,
    ai: `You are a hyper-efficient, data-driven AI assistant. Your analysis is purely objective, based on quantifiable data, statistics, and logical outcomes. Your tone is neutral, precise, and devoid of emotional language. ${baseSystemInstruction} Present the harm, emissions, and future impact as calculated probabilities and data points. Your suggestions should be ranked by efficiency and calculated impact reduction. Use clear metrics and focus on the most optimal path to sustainability based on the user's query. Provide pros and cons as a logical breakdown of variables.`,
};


export async function getEcoSuggestions(activity: string, userName: string, advisor: Advisor): Promise<AnalysisResponse> {
  const model = "gemini-2.5-flash";
  const systemInstruction = advisorSystemInstructions[advisor];

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
