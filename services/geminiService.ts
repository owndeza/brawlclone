
import { GoogleGenAI, Type } from "@google/genai";
import { Brawler, AttackType } from "../types";

// Always use the process.env.API_KEY directly and with the specified naming convention.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBrawler = async (): Promise<Brawler | null> => {
  try {
    // Using gemini-3-flash-preview for the generation task
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Create a unique and creative hero character (brawler) for a battle arena game. Give them a cool name, a class, and description.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING },
            description: { type: Type.STRING },
            superAbility: { type: Type.STRING },
            color: { type: Type.STRING, description: "A hex color code representing the brawler" },
            preferredStyle: { type: Type.STRING, enum: ["MELEE", "SPREAD", "PROJECTILE"] }
          },
          required: ["name", "type", "description", "superAbility", "color", "preferredStyle"]
        }
      }
    });

    // response.text is a property, not a method.
    const data = JSON.parse(response.text || '{}');
    
    // Map stats based on style
    const styleMap = {
      MELEE: { hp: 6000, speed: 5.2, damage: 700, range: 140, attackType: AttackType.MELEE },
      SPREAD: { hp: 3800, speed: 4.6, damage: 350, range: 350, attackType: AttackType.SPREAD },
      PROJECTILE: { hp: 3000, speed: 4.4, damage: 500, range: 600, attackType: AttackType.PROJECTILE }
    };

    const stats = styleMap[data.preferredStyle as keyof typeof styleMap] || styleMap.PROJECTILE;

    return {
      id: `gen-${Date.now()}`,
      name: data.name,
      type: data.type,
      description: data.description,
      superAbility: data.superAbility,
      color: data.color || '#ffffff',
      hp: stats.hp,
      maxHp: stats.hp,
      speed: stats.speed,
      attackType: stats.attackType,
      damage: stats.damage,
      range: stats.range,
      reloadSpeed: 1.5
    };
  } catch (error) {
    console.error("Gemini generation failed:", error);
    return null;
  }
};

export const generateMatchCommentary = async (winner: string, stats: any): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a short, hype victory/defeat message for a brawl game. Team ${winner} won. Stats: ${JSON.stringify(stats)}. Make it snappy and aggressive like a sports commentator.`,
    });
    // response.text is a property, not a method.
    return response.text || (winner === 'blue' ? "Victory is yours!" : "Defeat... Try again!");
  } catch (error) {
    return winner === 'blue' ? "Victory is yours!" : "Defeat... Try again!";
  }
};
