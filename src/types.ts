export type PersonalityType = 'TDI' | 'TJI' | 'NDI' | 'NJI' | 'TDR' | 'TJR' | 'NDR' | 'NJR';

export interface PersonalityProfile {
  id: PersonalityType;
  name: string;
  tagline: string;
  combination: string;
  overview: string;
  desires: string;
  whatSheWants: string;
  whatToAvoid: string[];
  howSheGetsWhatSheWants: string;
  keyTraits: string[];
  ets: string[]; // Emotional Trigger Sequence
  strategy: {
    ignition: string;
    ignitionExample: string;
    ignitionScenario: string;
    momentum: string;
    momentumExample: string;
    momentumScenario: string;
    connection: string;
    connectionExample: string;
    connectionScenario: string;
    bonding: string;
    bondingExample: string;
    bondingScenario: string;
  };
  physicality: {
    bodyLanguage: string;
    bodyLanguageExample: string;
    bodyLanguageScenario: string;
    touch: string;
    touchExample: string;
    touchScenario: string;
    sex: string;
    sexExample: string;
    sexScenario: string;
  };
  dating: {
    venues: string;
    activities: string;
    rules: string;
    ideas: string[];
  };
  quickWins: string[];
  devotionTriggers: string[];
  redFlags: string[];
  compatibility: string;
  coldReads: string[];
  relationshipAdvice: {
    vision: string;
    investment: string;
    potential: string;
  };
  freakDynamics: {
    kink: string;
    threesomes: string;
    worship: string;
  };
  darkMindBreakdown: string;
  behavioralBlueprint: string;
}

export interface GuideSection {
  id: string;
  title: string;
  content: string;
}
