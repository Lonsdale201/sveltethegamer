import type { Question } from '../../../types/brainstorming';

export const literatureQuestions: Question[] = [
  {
    id: 'hu-3',
    text: 'Melyik évben jelent meg Petőfi Sándor „Nemzeti dal” című verse?',
    type: 'number',
    language: 'HU',
    correctAnswer: 1848,
    exactPoints: 2,
    closePoints: 1,
    tags: ['literature']
  },
  {
    id: 'hu-7',
    text: 'Ki írta a Toldi című eposzt?',
    type: 'select',
    language: 'HU',
    options: ['Petőfi Sándor', 'Arany János', 'Vörösmarty Mihály', 'Jókai Mór'],
    correctAnswer: 'Arany János',
    exactPoints: 1,
    tags: ['literature']
  },
  {
    id: 'en-3',
    text: 'In which year was the poem “National Song” by Sándor Petőfi published?',
    type: 'number',
    language: 'EN',
    correctAnswer: 1848,
    exactPoints: 2,
    closePoints: 1,
    tags: ['literature']
  },
  {
    id: 'en-7',
    text: 'Who wrote the epic poem “Toldi”?',
    type: 'select',
    language: 'EN',
    options: ['Sándor Petőfi', 'János Arany', 'Mihály Vörösmarty', 'Mór Jókai'],
    correctAnswer: 'János Arany',
    exactPoints: 1,
    tags: ['literature']
  }
];
