import { GoogleGenAI, Type } from "@google/genai";

export const GeminiService = {
  analyzeSymptoms: async (symptoms: string, patientHistory: string[]): Promise<string> => {
    // Create a new GoogleGenAI instance right before making an API call to ensure it uses the most up-to-date environment key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const prompt = `
        Tu es un assistant médical expérimenté pour un médecin généraliste au Maroc.
        
        Contexte Patient:
        Antécédents: ${patientHistory.join(', ') || 'Aucun'}
        
        Symptômes actuels rapportés:
        ${symptoms}
        
        Tâche:
        1. Propose 3 diagnostics différentiels probables.
        2. Suggère les examens complémentaires pertinents si nécessaire.
        3. Propose une ligne de traitement standard.
        
        Réponds de manière concise, structurée en Markdown, en français médical professionnel.
      `;

      // Use 'gemini-3-flash-preview' for basic text tasks as per recommendations
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      // The text property returns the generated string output directly (not a method)
      return response.text || "Aucune analyse générée.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Erreur lors de l'analyse. Vérifiez votre connexion internet.";
    }
  },

  generatePrescriptionSuggestion: async (diagnosis: string): Promise<string[]> => {
    // Create a new GoogleGenAI instance right before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const prompt = `
            Pour le diagnostic suivant : "${diagnosis}", suggère une liste de médicaments (DCI + Dosage + Posologie courte) couramment prescrits au Maroc.
            Ne mets pas de texte introductif, juste la liste JSON.
        `;

        // Use 'gemini-3-flash-preview' for text-based tasks
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
            }
        });

        // Extract the JSON string from the .text property
        const text = response.text;
        if(text) return JSON.parse(text);
        return [];
    } catch (e) {
        console.error(e);
        return ["Erreur de suggestion (Vérifiez la clé API)"];
    }
  }
};
