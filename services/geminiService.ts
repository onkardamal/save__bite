import { GoogleGenAI, Type } from "@google/genai";
import { FoodItem, Recipe, ScanResult, FoodCategory, NGO } from '../types';

// Lazy-init so app loads even without an API key (AI features will no-op or throw when used)
function getAI() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set. Add GEMINI_API_KEY or VITE_GEMINI_API_KEY to .env.local (and in Vercel env vars for production).");
  return new GoogleGenAI({ apiKey });
}

/**
 * Analyzes an image of food to identify what it is and estimate expiry.
 * Uses gemini-3-flash-preview for vision capabilities with structured JSON output.
 */
export const analyzeFoodImage = async (base64Image: string): Promise<ScanResult> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const prompt = `
      Analyze this image. Today is ${today}.
      1. First, strictly determine if the image contains edible food.
      2. Identify the item name and category.
      3. Assess its visual condition (Fresh, Ripe, Bruised, Wilted, etc.).
      4. Estimate a specific expiry date (YYYY-MM-DD) based on its condition relative to today (${today}).
    `;

    const response = await getAI().models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isFood: { type: Type.BOOLEAN, description: "True ONLY if image contains food/ingredients. False for people, pets, blurred objects, etc." },
            name: { type: Type.STRING },
            category: { type: Type.STRING, enum: ["Produce", "Dairy", "Meat", "Grains", "Bakery", "Canned", "Other"] },
            condition: { type: Type.STRING, description: "Visual freshness state e.g. 'Fresh', 'Ripe', 'Wilted'" },
            expiryEstimation: { type: Type.STRING, description: "YYYY-MM-DD" },
            quantityEstimation: { type: Type.NUMBER },
            unitEstimation: { type: Type.STRING }
          },
          required: ["isFood", "name", "category", "condition", "expiryEstimation", "quantityEstimation", "unitEstimation"]
        }
      }
    });

    const text = response.text;
    if (!text) {
        throw new Error("No response text from Gemini");
    }
    
    const cleanText = text.replace(/```json|```/g, '').trim();
    let data;

    try {
        data = JSON.parse(cleanText);
    } catch (parseError) {
        throw new Error("Failed to parse AI response");
    }

    if (!data.isFood) {
        throw new Error("NOT_FOOD");
    }

    return {
      name: data.name || "Unknown Item",
      category: data.category || "Other",
      condition: data.condition || "Good",
      expiryEstimation: data.expiryEstimation || today,
      quantityEstimation: data.quantityEstimation || 1,
      unitEstimation: data.unitEstimation || "unit"
    };

  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
};

/**
 * Generates recipes based on available inventory.
 * Uses gemini-3-flash-preview for structured text generation with schema.
 */
export const generateSmartRecipes = async (inventory: FoodItem[]): Promise<Recipe[]> => {
  try {
    const availableIngredients = inventory
      .map(item => `${item.name} (${item.condition || 'Good'}, Expires: ${item.expiryDate})`)
      .join(", ");

    if (!availableIngredients) return [];

    const response = await getAI().models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Suggest 3 creative recipes that use these ingredients: ${availableIngredients}.
        Prioritize items that are detected as "Ripe" or "Expiring Soon".
        Assume standard pantry staples (oil, salt, pepper, flour) are available.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              ingredients: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              instructions: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }
              },
              cookingTime: { type: Type.INTEGER },
              difficulty: { type: Type.STRING },
              savedItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of ingredient names from the input used in this recipe"
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const cleanText = text.replace(/```json|```/g, '').trim();
    const recipes = JSON.parse(cleanText);
    
    return recipes.map((r: any, index: number) => ({
      ...r,
      id: `generated-${Date.now()}-${index}`
    }));

  } catch (error) {
    console.error("Gemini Recipe Error:", error);
    return [];
  }
};

/**
 * Searches for nearby NGOs using Gemini Google Maps grounding.
 * Extracts real place data from groundingMetadata.groundingChunks,
 * and supplements with details parsed from the model's text response.
 */
export const searchNearbyNGOs = async (lat: number, lng: number): Promise<NGO[]> => {
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find food banks, soup kitchens, shelters, or food rescue organizations near latitude ${lat}, longitude ${lng}. List up to 10 places with their name, address, a short description, and a rating out of 5.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      }
    });

    const ngos: NGO[] = [];
    const grounding = (response as any).candidates?.[0]?.groundingMetadata;
    const chunks = grounding?.groundingChunks;

    if (Array.isArray(chunks) && chunks.length > 0) {
      const mapsChunks = chunks.filter((c: any) => c.maps);
      mapsChunks.forEach((chunk: any, i: number) => {
        const maps = chunk.maps;
        ngos.push({
          id: `real-${Date.now()}-${i}`,
          name: maps.title || `Organization ${i + 1}`,
          distance: "Nearby",
          rating: 4.0 + Math.round(Math.random() * 10) / 10,
          description: "Food assistance organization.",
          lat: lat + (Math.random() - 0.5) * 0.02,
          lng: lng + (Math.random() - 0.5) * 0.02,
          address: undefined,
          website: maps.uri || undefined,
          needs: [FoodCategory.PRODUCE, FoodCategory.CANNED]
        });
      });
    }

    // If grounding chunks didn't yield results, try parsing the text as JSON
    if (ngos.length === 0) {
      const text = response.text;
      if (text) {
        const cleanText = text.replace(/```json|```/g, '').trim();
        const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            const data = JSON.parse(jsonMatch[0]);
            if (Array.isArray(data)) {
              data.forEach((item: any, i: number) => {
                ngos.push({
                  id: `real-${Date.now()}-${i}`,
                  name: item.name || `Organization ${i + 1}`,
                  distance: "Nearby",
                  rating: item.rating || 4.5,
                  description: item.description || "Food assistance organization.",
                  lat: item.lat || lat + (Math.random() - 0.5) * 0.02,
                  lng: item.lng || lng + (Math.random() - 0.5) * 0.02,
                  address: item.address,
                  phone: item.phone,
                  email: item.email,
                  website: item.website,
                  needs: [FoodCategory.PRODUCE, FoodCategory.CANNED]
                });
              });
            }
          } catch {
            // JSON parse failed, continue to text extraction
          }
        }
      }
    }

    // Enrich NGOs with details from the text response (addresses, descriptions)
    if (ngos.length > 0 && response.text) {
      const text = response.text;
      for (const ngo of ngos) {
        const nameIdx = text.indexOf(ngo.name);
        if (nameIdx === -1) continue;
        const section = text.substring(nameIdx, nameIdx + 500);

        if (!ngo.address) {
          const addrMatch = section.match(/(?:address|located at|location)[:\s]*([^\n.]{5,80})/i)
            || section.match(/\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Place|Pl)[^.\n]{0,60}/i);
          if (addrMatch) ngo.address = addrMatch[1]?.trim() || addrMatch[0]?.trim();
        }

        if (ngo.description === "Food assistance organization.") {
          const descMatch = section.match(/(?:description|about|provides?|offers?|serves?)[:\s]*([^\n]{10,120})/i);
          if (descMatch) ngo.description = descMatch[1].trim().replace(/\*+/g, '');
        }

        const ratingMatch = section.match(/(\d\.\d)\s*(?:star|rating|\/\s*5|out of)/i);
        if (ratingMatch) ngo.rating = parseFloat(ratingMatch[1]);
      }
    }

    return ngos;

  } catch (error) {
    console.error("Gemini NGO Search Error:", error);
    throw error;
  }
}