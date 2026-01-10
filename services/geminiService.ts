
import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = (): string => {
  try {
    // @ts-ignore
    return (typeof process !== 'undefined' && process.env && process.env.API_KEY) || "";
  } catch (e) {
    return "";
  }
};

export const GeminiService = {
  analyzeSymptoms: async (symptoms: string, patientHistory: string[]): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return "Clé IA non configurée.";
    
    const ai = new GoogleGenAI({ apiKey });
    
    try {
      const prompt = `
        Tu es un expert médical de haut niveau exerçant au Maroc. 
        Analyse les symptômes suivants en tenant compte des antécédents du patient.
        
        CONTEXTE PATIENT :
        - Antécédents : ${patientHistory.length > 0 ? patientHistory.join(', ') : 'Aucun'}
        
        SYMPTÔMES ACTUELS :
        ${symptoms}
        
        INSTRUCTIONS :
        1. Propose 3 hypothèses de diagnostics.
        2. Recommande les examens complémentaires.
        3. Propose une conduite à tenir.
        
        Réponds en Markdown, français, de manière professionnelle.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 4000 },
          temperature: 0.2,
        },
      });

      return response.text || "Erreur de génération d'analyse.";
    } catch (error: any) {
      console.error("Gemini Error:", error);
      return "Service IA momentanément indisponible.";
    }
  },

  generatePrescriptionSuggestion: async (diagnosis: string): Promise<string[]> => {
    const apiKey = getApiKey();
    if (!apiKey) return [];
    
    const ai = new GoogleGenAI({ apiKey });

    try {
        const prompt = `
            Suggère une liste de médicaments (DCI + Dosage + Posologie) pour un diagnostic de "${diagnosis}".
            Retourne UNIQUEMENT un tableau JSON de chaînes.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                temperature: 0.1
            }
        });

        const text = response.text;
        return text ? JSON.parse(text.trim()) : [];
    } catch (e) {
        return [];
    }
  }
};
