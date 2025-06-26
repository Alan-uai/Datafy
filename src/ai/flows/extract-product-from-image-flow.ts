import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import { gemini15Flash, gemini15Pro } from '@genkit-ai/googleai';

export default defineFlow({
  name: 'extractProductFromImage',
  inputSchema: z.object({
    base64Image: z.string().describe("Base64 encoded string of the image containing product details."),
    imageType: z.string().optional().default("image/jpeg").describe("MIME type of the image (e.g., image/jpeg, image/png)")
  }),
  outputSchema: z.object({
    extractedProducts: z.array(z.object({
      produto: z.string().describe("Name of the product."),
      marca: z.string().optional().describe("Brand of the product."),
      unidade: z.string().optional().describe("Quantity or unit of the product (e.g., '1', '500g')."),
      validade: z.string().optional().describe("Expiry date in YYYY-MM-DD format. If not found, use an empty string."),
    })).describe("List of products extracted from the image."),
  }),
  async execute(input) {
    console.log("Attempting to extract product information from image using Gemini...");

    const { base64Image, imageType } = input;

    // Validate base64 input
    if (!base64Image || base64Image.trim() === '') {
      throw new Error("Base64 image string is empty or invalid");
    }

    // Construct the media part according to Genkit 1.13.0 documentation
    const mediaPart = {
      media: {
        contentType: imageType,
        url: `data:${imageType};base64,${base64Image}`,
      }
    };

    const textPart = {
      text: `Analyze the provided image for product information. Identify any products, their brands, units (e.g., quantity, weight, volume), and expiry dates.

For expiry dates, try to find a date in YYYY-MM-DD, DD/MM/YYYY, or DD-MM-YYYY format and convert it to YYYY-MM-DD. If an expiry date is not found, use an empty string.

Return the information as a JSON object with an "extractedProducts" property containing an array of product objects.
Each product object should have 'produto', 'marca', 'unidade', and 'validade' properties.

Expected format:
{
  "extractedProducts": [
    {
      "produto": "Leite Integral",
      "marca": "Laticínios Feliz",
      "unidade": "1L",
      "validade": "2023-12-31"
    },
    {
      "produto": "Biscoito Cream Cracker",
      "marca": "Camil",
      "unidade": "200g",
      "validade": "2024-06-15"
    }
  ]
}

If no products are found, return: {"extractedProducts": []}`
    };

    try {
      // Use gemini15Flash with multimodal prompt array
      const llmResponse = await gemini15Pro.generate({
        prompt: [mediaPart, textPart],
        config: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      });

      const jsonResponse = llmResponse.text();
      console.log("Raw LLM response:", jsonResponse);
      
      // Clean the response - remove any markdown formatting
      let cleanedResponse = jsonResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
      }

      try {
        const parsedResponse = JSON.parse(cleanedResponse);
        
        // Handle case where LLM returns array directly instead of object with extractedProducts
        let normalizedResponse;
        if (Array.isArray(parsedResponse)) {
          normalizedResponse = { extractedProducts: parsedResponse };
        } else if (parsedResponse.extractedProducts) {
          normalizedResponse = parsedResponse;
        } else {
          // Fallback: try to find any array in the response
          const arrayValues = Object.values(parsedResponse).find(val => Array.isArray(val));
          normalizedResponse = { extractedProducts: arrayValues || [] };
        }
        
        // Validate against schema
        const validatedResponse = this.outputSchema.parse(normalizedResponse);
        console.log("Successfully extracted products:", validatedResponse.extractedProducts.length);
        return validatedResponse;
        
      } catch (jsonOrZodError) {
        console.error("Failed to parse or validate JSON from LLM response:", jsonOrZodError);
        console.error("Cleaned response:", cleanedResponse);
        
        // Check for common error patterns
        if (cleanedResponse.startsWith("<!")) {
          throw new Error(`LLM returned HTML-like response`);
        }
        if (cleanedResponse.includes("I cannot") || cleanedResponse.includes("I can't")) {
          throw new Error(`LLM refused to process the image: ${cleanedResponse.substring(0, 100)}`);
        }
        
        // Return empty result as fallback
        console.warn("Returning empty result due to parsing error");
        return { extractedProducts: [] };
      }

    } catch (error) {
      console.error("Error calling Gemini or processing response:", error);
      
      // Add more specific error handling
      if (error.message?.includes('INVALID_ARGUMENT')) {
        throw new Error(`Invalid image format or base64 encoding: ${error.message}`);
      }
      if (error.message?.includes('PERMISSION_DENIED')) {
        throw new Error(`API permission denied. Check your API key and quotas: ${error.message}`);
      }
      if (error.message?.includes('QUOTA_EXCEEDED')) {
        throw new Error(`API quota exceeded: ${error.message}`);
      }
      
      throw error;
    }
  },
});