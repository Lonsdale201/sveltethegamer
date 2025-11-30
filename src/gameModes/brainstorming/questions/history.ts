import type { Question } from '../../../types/brainstorming';

export const historyQuestions: Question[] = [
  {
    id: 'hu-1',
    text: 'Ki volt az első magyar király?',
    type: 'select',
    language: 'HU',
    options: ['Géza', 'István', 'Koppány', 'Szent László'],
    correctAnswer: 'István',
    exactPoints: 1,
    tags: ['history']
  },
  {
    id: 'hu-2',
    text: 'Hány gyermeke volt II. Erzsébet brit királynőnek?',
    type: 'number',
    language: 'HU',
    correctAnswer: 4,
    exactPoints: 2,
    closePoints: 1,
    tags: ['history']
  },
  {
    id: 'hu-6',
    text: 'Melyik évben alapították a Budapesti Műszaki Egyetemet?',
    type: 'number',
    language: 'HU',
    correctAnswer: 1782,
    exactPoints: 2,
    closePoints: 1,
    tags: ['history']
  },
  {
    id: 'en-1',
    text: 'Who was the first king of Hungary?',
    type: 'select',
    language: 'EN',
    options: ['Geza', 'Stephen', 'Koppany', 'Saint Ladislaus'],
    correctAnswer: 'Stephen',
    exactPoints: 1,
    tags: ['history']
  },
  {
    id: 'en-2',
    text: 'How many children did Queen Elizabeth II have?',
    type: 'number',
    language: 'EN',
    correctAnswer: 4,
    exactPoints: 2,
    closePoints: 1,
    tags: ['history']
  },
  {
    id: 'en-6',
    text: 'In which year was the Budapest University of Technology founded?',
    type: 'number',
    language: 'EN',
    correctAnswer: 1782,
    exactPoints: 2,
    closePoints: 1,
    tags: ['history']
  }
];
