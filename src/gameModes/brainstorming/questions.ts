import type { BrainstormingTopic, Language, Question } from '../../types/brainstorming';
import { historyQuestions } from './questions/history';
import { literatureQuestions } from './questions/literature';
import { geographyQuestions } from './questions/geography';
import { programmingQuestions } from './questions/programming';

export const brainstormingTopics: { id: BrainstormingTopic; label: string; labelEn: string }[] = [
  { id: 'history', label: 'Történelem', labelEn: 'History' },
  { id: 'literature', label: 'Irodalom', labelEn: 'Literature' },
  { id: 'geography', label: 'Földrajz', labelEn: 'Geography' },
  { id: 'programming', label: 'Programozás', labelEn: 'Programming' }
];

const allQuestions: Question[] = [
  ...historyQuestions,
  ...literatureQuestions,
  ...geographyQuestions,
  ...programmingQuestions
];

// Generate a seed based on current date and hour for consistent randomization per session
function generateSessionSeed(): number {
  const now = new Date();
  const dateString =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0');

  const baseSeed = parseInt(dateString, 10);
  const minuteVariation = Math.floor(now.getMinutes() / 10); // Changes every 10 minutes

  return baseSeed + minuteVariation;
}

// Seeded random function for consistent results
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Shuffle array with a given seed for consistent results across players
function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function interleaveByTopics(questions: Question[], topics: BrainstormingTopic[], seed: number): Question[] {
  const topicSet = new Set(topics);
  const groups: Record<string, Question[]> = {};

  for (const q of questions) {
    const primaryTag = q.tags.find((tag) => topicSet.has(tag));
    if (!primaryTag) continue;
    groups[primaryTag] = groups[primaryTag] || [];
    groups[primaryTag].push(q);
  }

  const topicOrder = shuffleWithSeed(topics.filter((t) => groups[t]?.length), seed + 1);
  for (const topic of topicOrder) {
    groups[topic] = shuffleWithSeed(groups[topic], seed + topicOrder.indexOf(topic) + 10);
  }

  const result: Question[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const topic of topicOrder) {
      const next = groups[topic]?.shift();
      if (next) {
        result.push(next);
        added = true;
      }
    }
  }

  return result;
}

export function getQuestionsByLanguage(language: Language, topics?: string[]): Question[] {
  let topicSelection: BrainstormingTopic[] =
    topics && topics.length
      ? (topics.filter((t) => brainstormingTopics.some((topic) => topic.id === t)) as BrainstormingTopic[])
      : (brainstormingTopics.map((t) => t.id) as BrainstormingTopic[]);

  if (!topicSelection.length) {
    topicSelection = brainstormingTopics.map((t) => t.id) as BrainstormingTopic[];
  }

  const filtered = allQuestions.filter(
    (q) => q.language === language && q.tags.some((tag) => topicSelection.includes(tag))
  );

  const sessionSeed = generateSessionSeed();
  return interleaveByTopics(filtered, topicSelection, sessionSeed);
}

export function getAllQuestions(): Question[] {
  return [...allQuestions];
}
