// Game State Management
import { levelZones } from './gameData.js';

// Initialize player state
export const player = {
  name: 'Edd',
  level: 1,
  baseAttack: 0,
  attack: 0,
  baseDefense: 0,
  defense: 0,
  baseMaxHp: 200,
  maxHp: 200,
  baseHealthRegen: 0.5,
  healthRegen: 0.5,
  baseCriticalChance: 0,
  criticalChance: 0,
  baseHaste: 0,
  haste: 0,
  baseMastery: 0,
  mastery: 0,
  hp: 200,
  xp: 0,
  xpToNextLevel: 100,
  gold: 0,
  equippedWeapon: null,
  equippedOffHand: null,
  equippedHead: null,
  equippedShoulders: null,
  equippedChest: null,
  equippedLegs: null,
  equippedFeet: null,
  isHealthRegenCappedByStats: false
};

// Initialize enemy state
export const enemy = {
  name: 'Enemy',
  hp: 150,
  maxHp: 150,
  attack: 10,
  xpReward: 20,
  level: 1
};

// Initialize talents
export const talents = {
  attackSpeed: {
    name: 'Swift Strikes',
    maxRank: 5,
    currentRank: 0,
    bonusPerRank: 5,
  },
  criticalStrike: {
    name: 'Deadly Precision',
    maxRank: 5,
    currentRank: 0,
    bonusPerRank: 3,
  },
  healthRegen: {
    name: 'Vitality',
    maxRank: 5,
    currentRank: 0,
    bonusPerRank: 0.5,
  },
  scalingArmor: {
    name: 'Iron Skin',
    maxRank: 5,
    currentRank: 0,
    bonusPerRank: 100,
  }
};

// Game state variables
export let currentZone = levelZones[0];
export let inventory = [];
export let talentPoints = 0;
export let unspentTalentPoints = 0;
export let shardspireFloor = 1; // Starting floor for Shardspire

// Game control flags
export let isGameOver = false;
export let isGhostForm = false;
export let isResting = false;
export let isEnemySpawnPending = false;
export let autoRestEnabled = true;

// Auto-sell settings
export let autoSellStatsEnabled = false;
export let autoSellCommonEnabled = false;
export let autoSellUncommonEnabled = false;
export let autoSellRareEnabled = false;

// Game speed and timers
export let gameSpeedMultiplier = 1;
export let inventorySortOrder = 'levelDesc';
export let ghostFormTimer = 0;
export let playerAttackStartTime = 0;
export let enemyAttackStartTime = 0;
export let lastAttackTime = 0;
export let combatLoopId = null;

// Timeout and interval IDs
export let playerAttackTimeoutId;
export let enemyAttackTimeoutId;
export let ghostFormInterval;
export let healthRegenInterval;
export let restInterval;

// UI state
export let currentConfirmationCallback = null;
export let isPlayerNameInputFocused = false;

// State update functions
export function setCurrentZone(zone) {
  currentZone = zone;
}

export function setShardspireFloor(floor) {
  shardspireFloor = Math.max(1, Math.min(20, floor)); // Clamp between 1-20
}

export function setGameOver(state) {
  isGameOver = state;
}

export function setGhostForm(state) {
  isGhostForm = state;
}

export function setResting(state) {
  isResting = state;
}

export function setEnemySpawnPending(state) {
  isEnemySpawnPending = state;
}

export function setAutoRestEnabled(state) {
  autoRestEnabled = state;
}

export function setAutoSellStatsEnabled(state) {
  autoSellStatsEnabled = state;
}

export function setAutoSellCommonEnabled(state) {
  autoSellCommonEnabled = state;
}

export function setAutoSellUncommonEnabled(state) {
  autoSellUncommonEnabled = state;
}

export function setAutoSellRareEnabled(state) {
  autoSellRareEnabled = state;
}

export function setGameSpeedMultiplier(multiplier) {
  gameSpeedMultiplier = multiplier;
  
  // Restart systems that depend on intervals
  import('./healthSystem.js').then(healthModule => {
    healthModule.restartHealthRegenLoop();
  });
}

export function setInventorySortOrder(order) {
  inventorySortOrder = order;
}

export function setGhostFormTimer(time) {
  ghostFormTimer = time;
}

export function setPlayerAttackStartTime(time) {
  playerAttackStartTime = time;
}

export function setEnemyAttackStartTime(time) {
  enemyAttackStartTime = time;
}

export function setCurrentConfirmationCallback(callback) {
  currentConfirmationCallback = callback;
}

export function setPlayerNameInputFocused(state) {
  isPlayerNameInputFocused = state;
}

export function setTalentPoints(points) {
  talentPoints = points;
}

export function setUnspentTalentPoints(points) {
  unspentTalentPoints = points;
}

export function incrementTalentPoints() {
  talentPoints++;
  unspentTalentPoints++;
}

export function decrementUnspentTalentPoints() {
  if (unspentTalentPoints > 0) {
    unspentTalentPoints--;
  }
}

// Timeout ID setters
export function setPlayerAttackTimeoutId(id) {
  playerAttackTimeoutId = id;
}

export function setEnemyAttackTimeoutId(id) {
  enemyAttackTimeoutId = id;
}

export function setGhostFormInterval(id) {
  ghostFormInterval = id;
}

export function setHealthRegenInterval(id) {
  healthRegenInterval = id;
}

export function setRestInterval(id) {
  restInterval = id;
}

export function setLastAttackTime(time) {
  lastAttackTime = time;
}

export function setCombatLoopId(id) {
  combatLoopId = id;
}
