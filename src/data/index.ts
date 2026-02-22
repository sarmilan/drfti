import type { Scenario } from './types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ramenShop = require('./scenarios/ramen-shop.json') as Scenario;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const convenienceStore = require('./scenarios/convenience-store.json') as Scenario;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cafe = require('./scenarios/cafe.json') as Scenario;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const shoeStore = require('./scenarios/shoe-store.json') as Scenario;

export const scenarios: Scenario[] = [ramenShop, convenienceStore, cafe, shoeStore];

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}

export function getScenariosByLanguage(lang: 'ja' | 'fr'): Scenario[] {
  return scenarios.filter((s) => s.language === lang);
}
