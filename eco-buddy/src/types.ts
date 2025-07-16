
export type Advisor = 'scientist' | 'elder' | 'nature' | 'ai';

export interface CurrentActivityAnalysis {
  harm: string; // The negative impact of the current choice.
  emissionAnalogy: string; // A relatable analogy for the emissions cost.
  futureImpact: string; // The long-term consequences.
}

export interface Suggestion {
  title: string;
  description: string;
  positiveImpact: number; // A score from 1 (small improvement) to 5 (major improvement)
  pros: string[];
  cons: string[];
  imageQuery: string;
  emissionReductionAnalogy: string; // A relatable analogy for the positive change.
}

export interface AnalysisResponse {
  overallSummary: string;
  currentActivityAnalysis: CurrentActivityAnalysis;
  suggestions: Suggestion[];
}
