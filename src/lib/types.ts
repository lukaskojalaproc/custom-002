export type Reliability = 'aukštas' | 'vidutinis' | 'žemas';

export type ProjectType =
  | 'Komercinis'
  | 'Gyvenamasis'
  | 'Logistikos / pramoninis'
  | 'Viešasis'
  | 'Viešbučių / turizmo';

export interface Certification {
  name: string;
  validUntil: string;
}

export interface Contractor {
  id: string;
  name: string;
  companyCode: string;
  city: string;
  specializations: ProjectType[];
  certifications: Certification[];
  reliability: Reliability;
  contactPerson: string;
  email: string;
  phone: string;
  employees: number;
  revenueM: number;
  source: string;
  marketInfo: string;
  notes: string;
  addedAt: string;
}

export type DocStatus = 'nepradėta' | 'rengiama' | 'paruošta';

export interface DocFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  version: number;
}

export interface PackageDoc {
  key: string;
  status: DocStatus;
  files: DocFile[];
}

export type ParticipationStatus = 'atrinktas' | 'pakviestas' | 'patvirtino' | 'atsisakė' | 'pateikė';

export interface Participant {
  contractorId: string;
  status: ParticipationStatus;
  respondedAt?: string;
  reason?: string;
}

export type QuestionCategory = 'Techninis' | 'Komercinis' | 'Teisinis';

export interface Question {
  id: string;
  contractorId: string;
  askedAt: string;
  category: QuestionCategory;
  topic: string;
  text: string;
  answer?: string;
  answeredAt?: string;
  sentToAll: boolean;
  relatedDoc: string;
}

export type EstimateStatus = 'pateikta' | 'nepateikta' | 'nepilna';
export type OfferStatus = 'tinkamas' | 'tikslintinas' | 'atmestinas';

export interface InitialOffer {
  contractorId: string;
  receivedAt: string;
  priceNet: number;
  durationMonths: number;
  estimate: EstimateStatus;
  schedule: 'pateiktas' | 'nepateiktas';
  contractRemarks: boolean;
  technicalReservations: boolean;
  qualificationDocs: 'pateikti' | 'trūksta';
  status: OfferStatus;
  notes: string;
}

export interface AnalysisRecord {
  checks: Record<string, boolean>;
  comment: string;
  toNegotiation: boolean | null;
}

export interface CommercialItem {
  id: string;
  contractorId: string;
  topic: string;
  agreement: string;
  priceImpact: number;
}

export type ClauseStatus = 'sutarta' | 'atvira' | 'atmesta';

export interface LegalItem {
  id: string;
  contractorId: string;
  topic: string;
  original: string;
  proposed: string;
  agreed: string;
  status: ClauseStatus;
}

export interface Clarification {
  sentAt?: string;
  deadline: string;
  items: Record<string, string>;
}

export interface NegotiationRound {
  n: number;
  startedAt: string;
  meetingDates: Record<string, string>;
  commercial: CommercialItem[];
  legal: LegalItem[];
  clarification?: Clarification;
}

export type LevelState = 'įtraukta' | 'neįtraukta' | 'išlyga';

export interface LevelingCell {
  state: LevelState;
  amount: number;
}

export interface LevelingRow {
  id: string;
  area: string;
  description: string;
  cells: Record<string, LevelingCell>;
}

export interface FinalOffer {
  contractorId: string;
  receivedAt: string;
  priceNet: number;
  durationMonths: number;
  contractRemarks: 'likusios' | 'panaikintos';
  risks: string;
  certification: 'atitinka' | 'neatitinka';
  reliability: Reliability;
  recommendation: 'kviesti' | 'atmesti' | 'svarstyti';
}

export type CriterionKey = 'price' | 'timeCost' | 'schedule' | 'contract' | 'qualification' | 'reliability';

export interface Evaluation {
  weights: Record<CriterionKey, number>;
  monthlyTimeCost: number;
  overrides: Record<string, Partial<Record<CriterionKey, number>>>;
}

export interface Selection {
  winnerId?: string;
  justification: string;
  decidedAt?: string;
  approvedBy?: string;
  considerations: Record<string, boolean>;
}

export interface ActivityEntry {
  at: string;
  text: string;
}

export interface Tender {
  id: string;
  code: string;
  name: string;
  projectType: ProjectType;
  location: string;
  areaM2: number;
  budgetNet: number;
  manager: string;
  description: string;
  createdAt: string;
  currentStep: number;
  completedSteps: number[];
  participants: Participant[];
  documents: PackageDoc[];
  invitation: {
    sentAt?: string;
    offerDeadline: string;
    questionsDeadline: string;
    message: string;
  };
  questions: Question[];
  initialOffers: InitialOffer[];
  analysis: Record<string, AnalysisRecord>;
  rounds: NegotiationRound[];
  leveling: LevelingRow[];
  finalOffers: FinalOffer[];
  evaluation: Evaluation;
  selection: Selection;
  archivedAt?: string;
  activity: ActivityEntry[];
}

export interface User {
  name: string;
  email: string;
  role: string;
}

export interface AppState {
  version: number;
  contractors: Contractor[];
  tenders: Tender[];
  user: User | null;
}
