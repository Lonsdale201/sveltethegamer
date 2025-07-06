import type { Question, Language } from '../../types/brainstorming';

// Fixed seed for consistent question order across all players
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Hungarian Questions
const hungarianQuestions: Question[] = [
  {
    id: 'hu-1',
    text: 'Ki volt az első magyar király?',
    type: 'select',
    language: 'HU',
    options: ['Géza', 'István', 'Koppány', 'Szent László'],
    correctAnswer: 'István',
    exactPoints: 1
  },
  {
    id: 'hu-2',
    text: 'Hány gyermeke volt II. Erzsébet brit királynőnek?',
    type: 'number',
    language: 'HU',
    correctAnswer: 4,
    exactPoints: 2,
    closePoints: 0 // Only exact answer gets points
  },
  {
    id: 'hu-3',
    text: 'Melyik évben jelent meg Petőfi Sándor „Nemzeti dal" című verse?',
    type: 'number',
    language: 'HU',
    correctAnswer: 1848,
    exactPoints: 2,
    closePoints: 0 // Only exact answer gets points
  },
  {
    id: 'hu-4',
    text: 'Melyik a legnagyobb testű szárazföldi emlős?',
    type: 'select',
    language: 'HU',
    options: ['Jávai orrszarvú', 'Afrikai elefánt', 'Grizzly medve', 'Indiai bölény'],
    correctAnswer: 'Afrikai elefánt',
    exactPoints: 1
  },
  {
    id: 'hu-5',
    text: 'Milyen magas a budapesti Parlament épülete (méterben)?',
    type: 'number',
    language: 'HU',
    correctAnswer: 96,
    exactPoints: 2,
    closePoints: 0 // Only exact answer gets points
  },
  {
    id: 'hu-6',
    text: 'Melyik évben alapították a Budapesti Műszaki Egyetemet?',
    type: 'number',
    language: 'HU',
    correctAnswer: 1782,
    exactPoints: 2,
    closePoints: 0
  },
  {
    id: 'hu-7',
    text: 'Ki írta a Toldi című eposzát?',
    type: 'select',
    language: 'HU',
    options: ['Petőfi Sándor', 'Arany János', 'Vörösmarty Mihály', 'Jókai Mór'],
    correctAnswer: 'Arany János',
    exactPoints: 1
  },
  {
    id: 'hu-8',
    text: 'Hány megye van Magyarországon?',
    type: 'number',
    language: 'HU',
    correctAnswer: 19,
    exactPoints: 2,
    closePoints: 0
  },
  {
    id: 'hu-9',
    text: 'Melyik magyar város a "Virágok városa"?',
    type: 'select',
    language: 'HU',
    options: ['Debrecen', 'Szeged', 'Pécs', 'Kecskemét'],
    correctAnswer: 'Debrecen',
    exactPoints: 1
  },
  {
    id: 'hu-10',
    text: 'Milyen hosszú a Duna Magyarországon (km-ben)?',
    type: 'number',
    language: 'HU',
    correctAnswer: 417,
    exactPoints: 2,
    closePoints: 1 // Close answers get 1 point
  }
];

// English Questions
const englishQuestions: Question[] = [
  {
    id: 'en-1',
    text: 'Who was the first king of Hungary?',
    type: 'select',
    language: 'EN',
    options: ['Géza', 'Stephen', 'Koppány', 'Saint Ladislaus'],
    correctAnswer: 'Stephen',
    exactPoints: 1
  },
  {
    id: 'en-2',
    text: 'How many children did Queen Elizabeth II have?',
    type: 'number',
    language: 'EN',
    correctAnswer: 4,
    exactPoints: 2,
    closePoints: 0 // Only exact answer gets points
  },
  {
    id: 'en-3',
    text: 'In which year was the poem "National Song" by Sándor Petőfi published?',
    type: 'number',
    language: 'EN',
    correctAnswer: 1848,
    exactPoints: 2,
    closePoints: 0 // Only exact answer gets points
  },
  {
    id: 'en-4',
    text: 'Which is the largest land mammal?',
    type: 'select',
    language: 'EN',
    options: ['Javan rhinoceros', 'African elephant', 'Grizzly bear', 'Indian bison'],
    correctAnswer: 'African elephant',
    exactPoints: 1
  },
  {
    id: 'en-5',
    text: 'How tall is the Hungarian Parliament building (in meters)?',
    type: 'number',
    language: 'EN',
    correctAnswer: 96,
    exactPoints: 2,
    closePoints: 0 // Only exact answer gets points
  },
  {
    id: 'en-6',
    text: 'In which year was the Budapest University of Technology founded?',
    type: 'number',
    language: 'EN',
    correctAnswer: 1782,
    exactPoints: 2,
    closePoints: 0
  },
  {
    id: 'en-7',
    text: 'Who wrote the epic poem "Toldi"?',
    type: 'select',
    language: 'EN',
    options: ['Sándor Petőfi', 'János Arany', 'Mihály Vörösmarty', 'Mór Jókai'],
    correctAnswer: 'János Arany',
    exactPoints: 1
  },
  {
    id: 'en-8',
    text: 'How many counties are there in Hungary?',
    type: 'number',
    language: 'EN',
    correctAnswer: 19,
    exactPoints: 2,
    closePoints: 0
  },
  {
    id: 'en-9',
    text: 'Which Hungarian city is called the "City of Flowers"?',
    type: 'select',
    language: 'EN',
    options: ['Debrecen', 'Szeged', 'Pécs', 'Kecskemét'],
    correctAnswer: 'Debrecen',
    exactPoints: 1
  },
  {
    id: 'en-10',
    text: 'How long is the Danube River in Hungary (in km)?',
    type: 'number',
    language: 'EN',
    correctAnswer: 417,
    exactPoints: 2,
    closePoints: 1 // Close answers get 1 point
  }
];

export function getQuestionsByLanguage(language: Language): Question[] {
  const questions = language === 'HU' ? hungarianQuestions : englishQuestions;
  // Use fixed seed to ensure all players get the same question order
  const seed = 12345; // Fixed seed for consistency
  return shuffleWithSeed(questions, seed);
}

export function getAllQuestions(): Question[] {
  return [...hungarianQuestions, ...englishQuestions];
}