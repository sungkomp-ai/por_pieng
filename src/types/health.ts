export interface HealthProfile {
  fullName: string;
  citizenId: string;
  age: string;
  gender: string;
  startDate: string;
  address: string;
  phone: string;
  mainHealthIssues: string;
}

export interface MetricMonthly {
  before: string | number;
  m1: string | number;
  m2: string | number;
  m3: string | number;
  m4: string | number;
  m5: string | number;
  m6: string | number;
}

export interface VitalsData {
  weight: MetricMonthly;
  bp: MetricMonthly;
  fbs: MetricMonthly;
  waist: MetricMonthly;
  sleep: MetricMonthly;
}

export interface Med9PillRecord {
  before: string;
  m1: string;
  m2: string;
  m3: string;
  m4: string;
  m5: string;
  m6: string;
  observation: string;
  image?: string;
}

export type Med9Data = Record<'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7' | 'p8' | 'p9', Med9PillRecord>;

export interface IndicatorsData {
  comfort: MetricMonthly;
  lightness: MetricMonthly;
  vitality: MetricMonthly;
}

export interface HolisticData {
  mental: MetricMonthly[];
  spiritual: MetricMonthly[];
  social: MetricMonthly[];
  economic: MetricMonthly[];
}

export interface HolisticDimensionNotes {
  mental: string;
  spiritual: string;
  social: string;
  economic: string;
}

export interface MonthlyJournalEntry {
  success: string;
  obstacle: string;
  goal: string;
}

export type JournalData = Record<'m1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6', MonthlyJournalEntry>;

export interface HealthData {
  profile: HealthProfile;
  vitalsData: VitalsData;
  vitalsNotes: string;
  med9Data: Med9Data;
  med9Notes: string;
  indicatorsData: IndicatorsData;
  indicatorNotes: string;
  holisticData: HolisticData;
  holisticDimensionNotes: HolisticDimensionNotes;
  holisticNotes: string;
  journalData: JournalData;
}
