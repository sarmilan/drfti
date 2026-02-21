import type { Scenario } from './types';

// ramen-shop.json will be placed at data/scenarios/ramen-shop.json (Step 3)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ramenShop = require('./scenarios/ramen-shop.json') as Scenario;

export const scenarios: Scenario[] = [ramenShop];

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}

export function getScenariosByLanguage(lang: 'ja' | 'fr'): Scenario[] {
  return scenarios.filter((s) => s.language === lang);
}
