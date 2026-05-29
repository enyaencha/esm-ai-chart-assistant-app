import type {
  AssistantMessage,
  OpenMrsAllergy,
  OpenMrsCondition,
  OpenMrsEncounter,
  OpenMrsObs,
  OpenMrsOrder,
  PatientContext,
} from '../api/types';

function normalizeLocale(locale?: string) {
  return String(locale || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

function displayConcept(value: unknown) {
  if (value == null) {
    return '';
  }

  if (typeof value === 'object') {
    const item = value as { display?: string; name?: string; uuid?: string };
    return item.display || item.name || item.uuid || JSON.stringify(value);
  }

  return String(value);
}

function formatDate(value?: string) {
  return value ? String(value).slice(0, 10) : 'unknown date';
}

function getEncounterName(encounter: OpenMrsEncounter) {
  return encounter.encounterType?.display || encounter.form?.display || encounter.display || 'Encounter';
}

function latestByDate<T>(items: Array<T>, dateSelector: (item: T) => string | undefined) {
  return items
    .slice()
    .sort((left, right) => new Date(dateSelector(right) || 0).getTime() - new Date(dateSelector(left) || 0).getTime())[0];
}

function uniqueBy<T>(items: Array<T>, keySelector: (item: T) => string) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = String(keySelector(item) || '').toLowerCase();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normalizeClinicalLine(value: string) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+\|\s+/g, ' ')
    .trim();
}

function isNoisySummaryLine(value: string) {
  const text = normalizeClinicalLine(value);

  return (
    !text ||
    text.length > 180 ||
    /^\d+$/.test(text) ||
    /^\|+$/.test(text) ||
    /^--$/.test(text) ||
    /^ai assistant\b/i.test(text) ||
    /^assistant ia\b/i.test(text) ||
    /^tasks and chart guidance/i.test(text) ||
    /^connected$/i.test(text) ||
    /^notifications$/i.test(text) ||
    /^change$/i.test(text) ||
    /^password$/i.test(text) ||
    /^logout$/i.test(text) ||
    /^english$/i.test(text) ||
    /^francais$/i.test(text) ||
    /^super user$/i.test(text) ||
    /^in-patient$/i.test(text) ||
    /^radiology and imaging$/i.test(text) ||
    /^procedures$/i.test(text) ||
    /^prescription$/i.test(text) ||
    /^clinical encounter$/i.test(text) ||
    /^open chart$/i.test(text) ||
    /^lab process$/i.test(text) ||
    /^dispensing$/i.test(text) ||
    /^registration$/i.test(text) ||
    /^queue patient$/i.test(text) ||
    /^sources$/i.test(text) ||
    /^items per page/i.test(text) ||
    /^\d+\s*[-–]\s*\d+\s+of\s+\d+\s+items?/i.test(text) ||
    /^\d+\s*\/\s*\d+\s*items?/i.test(text) ||
    /^page of \d+ page/i.test(text) ||
    /^of \d+ page/i.test(text) ||
    /^see all$/i.test(text) ||
    /^show:/i.test(text) ||
    /^active$/i.test(text) ||
    /^add$/i.test(text) ||
    /^condition$/i.test(text) ||
    /^date of onset$/i.test(text) ||
    /^status$/i.test(text) ||
    /^complaint$/i.test(text) ||
    /^duration$/i.test(text) ||
    /^onset$/i.test(text) ||
    /^allergen$/i.test(text) ||
    /^reaction$/i.test(text) ||
    /^severity$/i.test(text)
  );
}

function cleanVisibleSummaryItem(value: string, key: string) {
  let text = normalizeClinicalLine(value)
    .replace(/\s+--$/, '')
    .replace(/^comments\s+/i, '')
    .trim();

  if (isNoisySummaryLine(text)) {
    return '';
  }

  if (key === 'complaints') {
    text = text
      .replace(/\s+\d+\s+\d{1,2}\s*[—–-]\s*[^—–-]+\s*[—–-]\s*\d{4}.*$/i, '')
      .replace(/\s+\d+\s+\d{1,2}\s*[—–-].*$/i, '')
      .trim();
  }

  if (key === 'conditions') {
    text = text
      .replace(/\s+\d{1,2}\s*[—–-]\s*[^—–-]+\s*[—–-]\s*\d{4}\s+(active|inactive|resolved).*$/i, '')
      .replace(/\s+(active|inactive|resolved)$/i, '')
      .trim();
  }

  if (key === 'allergies') {
    text = text.replace(/^comments\s*/i, '').replace(/\s+--$/, '').trim();
  }

  return isNoisySummaryLine(text) ? '' : text;
}

function obsFromContext(patientContext: PatientContext) {
  const directObs = patientContext.observations || [];
  const visibleVitals = patientContext.visibleVitals || [];
  const encounterObs = (patientContext.encounters || []).flatMap((encounter) =>
    (encounter.obs || []).map((obs) => ({
      ...obs,
      encounter,
    })),
  );

  return uniqueBy(visibleVitals.concat(directObs, encounterObs), (obs) =>
    `${formatDate(obs.obsDatetime)}|${obs.concept?.display || obs.display || ''}|${displayConcept(obs.value)}`,
  );
}

function formatObs(obs: OpenMrsObs) {
  const concept = obs.concept?.display;
  const value = displayConcept(obs.value);
  return [concept || obs.display || 'Observation', value].filter(Boolean).join(': ');
}

function isVitalObs(obs: OpenMrsObs) {
  const text = `${obs.display || ''} ${obs.concept?.display || ''}`.toLowerCase();
  return ['blood pressure', 'bp', 'systolic', 'diastolic', 'pulse', 'heart rate', 'temperature', 'temp', 'respiratory', 'respiration', 'spo2', 'oxygen', 'weight', 'height', 'bmi'].some((needle) =>
    text.includes(needle),
  );
}

function isLabObs(obs: OpenMrsObs) {
  const encounterText = `${obs.encounter?.display || ''} ${obs.encounter?.encounterType?.display || ''} ${obs.encounter?.form?.display || ''}`;
  const text = `${obs.display || ''} ${obs.concept?.display || ''} ${encounterText}`.toLowerCase();
  return ['viral load', 'cd4', 'hemoglobin', 'creatinine', 'malaria', 'hiv', 'test result', 'lab', 'laboratory', 'result', 'test order', 'level test'].some((needle) =>
    text.includes(needle),
  );
}

function conditionDisplay(condition: OpenMrsCondition) {
  return condition.condition?.display || condition.display || condition.uuid || 'Condition';
}

function allergyDisplay(allergy: OpenMrsAllergy) {
  const allergen = allergy.allergen || {};
  const name = allergen.codedAllergen?.display || allergen.nonCodedAllergen || allergy.display || 'Allergy';
  const severity = allergy.severity?.display;
  const reactions = (allergy.reaction || []).map((item) => item.reaction?.display).filter(Boolean).join(', ');
  return [name, severity, reactions].filter(Boolean).join(' ');
}

function orderDisplay(order: OpenMrsOrder) {
  return order.display || order.drug?.display || order.concept?.display || 'Order';
}

function orderKind(order: OpenMrsOrder) {
  const text = [order.display, order.orderType?.display, order.concept?.display, order.drug?.display, order.accessionNumber, order.orderNumber]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (order.drug || text.includes('drug') || text.includes('medication') || text.includes('pharmacy')) {
    return 'drug';
  }

  if (text.includes('lab') || text.includes('laboratory') || text.includes('test') || text.includes('cd4') || text.includes('viral load') || text.includes('level')) {
    return 'lab';
  }

  return 'other';
}

function isOrderEncounter(encounter: OpenMrsEncounter) {
  return /\border\b|drug order|lab order/i.test(getEncounterName(encounter));
}

function getLastTriage(patientContext: PatientContext) {
  return latestByDate(
    (patientContext.encounters || []).filter((encounter) => getEncounterName(encounter).toLowerCase().includes('triage')),
    (encounter) => encounter.encounterDatetime,
  );
}

function getActiveVisit(patientContext: PatientContext) {
  return latestByDate(patientContext.activeVisits || [], (visit) => visit.startDatetime);
}

function getRecentVitals(patientContext: PatientContext) {
  return obsFromContext(patientContext)
    .filter(isVitalObs)
    .sort((left, right) => new Date(right.obsDatetime || 0).getTime() - new Date(left.obsDatetime || 0).getTime())
    .slice(0, 8);
}

function getRecentLabs(patientContext: PatientContext) {
  return obsFromContext(patientContext)
    .filter(isLabObs)
    .sort((left, right) => new Date(right.obsDatetime || 0).getTime() - new Date(left.obsDatetime || 0).getTime())
    .slice(0, 8);
}

function getMedicationItems(patientContext: PatientContext) {
  const drugOrders = (patientContext.orders || []).filter((order) => orderKind(order) === 'drug');
  const restItems = drugOrders
    .filter((order) => order.action !== 'DISCONTINUE')
    .sort((left, right) => new Date(right.dateActivated || 0).getTime() - new Date(left.dateActivated || 0).getTime())
    .map((order) => `${formatDate(order.dateActivated)} ${orderDisplay(order)}`);

  return uniqueBy(restItems.length ? restItems : visibleSummaryItems(patientContext, 'medications'), (item) => item);
}

function getLabItems(patientContext: PatientContext) {
  const labs = getRecentLabs(patientContext);
  const labOrders = (patientContext.orders || []).filter((order) => orderKind(order) === 'lab');
  const restItems = labOrders
    .sort((left, right) => new Date(right.dateActivated || 0).getTime() - new Date(left.dateActivated || 0).getTime())
    .map((order) => `${formatDate(order.dateActivated)} ${orderDisplay(order)}`)
    .concat(labs.map((obs) => `${formatDate(obs.obsDatetime)} ${formatObs(obs)}`));

  return uniqueBy(restItems.length ? restItems : visibleSummaryItems(patientContext, 'labs'), (item) => item);
}

function formatEncounter(encounter: OpenMrsEncounter, locale: string) {
  const isFrench = normalizeLocale(locale) === 'fr';
  const location = encounter.location?.display;
  return [formatDate(encounter.encounterDatetime), getEncounterName(encounter), location ? `${isFrench ? 'a' : 'at'} ${location}` : '']
    .filter(Boolean)
    .join(' ');
}

function visibleSummaryItems(
  patientContext: PatientContext,
  key: 'complaints' | 'conditions' | 'allergies' | 'vitals' | 'medications' | 'labs',
) {
  const items = patientContext.visibleSummary?.[key] || [];

  return uniqueBy(
    items.map((item) => cleanVisibleSummaryItem(item, key)).filter(Boolean),
    (item) => item,
  );
}

function getEncounterItems(patientContext: PatientContext, locale: string) {
  return uniqueBy(
    (patientContext.encounters || []).filter((encounter) => !isOrderEncounter(encounter)),
    (encounter) => `${formatDate(encounter.encounterDatetime)}|${getEncounterName(encounter)}|${encounter.location?.display || ''}`,
  )
    .slice(0, 10)
    .map((encounter) => formatEncounter(encounter, locale));
}

function shouldSummarizePatient(message: string) {
  const normalized = message.toLowerCase();
  return ['summary', 'summarize', 'this patient', 'patient context', 'resume', 'resumer', 'ce patient', 'contexte patient'].some((needle) =>
    normalized.includes(needle),
  );
}

export function answerPatientQuestion(message: string, patientContext: PatientContext | null, locale: string): AssistantMessage | null {
  const normalized = String(message || '').toLowerCase();
  const isFrench = normalizeLocale(locale) === 'fr';

  if (!patientContext || !patientContext.patient) {
    return shouldSummarizePatient(message)
      ? {
          title: isFrench ? 'Resume du patient' : 'Patient summary',
          answer: isFrench
            ? "Ouvrez d'abord un dossier patient, puis demandez un resume."
            : 'Open a patient chart first, then ask for a patient summary.',
          steps: isFrench ? ['Recherchez un patient.', 'Ouvrez le dossier patient.', 'Demandez un resume.'] : ['Search for a patient.', 'Open the patient chart.', 'Ask for a summary.'],
          sources: ['Current browser route', 'OpenMRS REST patient endpoint'],
        }
      : null;
  }

  if (normalized.includes('last triage') || normalized.includes('latest triage') || normalized.includes('dernier triage') || normalized.includes('triage')) {
    const triage = getLastTriage(patientContext);

    if (!triage) {
      return {
        title: isFrench ? 'Dernier triage' : 'Last triage',
        answer: isFrench ? "Aucune consultation de triage recente n'a ete retournee pour ce patient." : 'No recent triage encounter was returned for this patient.',
        steps: [isFrench ? 'Recherche des consultations dont le type ou le formulaire contient triage.' : 'Searched encounters whose type or form contains triage.'],
        suggestions: ['Show recent vitals', 'Show this patient summary'],
        sources: ['OpenMRS REST encounter endpoint'],
      };
    }

    const obs = (triage.obs?.length ? triage.obs : getRecentVitals(patientContext)).slice(0, 8).map(formatObs);
    const location = triage.location?.display;

    return {
      title: isFrench ? 'Dernier triage' : 'Last triage',
      answer: isFrench
        ? `Dernier triage le ${formatDate(triage.encounterDatetime)}${location ? ` a ${location}` : ''}.`
        : `Last triage was done on ${formatDate(triage.encounterDatetime)}${location ? ` at ${location}` : ''}.`,
      steps: obs.length ? obs : [isFrench ? "Aucune observation detaillee n'a ete retournee pour cette consultation." : 'No detailed observations were returned for this encounter.'],
      suggestions: ['Show recent vitals', 'Show this patient summary'],
      sources: ['OpenMRS REST encounter endpoint'],
    };
  }

  if (normalized.includes('active visit') || normalized.includes('current visit') || normalized.includes('visite active')) {
    const visit = getActiveVisit(patientContext);

    return {
      title: isFrench ? 'Visite active' : 'Active visit',
      answer: visit
        ? `${isFrench ? 'Visite active demarree le' : 'Active visit started on'} ${formatDate(visit.startDatetime)}${visit.location ? ` ${isFrench ? 'a' : 'at'} ${visit.location.display}` : ''}.`
        : isFrench
          ? "Aucune visite active n'a ete retournee pour ce patient."
          : 'No active visit was returned for this patient.',
      steps: visit?.encounters?.slice(0, 6).map((encounter) => `${formatDate(encounter.encounterDatetime)} ${getEncounterName(encounter)}`) || [],
      suggestions: ['Show this patient summary', 'Show recent encounters'],
      sources: ['OpenMRS REST visit endpoint'],
    };
  }

  if (normalized.includes('vital') || normalized.includes('bp') || normalized.includes('blood pressure') || normalized.includes('signes vitaux')) {
    const vitals = getRecentVitals(patientContext);
    const visibleVitals = visibleSummaryItems(patientContext, 'vitals');
    const items = uniqueBy(vitals.map(formatObs).concat(visibleVitals), (item) => item);

    return {
      title: isFrench ? 'Signes vitaux recents' : 'Recent vitals',
      answer: items.length ? (isFrench ? 'Voici les signes vitaux recents retournes par OpenMRS.' : 'These are the recent vitals returned by OpenMRS.') : isFrench ? "Aucun signe vital recent n'a ete retourne." : 'No recent vitals were returned.',
      steps: items,
      suggestions: ['Show last triage', 'Show this patient summary'],
      sources: ['OpenMRS REST obs endpoint', 'OpenMRS REST encounter endpoint'],
    };
  }

  if (normalized.includes('condition') || normalized.includes('diagnosis') || normalized.includes('diagnose')) {
    const items = uniqueBy((patientContext.conditions || []).slice(0, 10).map(conditionDisplay).concat(visibleSummaryItems(patientContext, 'conditions')), (item) => item);

    return {
      title: isFrench ? 'Conditions medicales' : 'Conditions',
      answer: items.length ? (isFrench ? 'Conditions retournees pour ce patient.' : 'Conditions returned for this patient.') : isFrench ? "Aucune condition n'a ete retournee pour ce patient." : 'No conditions were returned for this patient.',
      steps: items,
      suggestions: ['Show allergies', 'Show this patient summary'],
      sources: ['OpenMRS REST condition endpoint'],
    };
  }

  if (normalized.includes('allerg')) {
    const items = uniqueBy((patientContext.allergies || []).slice(0, 10).map(allergyDisplay).concat(visibleSummaryItems(patientContext, 'allergies')), (item) => item);

    return {
      title: isFrench ? 'Allergies' : 'Allergies',
      answer: items.length ? (isFrench ? 'Allergies retournees pour ce patient.' : 'Allergies returned for this patient.') : isFrench ? "Aucune allergie n'a ete retournee pour ce patient." : 'No allergies were returned for this patient.',
      steps: items,
      suggestions: ['Show conditions', 'Show this patient summary'],
      sources: ['OpenMRS REST allergy endpoint'],
    };
  }

  if (
    (normalized.includes('last') || normalized.includes('latest') || normalized.includes('recent')) &&
    (normalized.includes('dispense') || normalized.includes('medication') || normalized.includes('medicine') || normalized.includes('drug') || normalized.includes('prescription'))
  ) {
    const items = getMedicationItems(patientContext);

    return {
      title: isFrench ? 'Dernier medicament' : 'Last medication',
      answer: items.length
        ? isFrench
          ? 'Voici le medicament le plus recent retourne pour ce patient.'
          : 'This is the most recent medication returned for this patient.'
        : isFrench
          ? "Aucun medicament recent n'a ete retourne pour ce patient."
          : 'No recent medication was returned for this patient.',
      steps: items.slice(0, 1),
      suggestions: ['Show medication history', 'Show lab results'],
      sources: ['OpenMRS REST order endpoint', 'Patient chart visible context'],
    };
  }

  if (normalized.includes('medication') || normalized.includes('medicine') || normalized.includes('drug') || normalized.includes('prescription')) {
    const items = getMedicationItems(patientContext);

    return {
      title: isFrench ? 'Medicaments' : 'Medications',
      answer: items.length ? (isFrench ? 'Ordonnances de medicaments recentes retournees pour ce patient.' : 'Recent medication orders returned for this patient.') : isFrench ? "Aucune ordonnance de medicament recente n'a ete retournee pour ce patient." : 'No recent medication orders were returned for this patient.',
      steps: items.slice(0, 10),
      suggestions: ['What was the last dispensed drug?', 'Show lab results'],
      sources: ['OpenMRS REST order endpoint'],
    };
  }

  if (
    (normalized.includes('last') || normalized.includes('latest') || normalized.includes('recent')) &&
    (normalized.includes('lab') || normalized.includes('laboratory') || normalized.includes('result') || normalized.includes('test'))
  ) {
    const items = getLabItems(patientContext);

    return {
      title: isFrench ? 'Dernier resultat de laboratoire' : 'Last lab result',
      answer: items.length
        ? isFrench
          ? 'Voici le resultat ou la demande de laboratoire le plus recent retourne pour ce patient.'
          : 'This is the most recent lab order or result returned for this patient.'
        : isFrench
          ? "Aucun resultat de laboratoire recent n'a ete retourne pour ce patient."
          : 'No recent lab result was returned for this patient.',
      steps: items.slice(0, 1),
      suggestions: ['Show all lab results', 'Show medication history'],
      sources: ['OpenMRS REST order endpoint', 'OpenMRS REST obs endpoint', 'Patient chart visible context'],
    };
  }

  if (normalized.includes('lab') || normalized.includes('laboratory') || normalized.includes('result') || normalized.includes('laboratoire')) {
    const items = getLabItems(patientContext);

    return {
      title: isFrench ? 'Resultats de laboratoire recents' : 'Recent lab results',
      answer: items.length ? (isFrench ? 'Demandes/resultats de laboratoire recents retournes par OpenMRS.' : 'Recent lab orders/results returned by OpenMRS.') : isFrench ? "Aucune demande ou resultat de laboratoire recent n'a ete retourne." : 'No recent lab orders or results were returned.',
      steps: items.slice(0, 10),
      suggestions: ['Show last lab result', 'How do I order laboratory tests?'],
      sources: ['OpenMRS REST order endpoint', 'OpenMRS REST obs endpoint', 'OpenMRS REST encounter endpoint'],
    };
  }

  return shouldSummarizePatient(message) ? summarizePatient(patientContext, locale) : null;
}

export function summarizePatient(patientContext: PatientContext, locale: string): AssistantMessage {
  const isFrench = normalizeLocale(locale) === 'fr';
  const patient = patientContext.patient;
  const person = patient?.person || {};
  const identifiers = (patient?.identifiers || [])
    .map((item) => (item.identifierType?.display ? `${item.identifierType.display}: ${item.identifier}` : item.identifier))
    .filter(Boolean);
  const activeVisit = getActiveVisit(patientContext);
  const activeVisitText = activeVisit
    ? `${formatDate(activeVisit.startDatetime)}${activeVisit.location ? ` ${isFrench ? 'a' : 'at'} ${activeVisit.location.display}` : ''}`
    : isFrench
      ? 'aucune visite active retournee'
      : 'no active visit returned';
  const encounterItems = getEncounterItems(patientContext, locale);
  const vitals = uniqueBy(getRecentVitals(patientContext).slice(0, 8).map(formatObs).concat(visibleSummaryItems(patientContext, 'vitals')), (item) => item);
  const conditionItems = uniqueBy((patientContext.conditions || []).slice(0, 8).map(conditionDisplay).concat(visibleSummaryItems(patientContext, 'conditions')), (item) => item);
  const allergyItems = uniqueBy((patientContext.allergies || []).slice(0, 8).map(allergyDisplay).concat(visibleSummaryItems(patientContext, 'allergies')), (item) => item);
  const complaintItems = uniqueBy(visibleSummaryItems(patientContext, 'complaints'), (item) => item);
  const medicationItems = getMedicationItems(patientContext).slice(0, 8);
  const labItems = getLabItems(patientContext).slice(0, 20);

  return {
    title: isFrench ? 'Contexte du dossier patient' : 'Patient chart context',
    answer: isFrench
      ? `Patient : ${person.display || patient?.display || patient?.uuid}. Sexe : ${person.gender || 'inconnu'}. Age : ${person.age || 'inconnu'}. Identifiants : ${identifiers.join(', ') || 'aucun retourne'}. Visite active : ${activeVisitText}.`
      : `Patient: ${person.display || patient?.display || patient?.uuid}. Gender: ${person.gender || 'unknown'}. Age: ${person.age || 'unknown'}. Identifiers: ${identifiers.join(', ') || 'none returned'}. Active visit: ${activeVisitText}.`,
    steps: isFrench
      ? ['Contexte patient recu depuis le frontend.', "Reponse en lecture seule sans aucune action d'ecriture."]
      : ['Received patient context from the frontend.', 'Returned read-only guidance without performing any write action.'],
    sections: isFrench
      ? [
          { title: 'Consultations recentes', items: encounterItems.length ? encounterItems : ['Aucune consultation retournee'] },
          { title: 'Plaintes', items: complaintItems.length ? complaintItems : ['Aucune plainte retournee'] },
          { title: 'Signes vitaux', items: vitals.length ? vitals : ['Aucun signe vital retourne'] },
          { title: 'Conditions', items: conditionItems.length ? conditionItems : ['Aucune condition retournee'] },
          { title: 'Allergies', items: allergyItems.length ? allergyItems : ['Aucune allergie retournee'] },
          { title: 'Medicaments', items: medicationItems.length ? medicationItems : ['Aucune ordonnance medicamenteuse retournee'] },
          { title: 'Laboratoire', items: labItems.length ? labItems : ['Aucune demande ou resultat retourne'] },
        ]
      : [
          { title: 'Recent encounters', items: encounterItems.length ? encounterItems : ['No encounters returned'] },
          { title: 'Complaints', items: complaintItems.length ? complaintItems : ['No complaints returned'] },
          { title: 'Vitals', items: vitals.length ? vitals : ['No vitals returned'] },
          { title: 'Conditions', items: conditionItems.length ? conditionItems : ['No conditions returned'] },
          { title: 'Allergies', items: allergyItems.length ? allergyItems : ['No allergies returned'] },
          { title: 'Medications', items: medicationItems.length ? medicationItems : ['No medication orders returned'] },
          { title: 'Labs', items: labItems.length ? labItems : ['No lab orders or results returned'] },
        ],
    sources: isFrench
      ? ['Contexte patient du frontend', 'Endpoint patient OpenMRS REST', 'Endpoint consultation OpenMRS REST']
      : ['Frontend patient context', 'OpenMRS REST patient endpoint', 'OpenMRS REST encounter endpoint'],
    suggestions: ['Show last triage', 'Show last lab result', 'What was the last dispensed drug?'],
  };
}
