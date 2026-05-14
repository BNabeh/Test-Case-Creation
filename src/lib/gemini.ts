import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface TestCase {
  id: string;
  title: string;
  type: 'Positive' | 'Negative' | 'Edge' | 'Security' | 'Performance';
  priority: 'P1' | 'P2' | 'P3';
  module: string;
  preconditions: string;
  testData: string;
  steps: string[];
  expectedResult: string;
  actualResult: string;
}

export const generateTestCases = async (scenario: string, imageData?: string): Promise<TestCase[]> => {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `You are a Senior QA Engineer. Your task is to extract business requirements and logic from the provided application description or screenshot.
  If a screenshot is provided, analyze the UI elements, form fields, buttons, and overall flow to infer business rules (e.g., required fields, data formats, navigation paths).
  
  Generate a comprehensive suite of test cases that cover:
  1. Positive Scenarios (Happy path, successful completion)
  2. Negative Scenarios (Error handling, invalid inputs, unauthorized access)
  3. Edge Cases (Boundary values, extreme conditions, unexpected states)
  4. Security (SQL injection, XSS, unauthorized access attempts)
  5. Performance (Load times, bulk processing, high concurrency)
  
  Assign a priority (P1: Critical, P2: High, P3: Medium) and a module name (the functional area) to each case.
  Include internal consistency and cover preconditions and relevant test data.
  
  Return the output as a JSON array of objects with the following structure:
  {
    "id": "TC-001",
    "title": "Short descriptive title",
    "type": "Positive" | "Negative" | "Edge" | "Security" | "Performance",
    "priority": "P1" | "P2" | "P3",
    "module": "Functional Area Name",
    "preconditions": "What must be true before starting",
    "testData": "Specific values to use",
    "steps": ["Step 1", "Step 2", ...],
    "expectedResult": "Detailed description of what should happen",
    "actualResult": ""
  }`;

  const contents: any[] = [{ text: `Scenario/Description: ${scenario}` }];
  
  if (imageData) {
    contents.push({
      inlineData: {
        mimeType: "image/png",
        data: imageData.split(',')[1] // remove data:image/png;base64,
      }
    });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts: contents },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["Positive", "Negative", "Edge", "Security", "Performance"] },
            priority: { type: Type.STRING, enum: ["P1", "P2", "P3"] },
            module: { type: Type.STRING },
            preconditions: { type: Type.STRING },
            testData: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            expectedResult: { type: Type.STRING },
            actualResult: { type: Type.STRING }
          },
          required: ["id", "title", "type", "priority", "module", "preconditions", "testData", "steps", "expectedResult", "actualResult"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse AI response as JSON", e);
    return [];
  }
};
