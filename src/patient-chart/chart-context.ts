import { openmrsFetch } from '@openmrs/esm-framework';
import type { AiChartAssistantConfig } from '../config-schema';
import type { PatientContext } from '../api/types';

interface OpenMrsListResponse<T> {
  results?: Array<T>;
}

export function getPatientUuidFromPath(pathname = window.location.pathname) {
  const match = pathname.match(/\/patient\/([^/]+)\/chart/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function fetchData<T>(url: string): Promise<T | null> {
  try {
    const response = await openmrsFetch<T>(url);
    return response.data;
  } catch (error) {
    return null;
  }
}

function listResults<T>(response: OpenMrsListResponse<T> | null): Array<T> {
  return response?.results ?? [];
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function uniqueItems(items: Array<string>) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.toLowerCase();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function isNoiseLine(line: string) {
  return [
    /^ai assistant\b/i,
    /^assistant ia\b/i,
    /^tasks and chart guidance/i,
    /^taches et aide/i,
    /^connected$/i,
    /^connecte$/i,
    /^clinical encounter$/i,
    /^open chart$/i,
    /^lab process$/i,
    /^dispensing$/i,
    /^registration$/i,
    /^queue patient$/i,
    /^consultation clinique$/i,
    /^ouvrir dossier$/i,
    /^laboratoire$/i,
    /^dispensation$/i,
    /^enregistrement$/i,
    /^file d'attente$/i,
    /^good (morning|afternoon|evening),/i,
    /^bonjour,/i,
    /^bon apres-midi,/i,
    /^bonsoir,/i,
    /^notifications$/i,
    /^change$/i,
    /^modifier$/i,
    /^password$/i,
    /^logout$/i,
    /^english$/i,
    /^francais$/i,
    /^français$/i,
    /^super user$/i,
    /^in-patient$/i,
    /^radiology and imaging$/i,
    /^procedures$/i,
    /^prescription$/i,
    /^sources$/i,
    /^show:/i,
    /^active$/i,
    /^add$/i,
    /^\+$/,
    /^items per page/i,
    /^\d+[-–]\d+ of \d+ items/i,
    /^\d+\s*\/\s*\d+\s*items?/i,
    /^\d+$/,
    /^page of \d+ page/i,
    /^of \d+ page/i,
    /^see all$/i,
    /^comments$/i,
    /^\|+$/,
    /^--$/,
    /^check the filters/i,
    /^no .*display/i,
    /^there are no/i,
    /^aucun/i,
    /^aucune/i,
    /^condition$/i,
    /^date of onset$/i,
    /^status$/i,
    /^complaint$/i,
    /^duration$/i,
    /^onset$/i,
    /^allergen$/i,
    /^reaction$/i,
    /^severity$/i,
    /^medication$/i,
    /^medications$/i,
    /^drug$/i,
    /^order$/i,
    /^orders$/i,
    /^laboratory$/i,
    /^lab orders?$/i,
    /^test$/i,
    /^result$/i,
  ].some((pattern) => pattern.test(line));
}

function getBodyTextWithoutAssistant() {
  const assistantElements = Array.from(document.querySelectorAll<HTMLElement>('[data-ai-chart-assistant]'));
  const previousDisplay = assistantElements.map((element) => element.style.display);

  assistantElements.forEach((element) => {
    element.style.display = 'none';
  });

  const text = document.body.innerText || '';

  assistantElements.forEach((element, index) => {
    element.style.display = previousDisplay[index];
  });

  return text;
}

function getVisibleLines() {
  return getBodyTextWithoutAssistant()
    .split(/\n+/)
    .map((line) => normalizeText(line))
    .filter(Boolean);
}

function getVisibleSectionItems(sectionNames: Array<string>, nextSectionNames: Array<string>) {
  const lines = getVisibleLines();
  const startIndex = lines.findIndex((line) => sectionNames.some((name) => line.toLowerCase() === name.toLowerCase()));

  if (startIndex < 0) {
    return [];
  }

  const endIndex = lines.findIndex(
    (line, index) => index > startIndex && nextSectionNames.some((name) => line.toLowerCase() === name.toLowerCase()),
  );

  return uniqueItems(
    lines
      .slice(startIndex + 1, endIndex > startIndex ? endIndex : startIndex + 30)
      .filter((line) => !isNoiseLine(line) && line.length < 180),
  ).slice(0, 10);
}

function collectVisibleSummary(): PatientContext['visibleSummary'] {
  return {
    complaints: getVisibleSectionItems(['Complaints', 'Plaintes'], ['Conditions', 'Conditions medicales', 'Conditions médicales', 'Allergies']),
    conditions: getVisibleSectionItems(['Conditions', 'Conditions medicales', 'Conditions médicales'], ['Allergies', 'Allergy', 'Vitals', 'Signes vitaux']),
    allergies: getVisibleSectionItems(
      ['Allergies', 'Allergy', 'Allergies et intolerances', 'Allergies et intolérances'],
      ['Vitals', 'Signes vitaux', 'Care Panel', 'Panneau de soins', 'AI Assistant', 'Assistant IA'],
    ),
    medications: getVisibleSectionItems(
      ['Medications', 'Medication', 'Prescriptions', 'Prescription', 'Ordonnance', 'Medicaments', 'Médicaments'],
      ['Labs', 'Laboratory', 'Lab orders', 'Results', 'Allergies', 'Conditions', 'AI Assistant', 'Assistant IA'],
    ),
    labs: getVisibleSectionItems(
      ['Labs', 'Laboratory', 'Lab orders', 'Results', 'Laboratoire', 'Resultats', 'Résultats'],
      ['Medications', 'Prescriptions', 'Conditions', 'Allergies', 'AI Assistant', 'Assistant IA'],
    ),
  };
}

function collectVisibleVitals(): Array<PatientContext['observations'][number]> {
  const lines = getVisibleLines();
  const vitalDateLine = lines.find((line) => /\d{1,2}[-/][A-Za-z]{3}[-/]\d{4}|\d{1,2}\/\d{1,2}\/\d{4}/.test(line));
  const patterns = [
    { label: 'Blood pressure', regex: /^(BP|TA)\b/i },
    { label: 'Heart rate', regex: /^(Heart rate|Frequence cardiaque|Fréquence cardiaque)\b/i },
    { label: 'Respiratory rate', regex: /^(R\.?\s*rate|Respiratory rate|Frequence respi|Fréquence respi)\b/i },
    { label: 'SpO2', regex: /^SpO2\b/i },
    { label: 'Temperature', regex: /^(Temp|Temperature)\b/i },
    { label: 'Weight', regex: /^(Weight|Poids)\b/i },
    { label: 'Height', regex: /^(Height|Taille)\b/i },
    { label: 'BMI', regex: /^(BMI|IMC)\b/i },
  ];
  const vitals: Array<PatientContext['observations'][number]> = [];
  const seen = new Set<string>();

  function nextValue(index: number) {
    for (let offset = 1; offset <= 3; offset += 1) {
      const candidate = lines[index + offset];

      if (candidate && /\d/.test(candidate) && !/^\d+\s+of\s+\d+/i.test(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  lines.forEach((line, index) => {
    patterns.forEach((pattern) => {
      if (seen.has(pattern.label) || !pattern.regex.test(line)) {
        return;
      }

      const value = nextValue(index);

      if (!value) {
        return;
      }

      seen.add(pattern.label);
      vitals.push({
        concept: { display: pattern.label },
        display: pattern.label,
        obsDatetime: vitalDateLine || undefined,
        value,
      });
    });
  });

  return vitals;
}

export async function getPatientContext(
  patientUuid: string | null,
  config: Pick<AiChartAssistantConfig, 'maxRecentEncounters' | 'maxRecentObs'>,
): Promise<PatientContext | null> {
  if (!patientUuid) {
    return null;
  }

  const encodedUuid = encodeURIComponent(patientUuid);
  const patientUrl = `/ws/rest/v1/patient/${encodedUuid}?v=custom:(uuid,display,person:(display,gender,age,birthdate),identifiers:(identifier,identifierType:(display)))`;
  const encountersUrl = `/ws/rest/v1/encounter?patient=${encodedUuid}&limit=${config.maxRecentEncounters}&v=custom:(uuid,display,encounterDatetime,encounterType:(display),location:(display),form:(display),obs:(uuid,display,obsDatetime,concept:(display),value))`;
  const activeVisitUrl = `/ws/rest/v1/visit?patient=${encodedUuid}&includeInactive=false&v=custom:(uuid,display,startDatetime,stopDatetime,visitType:(display),location:(display),encounters:(uuid,display,encounterDatetime,encounterType:(display),form:(display),location:(display)))`;
  const conditionsUrl = `/ws/rest/v1/condition?patient=${encodedUuid}&v=custom:(uuid,display,condition:(display),clinicalStatus,verificationStatus,onsetDate,dateCreated)`;
  const allergiesUrl = `/ws/rest/v1/patient/${encodedUuid}/allergy?v=custom:(uuid,display,allergen:(codedAllergen:(display),nonCodedAllergen),severity:(display),reaction:(reaction:(display)))`;
  const ordersUrl = `/ws/rest/v1/order?patient=${encodedUuid}&limit=20&v=custom:(uuid,display,orderNumber,accessionNumber,orderType:(display),concept:(display),drug:(display),dateActivated,autoExpireDate,action,urgency,fulfillerStatus,orderer:(display))`;
  const obsUrl = `/ws/rest/v1/obs?patient=${encodedUuid}&limit=${config.maxRecentObs}&v=custom:(uuid,display,obsDatetime,concept:(display),value,encounter:(uuid,display,encounterDatetime,encounterType:(display),form:(display)))`;

  const [patient, encounters, activeVisits, conditions, allergies, orders, observations] = await Promise.all([
    fetchData<PatientContext['patient']>(patientUrl),
    fetchData<OpenMrsListResponse<PatientContext['encounters'][number]>>(encountersUrl),
    fetchData<OpenMrsListResponse<PatientContext['activeVisits'][number]>>(activeVisitUrl),
    fetchData<OpenMrsListResponse<PatientContext['conditions'][number]>>(conditionsUrl),
    fetchData<OpenMrsListResponse<PatientContext['allergies'][number]>>(allergiesUrl),
    fetchData<OpenMrsListResponse<PatientContext['orders'][number]>>(ordersUrl),
    fetchData<OpenMrsListResponse<PatientContext['observations'][number]>>(obsUrl),
  ]);

  return {
    patient,
    encounters: listResults(encounters),
    activeVisits: listResults(activeVisits),
    conditions: listResults(conditions),
    allergies: listResults(allergies),
    orders: listResults(orders),
    observations: listResults(observations),
    visibleSummary: collectVisibleSummary(),
    visibleVitals: collectVisibleVitals(),
  };
}
