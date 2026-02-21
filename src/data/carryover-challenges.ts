export interface CarryoverChallenge {
  id: string;
  i18nKey: string;
}

export const CARRYOVER_CHALLENGES: CarryoverChallenge[] = [
  { id: 'orderCoffee', i18nKey: 'carryover.orderCoffee' },
  { id: 'callFamily', i18nKey: 'carryover.callFamily' },
  { id: 'greetNeighbor', i18nKey: 'carryover.greetNeighbor' },
  { id: 'askQuestion', i18nKey: 'carryover.askQuestion' },
  { id: 'readAloud', i18nKey: 'carryover.readAloud' },
  { id: 'orderRestaurant', i18nKey: 'carryover.orderRestaurant' },
  { id: 'phoneFriend', i18nKey: 'carryover.phoneFriend' },
  { id: 'talkDoctor', i18nKey: 'carryover.talkDoctor' },
  { id: 'greetCashier', i18nKey: 'carryover.greetCashier' },
  { id: 'singAlong', i18nKey: 'carryover.singAlong' },
  { id: 'readNews', i18nKey: 'carryover.readNews' },
  { id: 'askDirections', i18nKey: 'carryover.askDirections' },
  { id: 'introduceYourself', i18nKey: 'carryover.introduceYourself' },
  { id: 'tellStory', i18nKey: 'carryover.tellStory' },
  { id: 'phoneOrder', i18nKey: 'carryover.phoneOrder' },
];

export function getTodayChallenge(): CarryoverChallenge {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return CARRYOVER_CHALLENGES[dayOfYear % CARRYOVER_CHALLENGES.length];
}
