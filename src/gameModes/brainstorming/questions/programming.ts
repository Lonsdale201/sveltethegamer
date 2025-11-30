import type { Question } from '../../../types/brainstorming';

export const programmingQuestions: Question[] = [
  {
    id: 'hu-prog-1',
    text: 'Mit jelent a HTML mozaikszó?',
    type: 'select',
    language: 'HU',
    options: [
      'HyperText Markup Language',
      'High Transfer Machine Language',
      'Hyperlink Transfer Mode Layer',
      'Hybrid Text Management Library'
    ],
    correctAnswer: 'HyperText Markup Language',
    exactPoints: 1,
    tags: ['programming']
  },
  {
    id: 'hu-prog-2',
    text: 'Hány bit alkot egy bájtot?',
    type: 'number',
    language: 'HU',
    correctAnswer: 8,
    exactPoints: 2,
    closePoints: 1,
    tags: ['programming']
  },
  {
    id: 'en-prog-1',
    text: 'What does the acronym HTML stand for?',
    type: 'select',
    language: 'EN',
    options: [
      'HyperText Markup Language',
      'High Transfer Machine Language',
      'Hyperlink Transfer Mode Layer',
      'Hybrid Text Management Library'
    ],
    correctAnswer: 'HyperText Markup Language',
    exactPoints: 1,
    tags: ['programming']
  },
  {
    id: 'en-prog-2',
    text: 'How many bits make up one byte?',
    type: 'number',
    language: 'EN',
    correctAnswer: 8,
    exactPoints: 2,
    closePoints: 1,
    tags: ['programming']
  }
];
