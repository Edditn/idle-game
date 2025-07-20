// Utility Functions
import { rarityChances, rarities } from './gameData.js';
import { MAX_LEVEL } from './constants.js';

/**
 * Rolls for a rarity based on defined chances.
 * @returns {string} The name of the rolled rarity.
 */
export function rollRarity() {
  const roll = Math.random() * 100;
  let cumulativeChance = 0;
  for (const entry of rarityChances) {
    cumulativeChance += entry.chance;
    if (roll < cumulativeChance) {
      return entry.rarity;
    }
  }
  return 'Common';
}

/**
 * Calculates the XP needed for the next level.
 * @param {number} level - The current player level.
 * @returns {number} The XP required for the next level.
 */
export function calculateXpToNextLevel(level) {
  if (level >= MAX_LEVEL) {
    return 0; // No more XP needed at max level
  }
  return Math.floor(100 * Math.pow(1.1, level - 1));
}

/**
 * Generates a unique ID for items
 * @returns {string} A unique identifier
 */
export function generateUniqueId() {
  return crypto.randomUUID();
}

/**
 * Clamps a value between min and max
 * @param {number} value - The value to clamp
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @returns {number} The clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Formats a number to a specific number of decimal places
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} The formatted number
 */
export function formatNumber(value, decimals = 1) {
  return value.toFixed(decimals);
}

/**
 * Gets a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Gets a random element from an array
 * @param {Array} array - The array to pick from
 * @returns {any} Random element from the array
 */
export function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Calculates percentage with proper formatting
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @returns {number} Percentage (0-100)
 */
export function calculatePercentage(value, total) {
  if (total <= 0) return 0;
  return (value / total) * 100;
}

/**
 * Converts flat stat points to percentage using the K-value formula
 * @param {number} flatValue - The flat stat value
 * @param {number} kValue - The K-value for the stat
 * @returns {number} The percentage value
 */
export function flatToPercentage(flatValue, kValue) {
  return (flatValue / (flatValue + kValue)) * 100;
}

/**
 * Converts percentage to flat stat points needed using the K-value formula
 * @param {number} percentage - The target percentage
 * @param {number} kValue - The K-value for the stat
 * @returns {number} The flat points needed
 */
export function percentageToFlat(percentage, kValue) {
  return (percentage * kValue) / (100 - percentage);
}
