export interface OpenMrsReference {
  uuid?: string;
  display?: string;
}

export interface OpenMrsPatient {
  uuid: string;
  display?: string;
  person?: {
    display?: string;
    gender?: string;
    age?: number;
    birthdate?: string;
  };
  identifiers?: Array<{
    identifier: string;
    identifierType?: OpenMrsReference;
  }>;
}

export interface OpenMrsObs {
  uuid?: string;
  display?: string;
  obsDatetime?: string;
  concept?: OpenMrsReference;
  value?: unknown;
  encounter?: OpenMrsEncounter;
}

export interface OpenMrsEncounter {
  uuid?: string;
  display?: string;
  encounterDatetime?: string;
  encounterType?: OpenMrsReference;
  location?: OpenMrsReference;
  form?: OpenMrsReference;
  obs?: Array<OpenMrsObs>;
}

export interface OpenMrsVisit {
  uuid?: string;
  display?: string;
  startDatetime?: string;
  stopDatetime?: string;
  visitType?: OpenMrsReference;
  location?: OpenMrsReference;
  encounters?: Array<OpenMrsEncounter>;
}

export interface OpenMrsCondition {
  uuid?: string;
  display?: string;
  condition?: OpenMrsReference;
  clinicalStatus?: string;
  verificationStatus?: string;
  onsetDate?: string;
  dateCreated?: string;
}

export interface OpenMrsAllergy {
  uuid?: string;
  display?: string;
  allergen?: {
    codedAllergen?: OpenMrsReference;
    nonCodedAllergen?: string;
  };
  severity?: OpenMrsReference;
  reaction?: Array<{
    reaction?: OpenMrsReference;
  }>;
}

export interface OpenMrsOrder {
  uuid?: string;
  display?: string;
  orderNumber?: string;
  accessionNumber?: string;
  orderType?: OpenMrsReference;
  concept?: OpenMrsReference;
  drug?: OpenMrsReference;
  dateActivated?: string;
  autoExpireDate?: string;
  action?: string;
  urgency?: string;
  fulfillerStatus?: string;
  orderer?: OpenMrsReference;
  dose?: number;
  doseUnits?: OpenMrsReference;
  frequency?: OpenMrsReference;
  quantity?: number;
  quantityUnits?: OpenMrsReference;
}

export interface PatientContext {
  patient: OpenMrsPatient | null;
  encounters: Array<OpenMrsEncounter>;
  activeVisits: Array<OpenMrsVisit>;
  conditions: Array<OpenMrsCondition>;
  allergies: Array<OpenMrsAllergy>;
  orders: Array<OpenMrsOrder>;
  observations: Array<OpenMrsObs>;
  visibleSummary?: {
    complaints?: Array<string>;
    conditions?: Array<string>;
    allergies?: Array<string>;
    vitals?: Array<string>;
    medications?: Array<string>;
    labs?: Array<string>;
  };
  visibleVitals?: Array<OpenMrsObs>;
}

export interface AssistantMessage {
  title: string;
  answer: string;
  steps?: Array<string>;
  sections?: Array<{
    title: string;
    items: Array<string>;
  }>;
  suggestions?: Array<string>;
  sources?: Array<string>;
  mode?: string;
}

export interface ChatRequest {
  conversationId: string;
  message: string;
  locale: string;
  route: string;
  patientUuid?: string | null;
  patientContext?: PatientContext | null;
  userContext?: unknown;
}

export interface ChatResponse {
  conversationId: string;
  message: AssistantMessage;
}
