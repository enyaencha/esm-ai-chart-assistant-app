import type { AssistantMessage } from '../api/types';

export interface WorkflowKnowledge extends AssistantMessage {
  id: string;
  label: string;
  category: string;
  triggers: Array<string>;
}

interface ProgramEnrollmentKnowledge {
  program: string;
  aliases: Array<string>;
  enrollmentForm: string;
  initialForms?: Array<string>;
  followUpForms?: Array<string>;
  discontinuationForms?: Array<string>;
  notes?: Array<string>;
}

const stopWords = new Set([
  'about',
  'after',
  'and',
  'are',
  'can',
  'done',
  'for',
  'from',
  'how',
  'into',
  'patient',
  'please',
  'show',
  'that',
  'the',
  'this',
  'with',
  'workflow',
  'what',
  'when',
  'where',
  'which',
]);

const programEnrollments: Array<ProgramEnrollmentKnowledge> = [
  {
    program: 'HIV',
    aliases: ['hiv', 'ccc', 'art', 'hiv program', 'hiv care'],
    enrollmentForm: 'HIV Enrollment',
    initialForms: ['HIV Initial Form'],
    followUpForms: ['HIV Green Card', 'ART Preparation', 'Enhanced Adherence Screening'],
    discontinuationForms: ['HIV Discontinuation'],
    notes: ['After enrollment, use the HIV tab in Care Panel to review enrollment history, regimen status, CD4, and viral load context.'],
  },
  {
    program: 'NCD',
    aliases: ['ncd', 'non communicable', 'diabetes', 'hypertension'],
    enrollmentForm: 'NCD Enrollment Form',
    initialForms: ['NCD Initial Form'],
    followUpForms: ['NCD Follow Up'],
    discontinuationForms: ['NCD Discontinuation'],
  },
  {
    program: 'KVP',
    aliases: ['kvp', 'key population', 'kp'],
    enrollmentForm: 'KVP Clinical Enrollment',
    initialForms: ['KVP Initial Form', 'KVP Contact Form'],
    followUpForms: ['KVP Clinical Encounter form', 'KVP Diagnosis', 'KVP HIV Treatment Verification'],
    discontinuationForms: ['KVP Client Discontinuation'],
  },
  {
    program: 'Antenatal Care',
    aliases: ['antenatal', 'anc', 'mch mother', 'pregnancy'],
    enrollmentForm: 'Antenatal Care (ANC) Enrollment Form',
    followUpForms: ['ANC Follow Up form', 'MCH Antenatal Visit'],
    discontinuationForms: ['Antenatal Care (ANC) Discontinuation'],
  },
  {
    program: 'Postnatal Care',
    aliases: ['postnatal', 'pnc'],
    enrollmentForm: 'Postnatal Care (PNC) Enrollment Form',
    followUpForms: ['MCH Postnatal Visit'],
    discontinuationForms: ['Postnatal Care (PNC) Discontinuation'],
  },
  {
    program: 'Child Welfare / CWC',
    aliases: ['child welfare', 'cwc', 'mch child', 'hei'],
    enrollmentForm: 'CWC Enrolment Form',
    initialForms: ['Initial Child Welfare Clinic Form'],
    followUpForms: ['Child Welfare Clinic Follow Up Form'],
    discontinuationForms: ['Child Welfare Services Discontinuation'],
  },
  {
    program: 'Community Pharmacy',
    aliases: ['cpm', 'community pharmacy'],
    enrollmentForm: 'CPM Enrollment Form',
    initialForms: ['CPM Initial Form'],
    discontinuationForms: ['CPM Discontinuation Form'],
  },
  {
    program: 'TB',
    aliases: ['tb', 'tuberculosis'],
    enrollmentForm: 'TB Enrollment',
    initialForms: ['TB Initial'],
    followUpForms: ['TB FollowUp', 'TB Screening'],
    discontinuationForms: ['TB Discontinuation'],
  },
  {
    program: 'MAT',
    aliases: ['mat', 'methadone', 'opioid', 'medically assisted therapy'],
    enrollmentForm: 'MAT Initial Registration Form',
    initialForms: ['MAT Clinical Eligibility Assessment & Referral Form'],
    followUpForms: [
      'MAT Clinical Encounter Form',
      'MAT Patient Treatment Form',
      'MAT Psychiatric Intake and Follow up Form',
      'MAT Psychosocial Follow Up Form',
      'MAT Transit/Referral Form',
    ],
    discontinuationForms: ['MAT Discontinuation Form', 'MAT Cessation Form'],
  },
  {
    program: 'Pre-Conception Care',
    aliases: ['pre conception', 'pre-conception', 'pcc'],
    enrollmentForm: 'Pre-Conception Care Enrollment Form',
    followUpForms: ['Pre-Conception Care Form'],
    discontinuationForms: ['Pre-Conception Care Discontinuation'],
  },
  {
    program: 'TPT',
    aliases: ['tpt', 'ipt', 'tb preventive', 'preventive therapy'],
    enrollmentForm: 'TPT Initiation',
    initialForms: ['TPT Initial'],
    followUpForms: ['TPT FollowUp'],
    discontinuationForms: ['TPT Outcome'],
  },
  {
    program: 'Nutrition',
    aliases: ['nutrition', 'nutritional'],
    enrollmentForm: 'Nutrition Enrollment Form',
    followUpForms: ['Nutrition Form'],
    discontinuationForms: ['Nutrition Services Discontinuation'],
  },
  {
    program: 'Family Planning',
    aliases: ['family planning', 'fp'],
    enrollmentForm: 'Family Planning Enrollment Form',
    followUpForms: ['Family Planning'],
    discontinuationForms: ['Family Planning Discontinuation'],
  },
  {
    program: 'Violence screening',
    aliases: ['violence', 'gbv', 'gender based violence'],
    enrollmentForm: 'Violence Enrollment Form',
    initialForms: ['Violence Initial Form'],
    followUpForms: ['PEP FOLLOWUP Form'],
    discontinuationForms: ['Violence Discontinuation Form'],
  },
  {
    program: 'PrEP',
    aliases: ['prep', 'pre exposure prophylaxis'],
    enrollmentForm: 'PrEP Enrollment',
    followUpForms: ['PrEP Clinical Form'],
    discontinuationForms: ['PrEP Client Discontinuation'],
  },
  {
    program: 'VMMC',
    aliases: ['vmmc', 'circumcision'],
    enrollmentForm: 'VMMC Enrollment Form',
    initialForms: ['VMMC Initial Form'],
    followUpForms: ['VMMC Client Follow-Up Form'],
    discontinuationForms: ['VMMC Discontinuation Form'],
  },
];

export const workflows: Array<WorkflowKnowledge> = [
  {
    id: 'registration-standard',
    label: 'Registration',
    category: 'Registration',
    triggers: ['register', 'registration', 'new patient', 'demographics', 'national id', 'sha', 'otp', 'client registry'],
    title: 'Register a patient',
    answer:
      'Use registration to verify identity, prevent duplicates, capture demographics and identifiers, then open the new patient chart.',
    steps: [
      'Open Registration from the home dashboard.',
      'Search first using available identifiers or demographics to avoid creating a duplicate record.',
      'Select the identification type and enter the identifier details.',
      'If HIE or SHA verification is enabled, search the registry and complete OTP verification when required.',
      'Capture demographics, contact details, address, and next-of-kin information.',
      'Save the registration and confirm the patient chart opens with the expected identifiers.',
    ],
    sections: [
      {
        title: 'Important checks',
        items: [
          'Do not create a duplicate when a matching patient already exists.',
          'Confirm mandatory fields before saving.',
          'Use emergency registration only when the patient has no usable identifier.',
        ],
      },
      {
        title: 'Expected outcome',
        items: ['The patient is registered with a unique identifier and the chart is available for visit or service workflows.'],
      },
    ],
    sources: ['Built-in TaifaCare workflow knowledge', 'OpenMRS registration workflow'],
  },
  {
    id: 'registration-emergency',
    label: 'Emergency registration',
    category: 'Registration',
    triggers: ['emergency registration', 'no id', 'without identifier', 'unknown patient', 'temporary id'],
    title: 'Register a patient without identifiers',
    answer:
      'Emergency registration is for patients who need care before a permanent identifier can be confirmed.',
    steps: [
      'Open Registration and choose the emergency registration path.',
      'Capture the minimum required demographics and contact information available at the time.',
      'Save the record and confirm a temporary identifier is generated.',
      'Start or continue the visit so care can proceed.',
      'Update the patient record later when the official identifier is confirmed.',
    ],
    sections: [
      {
        title: 'Expected outcome',
        items: ['A temporary patient record is created without blocking urgent care.'],
      },
    ],
    sources: ['Built-in TaifaCare workflow knowledge', 'OpenMRS registration workflow'],
  },
  {
    id: 'open-patient-chart',
    label: 'Open chart',
    category: 'Patient chart',
    triggers: ['open chart', 'patient chart', 'find patient', 'search patient', 'open patient', 'patient search'],
    title: 'Find and open a patient chart',
    answer: 'Search for the patient, verify identity from the result list, then open the correct chart.',
    steps: [
      'Open patient search from the top navigation, home dashboard, or registration workflow.',
      'Search by identifier first when available; otherwise use name, phone, age, or sex to narrow results.',
      'Review identifiers and demographic details before selecting a result.',
      'Open the chart and confirm the patient banner before recording clinical data.',
    ],
    sections: [
      {
        title: 'Expected outcome',
        items: ['The correct patient chart is open and ready for visit, order, or encounter workflows.'],
      },
    ],
    sources: ['Built-in TaifaCare workflow knowledge', 'OpenMRS patient search'],
  },
  {
    id: 'queue-patient',
    label: 'Queue patient',
    category: 'Service queues',
    triggers: ['queue', 'service queue', 'assign', 'next queue', 'call patient', 'triage queue'],
    title: 'Queue or move a patient',
    answer:
      'Queueing places the patient in the correct service point and keeps the service flow visible to the facility team.',
    steps: [
      'Open the patient chart or service queue dashboard.',
      'Confirm the patient and active visit.',
      'Choose the target service queue, room, priority, and status where required.',
      'Save the queue entry and confirm the patient appears in the selected queue.',
      'Move the patient to the next queue when the current service is complete.',
    ],
    sections: [
      {
        title: 'Expected outcome',
        items: ['The patient appears in the correct queue with the expected status and priority.'],
      },
    ],
    sources: ['Built-in TaifaCare workflow knowledge', 'OpenMRS service queues'],
  },
  {
    id: 'triage-vitals',
    label: 'Triage',
    category: 'Triage',
    triggers: ['triage', 'vitals', 'vital signs', 'bp', 'blood pressure', 'temperature', 'spo2', 'weight', 'height'],
    title: 'Complete triage and vitals',
    answer:
      'Triage captures current vitals, presenting complaints, and service direction before consultation.',
    steps: [
      'Open the patient chart from the triage queue or patient search.',
      'Confirm there is an active visit; start one if facility workflow requires it.',
      'Open Record vitals or the triage clinical form.',
      'Capture blood pressure, pulse, respiratory rate, temperature, oxygen saturation, weight, and height as applicable.',
      'Record complaints and other triage questions required by the facility form.',
      'Save and confirm the encounter appears in the recent encounter list.',
    ],
    sections: [
      {
        title: 'Expected outcome',
        items: ['Recent vitals and triage observations are available in the patient chart and for consultation.'],
      },
    ],
    sources: ['Built-in TaifaCare workflow knowledge', 'OpenMRS vitals and encounter workflow'],
  },
  {
    id: 'clinical-encounter',
    label: 'Clinical encounter',
    category: 'Consultation',
    triggers: ['clinical', 'encounter', 'consultation', 'form', 'doctor note', 'diagnosis', 'complaint', 'progress note'],
    title: 'Complete a clinical encounter',
    answer:
      'The consultation workflow records clinical assessment, diagnoses, orders, treatment plan, and follow-up decisions.',
    steps: [
      'Open the patient chart from the consultation queue.',
      'Confirm patient identity, active visit, and recent triage details.',
      'Open the correct clinical form for the service or program.',
      'Record complaints, history, examination findings, diagnoses, and care plan.',
      'Create lab, imaging, procedure, or medication orders from the appropriate workflow when needed.',
      'Save and close the form, then confirm the encounter appears in visit history.',
    ],
    sections: [
      {
        title: 'Expected outcome',
        items: ['The consultation is saved to the patient record with the correct date, provider, location, and form.'],
      },
    ],
    sources: ['Built-in TaifaCare workflow knowledge', 'OpenMRS form entry'],
  },
  {
    id: 'lab-order',
    label: 'Lab process',
    category: 'Laboratory',
    triggers: ['lab', 'laboratory', 'test', 'order lab', 'lab order', 'specimen', 'cd4', 'viral load'],
    title: 'Order laboratory tests',
    answer:
      'Lab ordering starts from the patient chart or laboratory workflow and should result in a traceable request for specimen processing.',
    steps: [
      'Open the patient chart and confirm the active visit.',
      'Open Lab Orders, Orders, or the Laboratory workflow.',
      'Search for and select the required test or panel.',
      'Add order details such as urgency, instructions, and specimen information where required.',
      'Save the order and confirm it appears in the lab requests list.',
      'Direct the patient or specimen according to the facility laboratory process.',
    ],
    sections: [
      {
        title: 'Expected outcome',
        items: ['The lab request is visible to laboratory users and linked to the patient visit.'],
      },
    ],
    sources: ['Built-in TaifaCare workflow knowledge', 'OpenMRS lab orders'],
  },
  {
    id: 'lab-results',
    label: 'Lab results',
    category: 'Laboratory',
    triggers: ['lab result', 'result entry', 'enter result', 'review result', 'test result', 'approve result'],
    title: 'Enter and review laboratory results',
    answer:
      'Laboratory results should be entered against the correct request, then reviewed from the laboratory view or patient chart.',
    steps: [
      'Open the laboratory dashboard or patient lab orders view.',
      'Find the pending or completed request for the correct patient.',
      'Confirm the test name, request date, and specimen details.',
      'Enter the result value, units, and interpretation where required.',
      'Save or approve the result according to local permissions.',
      'Confirm the result is visible in the patient chart.',
    ],
    sections: [
      {
        title: 'Expected outcome',
        items: ['The lab result is stored once, linked to the correct test, and visible in the patient chart.'],
      },
    ],
    sources: ['Built-in TaifaCare workflow knowledge', 'OpenMRS laboratory workflow'],
  },
  {
    id: 'pharmacy-dispensing',
    label: 'Dispensing',
    category: 'Pharmacy',
    triggers: ['dispense', 'dispensing', 'pharmacy', 'medication', 'drug', 'prescription', 'stock'],
    title: 'Dispense prescribed medication',
    answer:
      'Dispensing should start from an existing prescription or pharmacy queue and must check drug, quantity, and stock before completion.',
    steps: [
      'Open the pharmacy or dispensing dashboard.',
      'Search for the patient or select the prescription from the queue.',
      'Review medication name, dose, frequency, route, duration, and prescriber.',
      'Enter dispense quantity and batch or stock details where required.',
      'Confirm the stock and prescription constraints before saving.',
      'Complete dispensing and confirm medication history updates in the chart.',
    ],
    sections: [
      {
        title: 'Expected outcome',
        items: ['The prescription is dispensed accurately and reflected in medication history and stock workflow.'],
      },
    ],
    sources: ['Built-in TaifaCare workflow knowledge', 'OpenMRS dispensing workflow'],
  },
  {
    id: 'admissions',
    label: 'Admissions',
    category: 'Inpatient',
    triggers: ['admission', 'admit', 'inpatient', 'ward', 'bed', 'discharge'],
    title: 'Admit or manage an inpatient',
    answer:
      'Admission workflows move a patient from outpatient care into an inpatient location with ward, bed, and clinical admission details.',
    steps: [
      'Open the patient chart and confirm the active visit.',
      'Start the admission request or inpatient admission form.',
      'Record admission reason, ward, bed, provider, and required clinical details.',
      'Save the admission and confirm the patient appears in the inpatient or ward list.',
      'Use discharge workflow when inpatient care is complete.',
    ],
    sections: [
      {
        title: 'Expected outcome',
        items: ['The patient is visible in the inpatient workflow with the correct admission details.'],
      },
    ],
    sources: ['Built-in TaifaCare workflow knowledge', 'OpenMRS inpatient workflow'],
  },
  {
    id: 'mch',
    label: 'MCH',
    category: 'MCH',
    triggers: ['mch', 'anc', 'antenatal', 'pnc', 'postnatal', 'delivery', 'mother', 'child welfare', 'hei'],
    title: 'Use MCH service workflows',
    answer:
      'MCH workflows capture maternal and child health enrollment, visits, delivery, postnatal care, and child follow-up.',
    steps: [
      'Open the patient chart or MCH dashboard.',
      'Confirm the active visit and correct MCH program or service.',
      'Select the correct form such as ANC, delivery, PNC, HEI, or child welfare.',
      'Complete required clinical, service, and follow-up fields.',
      'Save and confirm the encounter appears in the patient chart or program dashboard.',
    ],
    sections: [
      {
        title: 'Expected outcome',
        items: ['MCH service data is recorded in the correct program and visible for follow-up.'],
      },
    ],
    sources: ['Built-in TaifaCare workflow knowledge', 'OpenMRS MCH workflows'],
  },
  {
    id: 'imaging',
    label: 'Radiology and Imaging',
    category: 'Imaging',
    triggers: ['imaging', 'radiology', 'xray', 'x-ray', 'ultrasound', 'ct scan', 'mri', 'radiology result'],
    title: 'Order and review imaging',
    answer:
      'Imaging workflows create an imaging request, track study completion, and return a report or result to the chart.',
    steps: [
      'Open the patient chart or imaging dashboard.',
      'Create the imaging order and select the correct modality.',
      'Add clinical indication and instructions where required.',
      'Save the order and confirm it appears in the imaging queue.',
      'After the study is completed, record or upload the report.',
      'Confirm the imaging result is visible from the patient chart.',
    ],
    sections: [
      {
        title: 'Expected outcome',
        items: ['The imaging order and report are traceable from the imaging workflow and patient chart.'],
      },
    ],
    sources: ['Built-in TaifaCare workflow knowledge', 'OpenMRS imaging workflow'],
  },
  {
    id: 'procedures',
    label: 'Procedures',
    category: 'Procedures',
    triggers: ['procedure', 'procedures', 'operation', 'surgical', 'post procedure'],
    title: 'Record a procedure',
    answer:
      'Procedure workflows document the performed procedure, indication, provider, outcome, and any post-procedure notes.',
    steps: [
      'Open the patient chart and confirm the active visit.',
      'Open the procedure workflow or relevant procedure form.',
      'Record procedure name, indication, date, provider, and outcome.',
      'Add complications, notes, or follow-up plan where required.',
      'Save and confirm the procedure appears in the patient chart.',
    ],
    sections: [
      {
        title: 'Expected outcome',
        items: ['The procedure is saved as part of the patient visit and visible for clinical review.'],
      },
    ],
    sources: ['Built-in TaifaCare workflow knowledge', 'OpenMRS procedure workflow'],
  },
  {
    id: 'billing',
    label: 'Billing',
    category: 'Billing',
    triggers: ['billing', 'bill', 'invoice', 'payment', 'claim', 'sha claim', 'accounting'],
    title: 'Complete billing or claim workflow',
    answer:
      'Billing workflows review chargeable services, generate invoices or claims, and record payment or claim status.',
    steps: [
      'Open the billing or accounting dashboard.',
      'Search for the patient or visit.',
      'Review billable services, orders, procedures, and insurance or SHA eligibility details.',
      'Generate or update the invoice or claim.',
      'Record payment, waiver, or claim submission status according to facility workflow.',
      'Confirm the account balance or claim status is updated.',
    ],
    sections: [
      {
        title: 'Expected outcome',
        items: ['The patient bill or claim reflects the correct services and current payment or submission status.'],
      },
    ],
    sources: ['Built-in TaifaCare workflow knowledge', 'OpenMRS billing workflow'],
  },
  {
    id: 'reports',
    label: 'Reports',
    category: 'Reports',
    triggers: ['report', 'reports', 'ehr report', 'hiv report', 'data report', 'analytics'],
    title: 'Run reports',
    answer:
      'Reports are opened from the 3x3 KenyaEMR Modules launcher in the top bar, not from the left navigation. Choose the Reports tile, select the report tab and report name, enter the required date range, then request or generate the report.',
    steps: [
      'Open the 3x3 KenyaEMR Modules launcher from the top-right app bar.',
      'Click the Reports tile.',
      'Select the relevant tab such as Common, EHR Reports, HIV, TB, TPT, MCH - Mother Services, OTZ, OVC, Child Welfare Clinic, KVP, PrEP, or VMMC.',
      'Choose the required report, for example Active on ART Patients Linelist, MOH 731, HTS Register, or Viral Load and CD4 Lab requests pending Results.',
      'Enter the required start date and end date or other report parameters.',
      'Click Request or Generate.',
      'Check the Queue and Finished sections, then open or download the completed report when available.',
    ],
    sections: [
      {
        title: 'Important navigation note',
        items: ['Do not use the left navigation for Reports in this workflow.', 'Use the 3x3 KenyaEMR Modules launcher, then Reports.'],
      },
    ],
    sources: ['Built-in TaifaCare workflow knowledge', 'OpenMRS reporting workflow'],
  },
  {
    id: 'hiv-care',
    label: 'HIV care',
    category: 'HIV',
    triggers: ['hiv care', 'art', 'green card', 'viral load', 'hts'],
    title: 'Use HIV care workflows',
    answer:
      'HIV workflows support enrollment, ART preparation, clinical follow-up, adherence, lab monitoring, and program reporting.',
    steps: [
      'Open the patient chart and confirm the active visit.',
      'Open HIV Care and Treatment or the relevant HIV program dashboard.',
      'Select the correct form such as enrollment, green card, ART preparation, adherence, or follow-up.',
      'Complete required program, clinical, medication, and lab monitoring fields.',
      'Save and confirm the encounter appears in the HIV program history.',
    ],
    sections: [
      {
        title: 'Expected outcome',
        items: ['HIV program data is captured in the right form and available for care continuity and reports.'],
      },
    ],
    sources: ['Built-in TaifaCare workflow knowledge', 'OpenMRS HIV program workflow'],
  },
  {
    id: 'program-enrollment',
    label: 'Program enrollment',
    category: 'Program enrollment',
    triggers: [
      'program enrollment',
      'programme enrollment',
      'program enrolment',
      'enroll patient',
      'enrol patient',
      'enroll to program',
      'enrol to program',
      'care panel enrollment',
      'care panel enrolment',
    ],
    title: 'Enroll a patient to a care program',
    answer:
      'Program enrollment is done from the patient chart Care Panel. Use Program enrollment to add the patient to an eligible program, then complete the program-specific enrollment or initial form.',
    steps: [
      'Open the patient chart and confirm the correct patient.',
      'Open the Care Panel tab from the patient summary area.',
      'Select Program enrollment.',
      'Find the target program in the Care Programs table and confirm the status is Eligible.',
      'Click Enroll for that program.',
      'Complete the enrollment workspace details such as enrollment date, location, and program-specific fields.',
      'Save, then confirm the program status changes to Enrolled.',
      'Open the program tab in the Care Panel and complete the required enrollment or initial clinical form for that program.',
    ],
    sections: [
      {
        title: 'Common enrollment forms',
        items: programEnrollments.map((program) => `${program.program}: ${program.enrollmentForm}`),
      },
      {
        title: 'Expected outcome',
        items: ['The program status changes to Enrolled and the program appears in the Care Panel with its enrollment history.'],
      },
    ],
    sources: ['Built-in TaifaCare workflow knowledge', 'Care Panel Program enrollment', 'Configured form definitions'],
  },
];

export const quickActionWorkflows = workflows.filter((workflow) =>
  ['clinical-encounter', 'open-patient-chart', 'lab-order', 'pharmacy-dispensing', 'registration-standard', 'queue-patient'].includes(
    workflow.id,
  ),
);

const topicSuggestions: Record<string, Array<string>> = {
  Admissions: ['How do I discharge an inpatient?', 'How do I find admitted patients?'],
  Billing: ['How do I create a claim?', 'How do I review a patient bill?'],
  Consultation: ['How do I order labs from consultation?', 'How do I view the last triage?'],
  HIV: ['How do I enroll a patient to the HIV program?', 'How do I view HIV lab monitoring results?'],
  Imaging: ['How do I enter an imaging result?', 'How do I view imaging orders?'],
  Inpatient: ['How do I discharge an inpatient?', 'How do I move a patient to a ward?'],
  Laboratory: ['How do I view patient lab results?', 'How do I enter a lab result?'],
  MCH: ['How do I record an ANC visit?', 'How do I open child welfare services?'],
  Pharmacy: ['What was the last dispensed drug?', 'How do I view medication history?'],
  Procedures: ['How do I record a procedure result?', 'How do I view patient procedures?'],
  Registration: ['How do I start a visit after registration?', 'How do I handle emergency registration?'],
  Reports: ['How do I run an HIV report?', 'How do I export a report?'],
  'Program enrollment': ['Which form do I fill for HIV enrollment?', 'How do I review enrollment history?'],
  'Patient chart': ['How do I view patient results?', 'How do I view allergies and conditions?'],
  'Service queues': ['How do I call a patient from queue?', 'How do I move a patient to the next queue?'],
  Triage: ['How do I view the last triage?', 'How do I record vitals?'],
};

function tokenize(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function scoreWorkflow(workflow: WorkflowKnowledge, query: string, queryTokens: Array<string>) {
  const haystack = [
    workflow.id,
    workflow.label,
    workflow.category,
    workflow.title,
    workflow.answer,
    workflow.triggers.join(' '),
    workflow.steps?.join(' '),
    workflow.sections?.flatMap((section) => [section.title, section.items.join(' ')]).join(' '),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  let score = 0;

  if (query.includes(workflow.label.toLowerCase())) {
    score += 20;
  }

  workflow.triggers.forEach((trigger) => {
    if (query.includes(trigger)) {
      score += trigger.includes(' ') ? 18 : 10;
    }
  });

  queryTokens.forEach((token) => {
    if (workflow.label.toLowerCase().includes(token)) {
      score += 6;
    }

    if (workflow.category.toLowerCase().includes(token)) {
      score += 5;
    }

    if (workflow.title.toLowerCase().includes(token)) {
      score += 4;
    }

    if (haystack.includes(token)) {
      score += 1;
    }
  });

  return score;
}

type ProgramEnrollmentIntent =
  | 'discontinuation'
  | 'eligibility'
  | 'followUpForm'
  | 'form'
  | 'history'
  | 'initialForm'
  | 'nextStep'
  | 'programList'
  | 'status'
  | 'steps'
  | 'where';

const enrollmentTerms = [
  'enroll',
  'enrol',
  'enrollment',
  'enrolment',
  'program',
  'programme',
  'care panel',
  'panel summary',
];

function hasAny(query: string, terms: Array<string>) {
  return terms.some((term) => query.includes(term));
}

function hasToken(query: string, token: string) {
  return new RegExp(`(^|\\s)${token}(\\s|$)`).test(query);
}

function aliasMatches(query: string, alias: string) {
  return alias.length <= 3 ? hasToken(query, alias) : query.includes(alias);
}

function findProgramEnrollment(query: string) {
  return programEnrollments.find((program) => program.aliases.some((alias) => aliasMatches(query, alias)));
}

function isShortQuestion(query: string) {
  const words = query.split(/\s+/).filter(Boolean);
  return words.length <= 5 && !hasAny(query, ['how do', 'how to', 'steps', 'process', 'workflow']);
}

function isEnrollmentQuestion(query: string) {
  const program = findProgramEnrollment(query);

  return (
    hasAny(query, enrollmentTerms) ||
    Boolean(program && hasAny(query, ['form', 'follow', 'initial', 'history', 'status', 'eligible', 'discontinue', 'what next']))
  );
}

function getEnrollmentIntent(query: string, program?: ProgramEnrollmentKnowledge): ProgramEnrollmentIntent {
  if (!program && hasAny(query, ['all programs', 'available programs', 'list programs', 'which programs', 'programs can'])) {
    return 'programList';
  }

  if (hasAny(query, ['discontinue', 'discontinuation', 'stop program', 'exit program', 'outcome form'])) {
    return 'discontinuation';
  }

  if (hasAny(query, ['history', 'enrollment history', 'enrolment history', 'enrolled on', 'past enrollment', 'previous enrollment'])) {
    return 'history';
  }

  if (hasAny(query, ['status', 'already enrolled', 'currently enrolled', 'is enrolled', 'enrolled already', 'enrolled programs'])) {
    return 'status';
  }

  if (hasAny(query, ['eligible', 'eligibility', 'can enroll', 'can enrol', 'cannot enroll', 'not eligible', 'why no enroll'])) {
    return 'eligibility';
  }

  if (hasAny(query, ['follow up', 'follow-up', 'followup', 'return visit', 'subsequent visit', 'service form'])) {
    return 'followUpForm';
  }

  if (hasAny(query, ['initial', 'first visit', 'first form'])) {
    return 'initialForm';
  }

  if (hasAny(query, ['what next', 'next after', 'after enrollment', 'after enrolment', 'after enrolling', 'after enroling'])) {
    return 'nextStep';
  }

  if (
    hasAny(query, [
      'which form',
      'what form',
      'form to fill',
      'form should',
      'forms for',
      'forms used',
      'forms required',
      'configured forms',
      'all forms',
      'enrollment form',
      'enrolment form',
    ])
  ) {
    return 'form';
  }

  if (hasAny(query, ['where', 'open', 'find', 'navigate', 'go to', 'click', 'path'])) {
    return 'where';
  }

  if (hasAny(query, ['how do', 'how to', 'steps', 'process', 'workflow'])) {
    return 'steps';
  }

  return program && isShortQuestion(query) ? 'form' : 'steps';
}

function formatFormList(title: string, forms?: Array<string>) {
  return forms?.length ? { title, items: forms } : null;
}

function compactFormAnswer(program: ProgramEnrollmentKnowledge) {
  const nextForm = program.initialForms?.[0] || program.followUpForms?.[0];
  return nextForm
    ? `${program.program}: Care Panel > Program enrollment > Enroll, then fill ${program.enrollmentForm}. After enrollment, use ${nextForm} when the first program visit is required.`
    : `${program.program}: Care Panel > Program enrollment > Enroll, then fill ${program.enrollmentForm}.`;
}

function enrollmentSources() {
  return ['Built-in TaifaCare workflow knowledge', 'Care Panel Program enrollment', 'Configured form definitions'];
}

function wantsDetailedForms(query: string) {
  return hasAny(query, ['all forms', 'forms used', 'forms required', 'configured forms', 'forms for each']);
}

function programFormSummary(program: ProgramEnrollmentKnowledge) {
  return [
    `Enrollment: ${program.enrollmentForm}`,
    program.initialForms?.length ? `Initial: ${program.initialForms.join(', ')}` : null,
    program.followUpForms?.length ? `Follow-up/service: ${program.followUpForms.join(', ')}` : null,
    program.discontinuationForms?.length ? `Discontinuation/outcome: ${program.discontinuationForms.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('; ');
}

function enrollmentSuggestions(program?: ProgramEnrollmentKnowledge, intent?: ProgramEnrollmentIntent) {
  if (!program) {
    return ['Which form do I fill for HIV enrollment?', 'How do I enroll a patient to NCD?', 'Which programs can be enrolled?'];
  }

  if (intent === 'form') {
    return [`What next after ${program.program} enrollment?`, `Which follow-up form is used for ${program.program}?`];
  }

  if (intent === 'history' || intent === 'status') {
    return [`Which form do I fill for ${program.program} enrollment?`, `What next after ${program.program} enrollment?`];
  }

  return [`Which form do I fill for ${program.program} enrollment?`, `How do I review ${program.program} enrollment history?`];
}

function programSpecificEnrollmentAnswer(
  program: ProgramEnrollmentKnowledge,
  intent: ProgramEnrollmentIntent,
  shortAnswer: boolean,
): AssistantMessage {
  if (intent === 'form') {
    return {
      title: `${program.program} enrollment form`,
      answer: compactFormAnswer(program),
      sections: shortAnswer
        ? undefined
        : [
            formatFormList('Initial forms', program.initialForms),
            formatFormList('Follow-up or service forms', program.followUpForms),
            formatFormList('Discontinuation or outcome forms', program.discontinuationForms),
          ].filter(Boolean) as NonNullable<AssistantMessage['sections']>,
      suggestions: enrollmentSuggestions(program, intent),
      sources: enrollmentSources(),
      mode: 'local-knowledge',
    };
  }

  if (intent === 'initialForm' || intent === 'nextStep') {
    const nextForms = program.initialForms?.length ? program.initialForms : program.followUpForms;

    return {
      title: `Next step after ${program.program} enrollment`,
      answer: nextForms?.length
        ? `After enrolling to ${program.program}, open the ${program.program} tab in Care Panel and complete ${nextForms[0]}.`
        : `After enrolling to ${program.program}, open the ${program.program} tab in Care Panel and continue with the configured service form.`,
      sections: shortAnswer || !nextForms?.length ? undefined : [{ title: 'Useful next forms', items: nextForms }],
      suggestions: enrollmentSuggestions(program, intent),
      sources: enrollmentSources(),
      mode: 'local-knowledge',
    };
  }

  if (intent === 'followUpForm') {
    return {
      title: `${program.program} follow-up forms`,
      answer: program.followUpForms?.length
        ? `Use ${program.followUpForms[0]} for ${program.program} follow-up when that service visit is due.`
        : `No separate ${program.program} follow-up form is configured in the built-in knowledge; use the program tab and available service forms.`,
      sections: shortAnswer || !program.followUpForms?.length ? undefined : [{ title: 'Follow-up or service forms', items: program.followUpForms }],
      suggestions: enrollmentSuggestions(program, intent),
      sources: enrollmentSources(),
      mode: 'local-knowledge',
    };
  }

  if (intent === 'discontinuation') {
    return {
      title: `${program.program} discontinuation`,
      answer: program.discontinuationForms?.length
        ? `Use ${program.discontinuationForms[0]} when discontinuing or closing ${program.program} enrollment.`
        : `No discontinuation form is configured in the built-in knowledge for ${program.program}; check the program tab actions.`,
      sections:
        shortAnswer || !program.discontinuationForms?.length
          ? undefined
          : [{ title: 'Discontinuation or outcome forms', items: program.discontinuationForms }],
      suggestions: enrollmentSuggestions(program, intent),
      sources: enrollmentSources(),
      mode: 'local-knowledge',
    };
  }

  if (intent === 'history') {
    return {
      title: `${program.program} enrollment history`,
      answer: `Open Patient chart > Care Panel, then select the ${program.program} tab. The panel summary shows enrollment history and current program context when configured.`,
      suggestions: enrollmentSuggestions(program, intent),
      sources: enrollmentSources(),
      mode: 'local-knowledge',
    };
  }

  if (intent === 'status') {
    return {
      title: `${program.program} enrollment status`,
      answer: `Open Care Panel > Program enrollment. The Status column shows whether ${program.program} is Enrolled or Eligible.`,
      suggestions: enrollmentSuggestions(program, intent),
      sources: enrollmentSources(),
      mode: 'local-knowledge',
    };
  }

  if (intent === 'eligibility') {
    return {
      title: `${program.program} eligibility`,
      answer: `In Care Panel > Program enrollment, click Enroll only when ${program.program} shows Eligible. If it is already Enrolled, use the program tab instead.`,
      suggestions: enrollmentSuggestions(program, intent),
      sources: enrollmentSources(),
      mode: 'local-knowledge',
    };
  }

  if (intent === 'where') {
    return {
      title: `Where to enroll to ${program.program}`,
      answer: `Go to Patient chart > Care Panel > Program enrollment, then use Enroll on the ${program.program} row.`,
      suggestions: enrollmentSuggestions(program, intent),
      sources: enrollmentSources(),
      mode: 'local-knowledge',
    };
  }

  const sections = [
    {
      title: 'Required enrollment form',
      items: [program.enrollmentForm],
    },
    formatFormList('Initial forms', program.initialForms),
    formatFormList('Follow-up or service forms', program.followUpForms),
    formatFormList('Discontinuation or outcome forms', program.discontinuationForms),
    program.notes?.length ? { title: 'Notes', items: program.notes } : null,
  ].filter(Boolean) as NonNullable<AssistantMessage['sections']>;

  return {
    title: `Enroll patient to ${program.program}`,
    answer: `Use Care Panel > Program enrollment to enroll the patient to ${program.program}, then complete ${program.enrollmentForm}.`,
    steps: [
      'Open the patient chart and confirm the correct patient.',
      'Open the Care Panel tab.',
      'Select Program enrollment.',
      `Find ${program.program} in the Care Programs table and confirm the patient is Eligible.`,
      `Click Enroll for ${program.program}.`,
      'Complete enrollment date, location, and required enrollment fields.',
      'Save and confirm the program status changes to Enrolled.',
      `Open the ${program.program} tab in Care Panel and complete ${program.initialForms?.[0] || program.enrollmentForm} when required.`,
    ],
    sections,
    suggestions: enrollmentSuggestions(program, intent),
    sources: enrollmentSources(),
    mode: 'local-knowledge',
  };
}

function answerProgramEnrollmentQuestion(query: string): AssistantMessage | null {
  if (!isEnrollmentQuestion(query)) {
    return null;
  }

  const program = findProgramEnrollment(query);
  const intent = getEnrollmentIntent(query, program);
  const shortAnswer = (isShortQuestion(query) || intent !== 'steps') && !wantsDetailedForms(query);

  if (program) {
    return programSpecificEnrollmentAnswer(program, intent, shortAnswer);
  }

  if (intent === 'programList') {
    return {
      title: 'Programs available for enrollment',
      answer: 'Use Care Panel > Program enrollment to see which care programs are Enrolled or Eligible for the patient.',
      sections: [
        {
          title: 'Configured programs',
          items: programEnrollments.map((item) => item.program),
        },
      ],
      suggestions: enrollmentSuggestions(),
      sources: enrollmentSources(),
      mode: 'local-knowledge',
    };
  }

  if (intent === 'where') {
    return {
      title: 'Where to enroll a patient',
      answer: 'Open Patient chart > Care Panel > Program enrollment, then click Enroll on the eligible program row.',
      suggestions: enrollmentSuggestions(),
      sources: enrollmentSources(),
      mode: 'local-knowledge',
    };
  }

  if (intent === 'history') {
    return {
      title: 'Review enrollment history',
      answer:
        'Open Patient chart > Care Panel, then open the program tab. Panel summary shows current status and enrollment history when configured.',
      suggestions: enrollmentSuggestions(),
      sources: enrollmentSources(),
      mode: 'local-knowledge',
    };
  }

  if (intent === 'status') {
    return {
      title: 'Check program enrollment status',
      answer: 'Open Care Panel > Program enrollment. The Status column shows Enrolled or Eligible for each care program.',
      suggestions: enrollmentSuggestions(),
      sources: enrollmentSources(),
      mode: 'local-knowledge',
    };
  }

  if (intent === 'eligibility') {
    return {
      title: 'Program eligibility',
      answer:
        'A patient can be enrolled when the program row shows Eligible. If it shows Enrolled, use the program tab instead of enrolling again.',
      suggestions: enrollmentSuggestions(),
      sources: enrollmentSources(),
      mode: 'local-knowledge',
    };
  }

  if (intent === 'form' || intent === 'initialForm' || intent === 'followUpForm' || intent === 'discontinuation') {
    return {
      title: 'Program enrollment forms',
      answer: 'Tell me the program name for a shorter answer, for example: "HIV enrollment form" or "TB follow-up form".',
      sections: [
        {
          title: wantsDetailedForms(query) ? 'Configured program forms' : 'Program enrollment forms',
          items: programEnrollments.map((item) =>
            wantsDetailedForms(query) ? `${item.program}: ${programFormSummary(item)}` : `${item.program}: ${item.enrollmentForm}`,
          ),
        },
      ],
      suggestions: enrollmentSuggestions(),
      sources: enrollmentSources(),
      mode: 'local-knowledge',
    };
  }

  return {
    title: 'Enroll a patient to a care program',
    answer:
      'Enroll patients from the patient chart Care Panel. Choose Program enrollment, click Enroll on the eligible program, save, then complete the program-specific form.',
    steps: [
      'Open the patient chart and confirm the correct patient.',
      'Open Care Panel from the patient summary area.',
      'Select Program enrollment.',
      'Find the target program and confirm it is Eligible.',
      'Click Enroll and complete the enrollment workspace.',
      'Save and confirm the status changes to Enrolled.',
      'Open the program tab and complete the enrollment or initial form required for that program.',
    ],
    sections: [
      {
        title: 'Common enrollment forms',
        items: programEnrollments.map((item) => `${item.program}: ${item.enrollmentForm}`),
      },
    ],
    suggestions: enrollmentSuggestions(),
    sources: enrollmentSources(),
    mode: 'local-knowledge',
  };
}

export function answerWorkflowQuestion(message: string): AssistantMessage | null {
  const query = String(message || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const queryTokens = tokenize(query);

  if (!queryTokens.length) {
    return null;
  }

  if (hasAny(query, ['report', 'reports', 'reporting', 'linelist', 'line list', 'moh 731', 'moh 705', 'active on art'])) {
    const reportsWorkflow = workflows.find((workflow) => workflow.id === 'reports');

    if (reportsWorkflow) {
      return {
        ...reportsWorkflow,
        suggestions: topicSuggestions.Reports,
        mode: 'local-knowledge',
      };
    }
  }

  const enrollmentAnswer = answerProgramEnrollmentQuestion(query);

  if (enrollmentAnswer) {
    return enrollmentAnswer;
  }

  const match = workflows
    .map((workflow) => ({
      workflow,
      score: scoreWorkflow(workflow, query, queryTokens),
    }))
    .filter((item) => item.score >= 8)
    .sort((left, right) => right.score - left.score)[0]?.workflow;

  return match
    ? {
        ...match,
        suggestions: topicSuggestions[match.category] || ['Ask another question about this workflow.'],
        mode: 'local-knowledge',
      }
    : null;
}
