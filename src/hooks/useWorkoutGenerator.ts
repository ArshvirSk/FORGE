import { useState } from 'react';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { DEFAULT_EXERCISES } from '@/constants/exerciseLibrary';
import type { GymPreferences } from '@/store/gymTypes';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export interface GeneratedExercise {
  exerciseName: string;
  isNew: boolean;
  sets: number;
  repsRange: string;
  restSeconds: number;
  notes?: string;
}

export interface GeneratedWorkoutDay {
  day: string; // "Monday", "Tuesday", etc.
  dayIndex: number; // 1 = Monday, 7 = Sunday
  isRestDay: boolean;
  workoutName?: string;
  exercises?: GeneratedExercise[];
}

export interface GeneratedPlan {
  planName: string;
  weekStructure: GeneratedWorkoutDay[];
  reasoning: string;
}

export function useWorkoutGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePlan = async (preferences: GymPreferences): Promise<GeneratedPlan | null> => {
    if (!apiKey) {
      setError('Gemini API key is missing from environment variables.');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      const schema = {
        type: SchemaType.OBJECT,
        properties: {
          planName: { type: SchemaType.STRING },
          reasoning: { type: SchemaType.STRING, description: "Short explanation of why this split/structure fits their goals" },
          weekStructure: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                day: { type: SchemaType.STRING, description: "Day of the week (e.g. Monday)" },
                dayIndex: { type: SchemaType.INTEGER, description: "1 for Monday, 7 for Sunday" },
                isRestDay: { type: SchemaType.BOOLEAN },
                workoutName: { type: SchemaType.STRING, nullable: true },
                exercises: {
                  type: SchemaType.ARRAY,
                  nullable: true,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      exerciseName: { type: SchemaType.STRING, description: "Must match existing library name, or marked isNew: true" },
                      isNew: { type: SchemaType.BOOLEAN },
                      sets: { type: SchemaType.INTEGER },
                      repsRange: { type: SchemaType.STRING },
                      restSeconds: { type: SchemaType.INTEGER },
                      notes: { type: SchemaType.STRING, nullable: true }
                    },
                    required: ["exerciseName", "isNew", "sets", "repsRange", "restSeconds"]
                  }
                }
              },
              required: ["day", "dayIndex", "isRestDay"]
            }
          }
        },
        required: ["planName", "reasoning", "weekStructure"]
      } as any;

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.7,
        }
      });

      const existingExercises = DEFAULT_EXERCISES.map(e => e.name).join(', ');
      
      const prompt = `You are an expert fitness coach. Create a weekly workout plan for a user with the following preferences:
- Primary Goal: ${preferences.primaryGoal}
- Experience Level: ${preferences.experienceLevel}
- Days Per Week Available: ${preferences.daysPerWeek.join(', ')} (1=Mon ... 7=Sun)
- Target Session Duration: ${preferences.sessionDuration} minutes
- Available Equipment: ${preferences.equipment.join(', ')}
- Split Preference: ${preferences.splitPreference}
- Injuries/Limitations: ${preferences.limitations || 'None'}
- Exercises to Avoid (IDs): ${preferences.avoidExercises.join(', ') || 'None'}

Here is our existing exercise library (use exact names if possible): 
[${existingExercises}]

Requirements:
1. Generate a FULL WEEKLY PLAN (7 days, dayIndex 1 to 7).
2. Explicitly mark rest days with isRestDay: true.
3. For training days, provide a workoutName and a list of exercises.
4. If you recommend an exercise NOT in the library above, set isNew to true.
5. Provide realistic restSeconds based on the primary goal (e.g., 90-180s for strength, 60-90s for hypertrophy).
6. Provide a VERY SHORT reasoning (max 2 concise sentences) explaining why this fits their profile. Be direct and brief.

Return the response as a pure JSON object matching this TypeScript interface structure:
{
  planName: string;
  reasoning: string;
  weekStructure: {
    day: string;
    dayIndex: number;
    isRestDay: boolean;
    workoutName?: string;
    exercises?: {
      exerciseName: string;
      isNew: boolean;
      sets: number;
      repsRange: string;
      restSeconds: number;
      notes?: string;
    }[];
  }[];
}`;

      console.log('[AI] Starting generation via REST API...');
      
      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        console.log('[AI] Response received!');
        
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error('Invalid response structure from Gemini API');
        }
        
        console.log('[AI] Parsing response...');
        // Clean up markdown block if the model included it
        const cleanedText = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsedPlan = JSON.parse(cleanedText) as GeneratedPlan;

        setIsLoading(false);
        return parsedPlan;
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Generation timed out (REST API). Please try again.');
        }
        throw fetchError;
      }
    } catch (err: any) {
      console.error('Workout generation failed:', err);
      setError(err.message || 'Failed to generate workout plan. Please try again.');
      setIsLoading(false);
      return null;
    }
  };

  return {
    generatePlan,
    isLoading,
    error
  };
}
