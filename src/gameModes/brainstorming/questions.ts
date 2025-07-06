import type { Question, Language } from '../../types/brainstorming';

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
    closePoints: 1
  },
  {
    id: 'hu-3',
    text: 'Melyik évben jelent meg Petőfi Sándor „Nemzeti dal" című verse?',
    type: 'number',
    language: 'HU',
    correctAnswer: 1848,
    exactPoints: 2,
    closePoints: 1
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
    closePoints: 1
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
    closePoints: 1
  },
  {
    id: 'en-3',
    text: 'In which year was the poem "National Song" by Sándor Petőfi published?',
    type: 'number',
    language: 'EN',
    correctAnswer: 1848,
    exactPoints: 2,
    closePoints: 1
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
    closePoints: 1
  }
];

export function getQuestionsByLanguage(language: Language): Question[] {
  const questions = language === 'HU' ? hungarianQuestions : englishQuestions;
  // Shuffle questions for random order
  return [...questions].sort(() => Math.random() - 0.5);
}

export function getAllQuestions(): Question[] {
  return [...hungarianQuestions, ...englishQuestions];
}