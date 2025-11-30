import type { Question } from '../../../types/brainstorming';

export const geographyQuestions: Question[] = [
  {
    id: 'hu-4',
    text: 'Melyik a legnagyobb testű szárazföldi emlős?',
    type: 'select',
    language: 'HU',
    options: ['Jávai orrszarvú', 'Afrikai elefánt', 'Grizzly medve', 'Indiai bölény'],
    correctAnswer: 'Afrikai elefánt',
    exactPoints: 1,
    tags: ['geography']
  },
  {
    id: 'hu-8',
    text: 'Hány megye van Magyarországon?',
    type: 'number',
    language: 'HU',
    correctAnswer: 19,
    exactPoints: 2,
    closePoints: 1,
    tags: ['geography']
  },
  {
    id: 'hu-9',
    text: 'Melyik magyar város a “Virágok városa”?',
    type: 'select',
    language: 'HU',
    options: ['Debrecen', 'Szeged', 'Pécs', 'Kecskemét'],
    correctAnswer: 'Debrecen',
    exactPoints: 1,
    tags: ['geography']
  },
  {
    id: 'hu-10',
    text: 'Milyen hosszú a Duna Magyarországon (km-ben)?',
    type: 'number',
    language: 'HU',
    correctAnswer: 417,
    exactPoints: 2,
    closePoints: 1,
    tags: ['geography']
  },
  {
    id: 'en-4',
    text: 'Which is the largest land mammal?',
    type: 'select',
    language: 'EN',
    options: ['Javan rhinoceros', 'African elephant', 'Grizzly bear', 'Indian bison'],
    correctAnswer: 'African elephant',
    exactPoints: 1,
    tags: ['geography']
  },
  {
    id: 'en-8',
    text: 'How many counties are there in Hungary?',
    type: 'number',
    language: 'EN',
    correctAnswer: 19,
    exactPoints: 2,
    closePoints: 1,
    tags: ['geography']
  },
  {
    id: 'en-9',
    text: 'Which Hungarian city is called the “City of Flowers”?',
    type: 'select',
    language: 'EN',
    options: ['Debrecen', 'Szeged', 'Pécs', 'Kecskemét'],
    correctAnswer: 'Debrecen',
    exactPoints: 1,
    tags: ['geography']
  },
  {
    id: 'en-10',
    text: 'How long is the Danube River in Hungary (in km)?',
    type: 'number',
    language: 'EN',
    correctAnswer: 417,
    exactPoints: 2,
    closePoints: 1,
    tags: ['geography']
  }
];
