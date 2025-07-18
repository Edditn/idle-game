// game.js
// This file now contains all your JavaScript logic.
// For larger projects, you would further split this file into modules.

// --- Suggested Modularization Points (for future splitting) ---

// 1. Data Definitions (e.g., in 'data.js')
//    You would 'export' these constants and variables from 'data.js'
//    and 'import' them into 'game.js' (and other relevant modules).
//    Example: export let player = {...}; export const levelZones = [...];
//    Then in this file: import { player, enemy, levelZones, rarities, statAffixes, items, lootTable } from './data.js';

// Game state variables
let player = {
  name: 'Edd',
  level: 1,
  baseAttack: 10, // Base attack without equipment - now dynamically scaled
  attack: 10, // Current attack including equipment
  baseDefense: 0, // Base defense without equipment
  defense: 0, // Current defense including equipment
  baseMaxHp: 200, // Base maximum health - CHANGED from 100 to 150
  maxHp: 200, // Current max HP including equipment - CHANGED from 100 to 150
  baseHealthRegen: 1.0, // Base health regeneration per second - CHANGED from 0.5 to 1.0
  healthRegen: 1.0, // Current health regen - CHANGED from 0.5 to 1.0
  baseCriticalChance: 0, // Changed from 5 to 0. Critical chance will now primarily come from items/talents.
  criticalChance: 0, // Current critical chance
  baseHaste: 0,     // NEW: Base Haste
  haste: 0,     // NEW: Current Haste
  hp: 200, // Initial HP - CHANGED from 100 to 150
  xp: 0, // Current experience points
  xpToNextLevel: 100, // XP required for next level (initial value)
  gold: 0, // Player's current gold
  equippedWeapon: null, // Stores the currently equipped main hand weapon object
  equippedOffHand: null, // Stores the currently equipped off hand weapon object
  equippedHead: null,
  equippedShoulders: null,
  equippedChest: null,
  equippedLegs: null,
  equippedFeet: null // New: Feet slot
};
let enemy = {
  name: 'Enemy',
  hp: 75,
  maxHp: 75,
  attack: 10, // Enemy attack value - This will be calculated on reset
  xpReward: 20, // XP awarded upon defeat - This will be calculated on reset
  level: 1 // New: Enemy level
};
// Define zones and their monster level ranges (no longer directly used for min/max enemy level relative to player)
// NEW: Level-based zones with specific enemy names
const levelZones = [
  { name: 'Ashfen', minLevel: 1, maxLevel: 10, enemyNames: ['Howler', 'Bogboar', 'Cindling'] },
  { name: 'Eastgale', minLevel: 10, maxLevel: 20, enemyNames: ['Wretch', 'Jackal', 'Cairnkin'] },
  { name: 'Dawnnmere', minLevel: 20, maxLevel: 30, enemyNames: ['Sunborn', 'Willow', 'Hollowed'] },
  { name: 'Frostheath', minLevel: 30, maxLevel: 40, enemyNames: ['Sporeback', 'Creeper', 'Leechkin'] },
  { name: 'Miredeep', minLevel: 40, maxLevel: 50, enemyNames: ['Sinkmaw', 'Lantern', 'Snapper'] },
  { name: 'Hallowmere', minLevel: 50, maxLevel: 60, enemyNames: ['Revenant', 'Scrollkin', 'Saintless '] },
  { name: 'Embercrest', minLevel: 60, maxLevel: 70, enemyNames: ['Scourge', 'Ashchant', 'Cinderrake'] },
  { name: 'Voidwell', minLevel: 70, maxLevel: 80, enemyNames: ['Unshaper', 'Flicker', 'Watcher'] },
  { name: 'Crimvale', minLevel: 80, maxLevel: 90, enemyNames: ['Gorehide', 'Thornsoul', 'Warden'] },
  { name: 'Aurelia', minLevel: 90, maxLevel: 100, enemyNames: ['Gildborn ', 'Exultant', 'Mirrorkin'] },
  { name: 'Shardspire', minLevel: 100, maxLevel: Infinity, enemyNames: ['Fracture', 'Chrono', 'Eversplit'] } // For 100+
];
let currentZone = levelZones[0]; // Initial zone is Ashfen
// Base game intervals (these will be divided by gameSpeedMultiplier)
const BASE_PLAYER_ATTACK_INTERVAL_MS = 2000; // 2 seconds
const BASE_ENEMY_ATTACK_INTERVAL_MS = 2935; // random and desynced
const BASE_HEALTH_REGEN_INTERVAL_MS = 1000; // 1 second for health regen
const HEALTH_REGEN_CAP_PERCENTAGE = 0.05; // 5% of Max HP per second
const BASE_PLAYER_MISS_CHANCE = 1; // NEW: Base miss chance for player (1%)
let playerGameInterval; // To hold the setInterval ID for player attacks
let enemyGameInterval; // To hold the setInterval ID for enemy attacks
let ghostFormInterval; // To hold the setInterval ID for ghost form countdown
let healthRegenInterval; // New interval for health regeneration
let restInterval; // New interval for resting countdown
// Game speed multiplier
let gameSpeedMultiplier = 1;
const GHOST_FORM_DURATION_MS = 45000; // 45 seconds for ghost form (CHANGED)
const GHOST_FORM_UPDATE_INTERVAL_MS = 100; // Update ghost form timer every 100ms for smoothness
const REST_UPDATE_INTERVAL_MS = 100; // Update rest timer every 100ms
const REST_HP_THRESHOLD = 0.35; // 35% HP to trigger rest
const REST_ENTRY_HP_THRESHOLD = 0.85; // Cannot rest at or above 85% HP
const MAX_LEVEL = 100; // Define maximum player level
// const MAX_LEVEL_DIFFERENCE = 4; // Monster can be max 4 levels above player (REMOVED)
const ENEMY_LEVEL_RANGE = 2; // Enemies will be +/- 2 levels from player's level
const ENEMY_SPAWN_DELAY_MS = 1500; // 0.25 second delay between enemy spawns
let isGameOver = false; // Game over flag (for full reset)
let isGhostForm = false; // Ghost form flag
let isResting = false; // New: Resting flag
let isEnemySpawnPending = false; // Track if we're waiting for an enemy spawn
let autoRestEnabled = true; // New: Flag for auto-rest checkbox state - SET TO TRUE BY DEFAULT
// Removed levelRangeBoost as it's no longer needed
let inventorySortOrder = 'levelDesc'; // New: Default sort order for inventory (level descending)
let ghostFormTimer = 0; // Current ghost form countdown timer
let playerAttackStartTime = 0; // Timestamp when player's current attack cycle started
let enemyAttackStartTime = 0; // Timestamp when enemy's current attack cycle started
// Define rarities and their properties (color and level boost)
const rarities = {
  Common: { color: '#e2e8f0', levelBoost: 0 }, // White
  Uncommon: { color: '#48bb78', levelBoost: 3 }, // Green (Reduced from 5)
  Rare: { color: '#63b3ed', levelBoost: 6 }, // Blue (Reduced from 10)
  Epic: { color: '#9f7aea', levelBoost: 9 }, // Purple (Reduced from 15)
  Legendary: { color: '#f6ad55', levelBoost: 15 }, // Orange (Reduced from 25)
};

// Define stat affixes and their weights (total weight 15 per affix for weapons, 15 for armor)
const statAffixes = {
    // Weapon Affixes (Attack, Critical Chance, Haste) - Total Weight: 15
    'of the Bear': { // Balanced
        attack: 5,
        criticalChance: 5,
        haste: 5,
        types: ['weapon', 'dagger']
    },
    'of the Wolf': { // Attack focused
        attack: 9,
        criticalChance: 3,
        haste: 3,
        types: ['weapon', 'dagger']
    },
    'of the Tiger': { // Critical Chance focused
        attack: 3,
        criticalChance: 9,
        haste: 3,
        types: ['weapon', 'dagger']
    },
    'of the Eagle': { // Haste focused
        attack: 3,
        criticalChance: 3,
        haste: 9,
        types: ['weapon', 'dagger']
    },
    // Armor Affixes (Defense, Max HP, Health Regen) - Total Weight: 15
    'of the Boar': { // Defense focused (changed name to Boar for armor)
        defense: 9,
        maxHp: 3,
        healthRegen: 0.3, // Adjusted from 3 to 0.3
        types: ['head', 'shoulders', 'chest', 'legs', 'feet']
    },
    'of the Mammoth': { // Max HP focused (changed name to Mammoth for armor)
        defense: 3,
        maxHp: 9,
        healthRegen: 0.3, // Adjusted from 3 to 0.3
        types: ['head', 'shoulders', 'chest', 'legs', 'feet']
    },
    'of the Phoenix': { // Health Regen focused (changed name to Phoenix for armor)
        defense: 3,
        maxHp: 3,
        healthRegen: 0.9, // Adjusted from 9 to 0.9
        types: ['head', 'shoulders', 'chest', 'legs', 'feet']
    },
    'of the Rhino': { // Balanced (new name for armor)
        defense: 5,
        maxHp: 5,
        healthRegen: 0.5, // Adjusted from 5 to 0.5
        types: ['head', 'shoulders', 'chest', 'legs', 'feet']
    }
};

// Define rarity chances for item drops
const rarityChances = [
  { rarity: 'Common', chance: 82 },
  { rarity: 'Uncommon', chance: 15 },
  { rarity: 'Rare', chance: 2.5 },
  { rarity: 'Epic', chance: 0.49 },
  { rarity: 'Legendary', chance: 0.01 },
];
// Item definitions - now with 'baseStatValue' instead of individual bonuses
const items = {
  Coin: { name: 'Coin', type: 'currency' },
  // baseStatValue will be multiplied by affix weights and effective level
  'Iron Sword': { name: 'Iron Sword', type: 'weapon', baseStatValue: 0.1 },
  'Iron Dagger': { name: 'Iron Dagger', type: 'dagger', baseStatValue: 0.1 },
  'Iron Helmet': {name: 'Iron Helmet',type: 'head',baseStatValue: 0.1}, // Reverted baseStatValue to 0.1
  'Iron Pauldrons': { name: 'Iron Pauldrons', type: 'shoulders', baseStatValue: 0.1 }, // Reverted baseStatValue to 0.1
  'Iron Chestplate': { name: 'Iron Chestplate', type: 'chest', baseStatValue: 0.1 }, // Reverted baseStatValue to 0.1
  'Iron Greaves': { name: 'Iron Greaves', type: 'legs', baseStatValue: 0.1 }, // Reverted baseStatValue to 0.1
  'Iron Boots': { name: 'Iron Boots', type: 'feet', baseStatValue: 0.1 } // Reverted baseStatValue to 0.1
};
// Loot table definitions (items now refer to the base item, rarity is rolled later)
// Removed Leather items, Dagger, and Copper Sword. Significantly increased drop chances.
const lootTable = [
  { item: items['Coin'], minQuantity: 3, maxQuantity: 8, dropChance: 5 }, // Kept the same
  { item: items['Iron Sword'], minQuantity: 1, maxQuantity: 1, dropChance: 1.5 }, // Tripled
  { item: items['Iron Dagger'], minQuantity: 1, maxQuantity: 1, dropChance: 1.5 }, // Tripled
  { item: items['Iron Helmet'], minQuantity: 1, maxQuantity: 1, dropChance: 1.5 }, // More than doubled
  { item: items['Iron Pauldrons'], minQuantity: 1, maxQuantity: 1, dropChance: 1.5 }, // More than doubled
  { item: items['Iron Chestplate'], minQuantity: 1, maxQuantity: 1, dropChance: 1.5 }, // More than doubled
  { item: items['Iron Greaves'], minQuantity: 1, maxQuantity: 1, dropChance: 1.5 }, // More than doubled
  { item: items['Iron Boots'], minQuantity: 1, maxQuantity: 1, dropChance: 1.5 } // More than doubled
];
let inventory = []; // Changed to an ARRAY to store item INSTANCES
// NEW: Talent Points
let talentPoints = 0;
let unspentTalentPoints = 0;

// 2. DOM Element References (could be in a separate 'dom.js' or 'ui_elements.js' module)
//    You would 'export' an object containing these references.
//    Example: export const DOMElements = { playerHpBarFillEl: document.getElementById(...) };
//    Then in this file: import { DOMElements } from './dom.js';
//    And use DOMElements.playerHpBarFillEl instead of playerHpBarFillEl directly.
const charSectionTitleEl = document.getElementById('char-section-title'); // Character section title element
const enemySectionTitleEl = document.getElementById('enemy-section-title'); // Enemy section title element
const playerHpBarFillEl = document.getElementById('player-hp-bar-fill'); // Player HP bar fill
const playerHpTextOverlayEl = document.getElementById('player-hp-text-overlay'); // Player HP text overlay
const enemyHpBarFillEl = document.getElementById('enemy-hp-bar-fill'); // Enemy HP bar fill
const enemyHpTextOverlayEl = document.getElementById('enemy-hp-text-overlay'); // Enemy HP text overlay
const currentZoneDisplayEl = document.getElementById('current-zone-display'); // New: Current Zone display in enemy stats
const logAreaEl = document.getElementById('log-area');
const playerAttackProgressFillEl = document.getElementById('player-attack-progress-fill'); // Player Attack progress bar fill element
const playerAttackTimerTextEl = document.getElementById('player-attack-timer-text'); // Player attack timer text
const enemyAttackProgressFillEl = document.getElementById('enemy-attack-progress-fill'); // Enemy Attack progress bar fill element
const enemyAttackTimerTextEl = document.getElementById('enemy-attack-timer-text'); // Enemy attack timer text
const xpProgressFillEl = document.getElementById('xp-progress-fill'); // XP progress bar fill element
const xpTextOverlayEl = document.getElementById('xp-text-overlay'); // XP text overlay element
const gameOverOverlayEl = document.getElementById('gameOverOverlay'); // Game Over overlay
const restartGameBtn = document.getElementById('restartGameBtn'); // Restart Game button
const ghostFormOverlayEl = document.getElementById('ghostFormOverlay'); // Ghost Form overlay
const ghostFormProgressFillEl = document.getElementById('ghost-form-progress-fill'); // Ghost Form progress bar fill
const ghostFormTimerTextEl = document.getElementById('ghost-form-timer-text'); // Ghost Form timer text
const inventoryListEl = document.getElementById('inventory-list');
const goldDisplayEl = document.getElementById('gold-display');
const itemTooltipEl = document.getElementById('item-tooltip'); // Tooltip element
const equippedListEl = document.getElementById('equipped-list'); // Equipped items list element
// New DOM elements for Player Stats window
const statMaxHealthEl = document.getElementById('stat-max-health');
const statHealthRegenEl = document.getElementById('stat-health-regen');
const statDamageEl = document.getElementById('stat-damage');
const statArmorEl = document.getElementById('stat-armor');
const statCriticalChanceEl = document.getElementById('stat-critical-chance');
// NEW: Haste stat element
const statHasteEl = document.getElementById('stat-haste');
// New DOM element for the global combat text overlay
const combatTextOverlayEl = document.getElementById('combat-text-overlay');
const gameContainerEl = document.querySelector('.game-container'); // Get the main game container
// New DOM elements for Settings Overlay
const settingsButton = document.getElementById('settingsButton');
const settingsOverlay = document.getElementById('settingsOverlay');
const closeSettingsButton = document.getElementById('closeSettings');
const volumeControl = document.getElementById('volumeControl');
const darkModeToggle = document.getElementById('darkModeToggle');
const resetGameFromSettingsBtn = document.getElementById('resetGameFromSettingsBtn'); // New reset button in settings
// NEW: Save/Load buttons
const saveGameBtn = document.getElementById('saveGameBtn');
const loadGameBtn = document.getElementById('loadGameBtn'); // Renamed from loadFileInput to loadGameBtn
const loadFileInput = document.getElementById('loadFileInput'); // Hidden file input for loading
const autoRestCheckbox = document.getElementById('autoRestCheckbox'); // New: Auto-Rest checkbox
const forceRestBtn = document.getElementById('forceRestBtn'); // New: Force Rest button
const sellAllBtn = document.getElementById('sellAllBtn'); // New: Sell All button
const sortInventoryBtn = document.getElementById('sortInventoryBtn'); // New: Sort Inventory button
// New DOM elements for Help Overlay
const helpButton = document.getElementById('helpButton');
const helpOverlay = document.getElementById('helpOverlay');
const helpCloseButton = helpOverlay.querySelector('.close-button');
// New: Confirmation Modal Elements
const confirmationModalOverlay = document.getElementById('confirmationModalOverlay');
const confirmationModalTitle = document.getElementById('confirmationModalTitle');
const confirmationModalMessage = document.getElementById('confirmationModalMessage');
const confirmButton = document.getElementById('confirmButton');
const cancelButton = document.getElementById('cancelButton');
// NEW: Main Zone Display and Navigation Buttons
const mainCurrentZoneDisplayEl = document.getElementById('main-current-zone-display');
const prevZoneBtn = document.getElementById('prevZoneBtn');
const nextZoneBtn = document.getElementById('nextZoneBtn');
// NEW: Enemy Attack Power Display
const enemyAttackPowerDisplayEl = document.getElementById('enemy-attack-power-display');
// NEW: Game Speed Radios
const gameSpeedRadios = document.querySelectorAll('input[name="gameSpeed"]');

// NEW: Player Name Input and Level Display Elements
const playerNameInputEl = document.getElementById('player-name-input');
const playerLevelDisplayEl = document.getElementById('player-level-display');
// NEW: Enemy Name and Level Display Elements
const enemyNameDisplayEl = document.getElementById('enemy-name-display');
const enemyLevelDisplayEl = document.getElementById('enemy-level-display');
// Talent Points Display
const talentPointsDisplayEl = document.getElementById('talent-points-display');
const spendTalentPointBtn = document.getElementById('spend-talent-point-btn');
const attackSpeedTalentBtn = document.getElementById('attackSpeedTalent');
const criticalStrikeTalentBtn = document.getElementById('criticalStrikeTalentBtn');
const healthRegenTalentBtn = document.getElementById('healthRegenTalentBtn');
const scalingArmorTalentBtn = document.getElementById('scalingArmorTalentBtn');

// Talent tracking
let talents = {
  attackSpeed: {
    name: 'Swift Strikes',
    maxRank: 5,
    currentRank: 0,
    bonusPerRank: 5, // 5% attack speed per rank
  },
  criticalStrike: {
    name: 'Deadly Precision',
    maxRank: 5,
    currentRank: 0,
    bonusPerRank: 3, // 3% critical strike chance per rank
  },
  healthRegen: {
    name: 'Vitality',
    maxRank: 5,
    currentRank: 0,
    bonusPerRank: 0.5, // 0.5 flat health regen per rank
  },
  scalingArmor: {
    name: 'Iron Skin',
    maxRank: 5,
    currentRank: 0,
    bonusPerRank: 100, // Base armor value that will scale with level
  }
};

let currentConfirmationCallback = null; // Stores the callback for the active confirmation modal
let isPlayerNameInputFocused = false; // NEW: Flag to track if player name input is focused

// 3. Utility Functions (e.g., in 'utils.js')
//    Functions like logMessage, showCombatText, calculateXpToNextLevel, applyDamageVariance,
//    and modal functions could go here.
//    Example: export function logMessage(msg) {...};
//    Then in this file: import { logMessage } from './utils.js';

/**
 * Recalculates player's total attack and defense based on base stats and equipped items.
 */
function updatePlayerStats() {
  // Reset to base stats
  // player.baseAttack is now calculated in resetGame and levelUp
  player.attack = player.baseAttack;
  player.defense = player.baseDefense;
  player.maxHp = player.baseMaxHp;
  player.healthRegen = player.baseHealthRegen;
  player.criticalChance = player.baseCriticalChance;
  player.haste = player.baseHaste;

  // Apply talent bonuses
  // Attack Speed (Haste)
  player.haste += talents.attackSpeed.currentRank * talents.attackSpeed.bonusPerRank;
  
  // Critical Strike
  player.criticalChance += talents.criticalStrike.currentRank * talents.criticalStrike.bonusPerRank;
  
  // Health Regen
  player.healthRegen += talents.healthRegen.currentRank * talents.healthRegen.bonusPerRank;
  
  // Scaling Armor (increases with level)
  const armorBonus = talents.scalingArmor.currentRank * talents.scalingArmor.bonusPerRank * (1 + player.level * 0.1);
  player.defense += armorBonus;
  // Apply equipped item bonuses based on their actual itemLevel AND rarityBoost
  const equippedItems = [
    player.equippedWeapon,
    player.equippedOffHand,
    player.equippedHead,
    player.equippedShoulders,
    player.equippedChest,
    player.equippedLegs,
    player.equippedFeet
  ];
  equippedItems.forEach(item => {
    if (item && item.affix) { // Ensure item and its affix exist
      // Calculate effective level for stats based on item's actual level and its rarity boost
      const effectiveStatLevel = item.itemLevel + (rarities[item.rarity]?.levelBoost || 0);
      const baseValue = item.baseStatValue; // Get the base value for this item type
      const affixWeights = item.affix.weights; // Get the weights from the item's affix

      if (item.type === 'weapon' || item.type === 'dagger') {
        player.attack += (affixWeights.attack || 0) * baseValue * effectiveStatLevel;
        player.criticalChance += (affixWeights.criticalChance || 0) * baseValue * effectiveStatLevel;
        player.haste += (affixWeights.haste || 0) * baseValue * effectiveStatLevel;
      } else if (['head', 'shoulders', 'chest', 'legs', 'feet'].includes(item.type)) {
        player.maxHp += (affixWeights.maxHp || 0) * baseValue * effectiveStatLevel;
        player.healthRegen += (affixWeights.healthRegen || 0) * baseValue * effectiveStatLevel;
        player.defense += (affixWeights.defense || 0) * baseValue * effectiveStatLevel;
      }
    }
  });
  // Ensure current HP doesn't exceed new max HP
  if (player.hp > player.maxHp) {
    player.hp = player.maxHp;
  }
  updateUI(); // Update UI to reflect new stats
}
/**
 * Updates the visual representation of the inventory based on the 'inventory' object.
 */
function updateInventoryUI() {
  hideTooltip(); // Explicitly hide the tooltip before rebuilding the list
  inventoryListEl.innerHTML = ''; // Clear existing list items
  if (inventory.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.classList.add('inventory-list-item');
    emptyMessage.textContent = 'Inventory is empty.';
    emptyMessage.style.justifyContent = 'center'; /* Center text for empty message */
    emptyMessage.style.fontStyle = 'italic';
    emptyMessage.style.color = '#a0aec0';
    inventoryListEl.appendChild(emptyMessage);
  } else {
    // Create a copy of the inventory to sort, so the original order isn't permanently changed
    // unless we explicitly want to persist it. For now, just sort for display.
    let sortedInventory = [...inventory];
    if (inventorySortOrder === 'levelDesc') {
      sortedInventory.sort((a, b) => b.itemLevel - a.itemLevel); // Sort by level, descending
    }
    // Add more sorting options here if needed (e.g., by name, rarity)
    // Group items by name, level, and rarity for display, but keep individual instances for equipping
    const groupedInventory = {};
    sortedInventory.forEach(itemInstance => {
      // Include affix name in the key for grouping
      const key = `${itemInstance.name}_L${itemInstance.itemLevel}_R${itemInstance.rarity}_A${itemInstance.affix ? itemInstance.affix.name : 'None'}`;
      if (!groupedInventory[key]) {
        groupedInventory[key] = {
          item: itemInstance, // Store one instance to get data from
          quantity: 0,
          instances: [] // Store all instances for equipping
        };
      }
      groupedInventory[key].quantity++;
      groupedInventory[key].instances.push(itemInstance);
    });
    for (const key in groupedInventory) {
      const group = groupedInventory[key];
      const itemData = group.item; // Use the stored item instance for data
      const listItem = document.createElement('div');
      listItem.classList.add('inventory-list-item');
      // Store the ID of the first instance in the group for click event
      listItem.dataset.itemId = itemData.id; // Still use an ID for delegation, but equipItem will need to find the specific instance
      listItem.dataset.itemName = itemData.name; // Store item name for tooltip
      listItem.dataset.itemType = itemData.type; // Store item type for tooltip
      const nameSpan = document.createElement('span');
      nameSpan.classList.add('item-name');
      // Display item name with affix
      nameSpan.textContent = `${itemData.name} ${itemData.affix ? itemData.affix.name : ''} (Lvl ${itemData.itemLevel})`;
      if (itemData.rarity && rarities[itemData.rarity]) {
        nameSpan.style.color = rarities[itemData.rarity].color;
      }
      listItem.appendChild(nameSpan);
      const quantitySpan = document.createElement('span');
      quantitySpan.classList.add('item-quantity');
      quantitySpan.textContent = `x ${group.quantity}`;
      listItem.appendChild(quantitySpan);
      // Attach mouseover/mouseout to the listItem, passing the representative itemData AND true for isInventoryItem
      listItem.addEventListener('mouseover', e => showTooltip(e, itemData, true));
      listItem.addEventListener('mouseout', hideTooltip);
      inventoryListEl.appendChild(listItem);
    }
  }
}
/**
 * Updates the visual representation of the equipped items.
 */
function updateEquippedItemsUI() {
  hideTooltip(); // Explicitly hide the tooltip before rebuilding the list
  equippedListEl.innerHTML = ''; // Clear existing list
  const equippedSlots = [
    { slot: 'equippedWeapon', item: player.equippedWeapon, label: 'Main Hand' },
    { slot: 'equippedOffHand', item: player.equippedOffHand, label: 'Off Hand' },
    { slot: 'equippedHead', item: player.equippedHead, label: 'Head' },
    { slot: 'equippedShoulders', item: player.equippedShoulders, label: 'Shoulders' },
    { slot: 'equippedChest', item: player.equippedChest, label: 'Chest' },
    { slot: 'equippedLegs', item: player.equippedLegs, label: 'Legs' },
    { slot: 'equippedFeet', item: player.equippedFeet, label: 'Feet' } // New: Feet slot
  ];
  for (const slotInfo of equippedSlots) {
    const listItem = document.createElement('div');
    listItem.classList.add('equipped-list-item');
    listItem.dataset.slot = slotInfo.slot; // Store slot type
    if (slotInfo.item) {
      // slotInfo.item is now the actual item instance
      listItem.dataset.itemId = slotInfo.item.id; // Use unique ID for event delegation
      listItem.dataset.itemName = slotInfo.item.name; // Store item name for tooltip
      listItem.dataset.itemType = slotInfo.item.type; // Store item type for tooltip
      // Display item name with affix
      listItem.textContent = `${slotInfo.item.name} ${slotInfo.item.affix ? slotInfo.item.affix.name : ''} (Lvl ${slotInfo.item.itemLevel}) (${slotInfo.label})`;
      if (slotInfo.item.rarity && rarities[slotInfo.item.rarity]) {
        listItem.style.color = rarities[slotInfo.item.rarity].color; // Apply color to the whole list item
      }
      // Attach mouseover/mouseout to the listItem for equipped items
      listItem.addEventListener('mouseover', e => showTooltip(e, slotInfo.item, false)); // Pass false for isInventoryItem
      listItem.addEventListener('mouseout', hideTooltip);
    } else {
      listItem.textContent = `${slotInfo.label}: Empty`;
      // No hover/click for empty slots
    }
    equippedListEl.appendChild(listItem);
  }
  // Removed the "No items equipped." message logic
}

/**
 * Determines the equipped item in the primary slot for comparison based on the inventory item's type.
 * @param {object} inventoryItem - The inventory item instance being hovered.
 * @returns {object|null} The equipped item instance in the primary slot, or null if no relevant item is equipped.
 */
function getEquippedItemForComparison(inventoryItem) {
    const itemType = inventoryItem.type;
    // Map item types to the player's equipped properties (slots)
    const itemSlotMap = {
        weapon: ['equippedWeapon', 'equippedOffHand'], // Weapons can go in either main or off-hand
        dagger: ['equippedOffHand'], // Daggers can ONLY go in off-hand
        head: ['equippedHead'],
        shoulders: ['equippedShoulders'],
        chest: ['equippedChest'],
        legs: ['equippedLegs'],
        feet: ['equippedFeet']
    };
    const possibleSlots = itemSlotMap[itemType];

    if (!possibleSlots || possibleSlots.length === 0) {
        return null; // No defined slots for this item type
    }

    let targetSlotProp = null;
    // Prioritize main hand for general weapons, off-hand for daggers
    if (itemType === 'weapon') {
        targetSlotProp = 'equippedWeapon';
    } else if (itemType === 'dagger') {
        targetSlotProp = 'equippedOffHand';
    } else {
        targetSlotProp = possibleSlots[0]; // For armor, take the first (and usually only) slot
    }

    if (targetSlotProp && player[targetSlotProp]) {
        return player[targetSlotProp];
    }

    return null; // No equipped item found in the target slot
}

/**
 * Displays a tooltip with item information.
 * @param {Event} event - The mouse event.
 * @param {object} itemInstance - The item instance object to display.
 * @param {boolean} isInventoryItem - True if the hovered item is from the inventory, for comparison logic.
 */
function showTooltip(event, itemInstance, isInventoryItem = false) {
  let tooltipContent = '';
  let equippedItemForComparison = null;

  // --- Current Item Details ---
  let itemNameDisplay = itemInstance.name;
  if (itemInstance.affix && itemInstance.affix.name) {
      itemNameDisplay += ` ${itemInstance.affix.name}`; // Add affix name to display
  }
  tooltipContent += `<strong>${itemNameDisplay} (Lvl ${itemInstance.itemLevel})</strong>`;
  if (itemInstance.rarity) {
    tooltipContent += `<br><span style="color: ${rarities[itemInstance.rarity].color};">${itemInstance.rarity}</span>`;
  }

  const effectiveStatLevel = itemInstance.itemLevel + (rarities[itemInstance.rarity]?.levelBoost || 0);
  const baseValue = itemInstance.baseStatValue;
  const affixWeights = itemInstance.affix ? itemInstance.affix.weights : {};

  const currentItemStats = {};
  if (itemInstance.type === 'weapon' || itemInstance.type === 'dagger') {
    currentItemStats.attack = (affixWeights.attack || 0) * baseValue * effectiveStatLevel;
    currentItemStats.criticalChance = (affixWeights.criticalChance || 0) * baseValue * effectiveStatLevel;
    currentItemStats.haste = (affixWeights.haste || 0) * baseValue * effectiveStatLevel;

    if (affixWeights.attack) tooltipContent += `<br>Attack: +${currentItemStats.attack.toFixed(0)}`;
    if (affixWeights.criticalChance) tooltipContent += `<br>Crit Chance: +${currentItemStats.criticalChance.toFixed(1)}%`;
    if (affixWeights.haste) tooltipContent += `<br>Haste: +${currentItemStats.haste.toFixed(1)}%`;
  } else if (['head', 'shoulders', 'chest', 'legs', 'feet'].includes(itemInstance.type)) {
    currentItemStats.defense = (affixWeights.defense || 0) * baseValue * effectiveStatLevel;
    currentItemStats.maxHp = (affixWeights.maxHp || 0) * baseValue * effectiveStatLevel;
    currentItemStats.healthRegen = (affixWeights.healthRegen || 0) * baseValue * effectiveStatLevel;

    if (affixWeights.defense) tooltipContent += `<br>Defense: +${currentItemStats.defense.toFixed(1)}`;
    if (affixWeights.maxHp) tooltipContent += `<br>Max HP: +${currentItemStats.maxHp.toFixed(1)}`;
    if (affixWeights.healthRegen) tooltipContent += `<br>HP Regen: +${currentItemStats.healthRegen.toFixed(2)}`;
  }

  // --- Comparison Logic (if from inventory) ---
  if (isInventoryItem) {
      equippedItemForComparison = getEquippedItemForComparison(itemInstance);

      if (equippedItemForComparison) {
          tooltipContent += `<div class="comparison-section">`;
          tooltipContent += `<strong>Currently Equipped:</strong>`;

          let equippedItemNameDisplay = equippedItemForComparison.name;
          if (equippedItemForComparison.affix && equippedItemForComparison.affix.name) {
              equippedItemNameDisplay += ` ${equippedItemForComparison.affix.name}`;
          }
          tooltipContent += `<br>${equippedItemNameDisplay} (Lvl ${equippedItemForComparison.itemLevel})`;
          if (equippedItemForComparison.rarity) {
              tooltipContent += `<br><span style="color: ${rarities[equippedItemForComparison.rarity].color};">${equippedItemForComparison.rarity}</span>`;
          }

          const equippedEffectiveStatLevel = equippedItemForComparison.itemLevel + (rarities[equippedItemForComparison.rarity]?.levelBoost || 0);
          const equippedBaseValue = equippedItemForComparison.baseStatValue;
          const equippedAffixWeights = equippedItemForComparison.affix ? equippedItemForComparison.affix.weights : {};

          const equippedItemStats = {};
          if (equippedItemForComparison.type === 'weapon' || equippedItemForComparison.type === 'dagger') {
              equippedItemStats.attack = (equippedAffixWeights.attack || 0) * equippedBaseValue * equippedEffectiveStatLevel;
              equippedItemStats.criticalChance = (equippedAffixWeights.criticalChance || 0) * equippedBaseValue * equippedEffectiveStatLevel;
              equippedItemStats.haste = (equippedAffixWeights.haste || 0) * equippedBaseValue * equippedEffectiveStatLevel;

              if (equippedAffixWeights.attack) {
                  const diff = currentItemStats.attack - equippedItemStats.attack;
                  const diffClass = diff > 0 ? 'positive' : (diff < 0 ? 'negative' : 'neutral');
                  tooltipContent += `<br>Attack: +${equippedItemStats.attack.toFixed(0)} <span class="stat-diff ${diffClass}">(${diff > 0 ? '+' : ''}${diff.toFixed(0)})</span>`;
              }
              if (equippedAffixWeights.criticalChance) {
                  const diff = currentItemStats.criticalChance - equippedItemStats.criticalChance;
                  const diffClass = diff > 0 ? 'positive' : (diff < 0 ? 'negative' : 'neutral');
                  tooltipContent += `<br>Crit Chance: +${equippedItemStats.criticalChance.toFixed(1)}% <span class="stat-diff ${diffClass}">(${diff > 0 ? '+' : ''}${diff.toFixed(1)}%)</span>`;
              }
              if (equippedAffixWeights.haste) {
                  const diff = currentItemStats.haste - equippedItemStats.haste;
                  const diffClass = diff > 0 ? 'positive' : (diff < 0 ? 'negative' : 'neutral');
                  tooltipContent += `<br>Haste: +${equippedItemStats.haste.toFixed(1)}% <span class="stat-diff ${diffClass}">(${diff > 0 ? '+' : ''}${diff.toFixed(1)}%)</span>`;
              }
          } else if (['head', 'shoulders', 'chest', 'legs', 'feet'].includes(equippedItemForComparison.type)) {
              equippedItemStats.defense = (equippedAffixWeights.defense || 0) * equippedBaseValue * equippedEffectiveStatLevel;
              equippedItemStats.maxHp = (equippedAffixWeights.maxHp || 0) * equippedBaseValue * equippedEffectiveStatLevel;
              equippedItemStats.healthRegen = (equippedAffixWeights.healthRegen || 0) * equippedBaseValue * equippedEffectiveStatLevel;

              if (equippedAffixWeights.defense) {
                  const diff = currentItemStats.defense - equippedItemStats.defense;
                  const diffClass = diff > 0 ? 'positive' : (diff < 0 ? 'negative' : 'neutral');
                  tooltipContent += `<br>Defense: +${equippedItemStats.defense.toFixed(1)} <span class="stat-diff ${diffClass}">(${diff > 0 ? '+' : ''}${diff.toFixed(1)})</span>`;
              }
              if (equippedAffixWeights.maxHp) {
                  const diff = currentItemStats.maxHp - equippedItemStats.maxHp;
                  const diffClass = diff > 0 ? 'positive' : (diff < 0 ? 'negative' : 'neutral');
                  tooltipContent += `<br>Max HP: +${equippedItemStats.maxHp.toFixed(1)} <span class="stat-diff ${diffClass}">(${diff > 0 ? '+' : ''}${diff.toFixed(1)})</span>`;
              }
              if (equippedAffixWeights.healthRegen) {
                  const diff = currentItemStats.healthRegen - equippedItemStats.healthRegen;
                  const diffClass = diff > 0 ? 'positive' : (diff < 0 ? 'negative' : 'neutral');
                  tooltipContent += `<br>HP Regen: +${equippedItemStats.healthRegen.toFixed(2)} <span class="stat-diff ${diffClass}">(${diff > 0 ? '+' : ''}${diff.toFixed(2)})</span>`;
              }
          }
          tooltipContent += `</div>`; // Close comparison-section
      }
  }

  itemTooltipEl.innerHTML = tooltipContent;
  itemTooltipEl.style.left = `${event.clientX + 15}px`; // Offset from mouse
  itemTooltipEl.style.top = `${event.clientY + 15}px`;
  itemTooltipEl.classList.remove('hidden');
  itemTooltipEl.classList.add('visible');
}
/**
 * Hides the item tooltip.
 */
function hideTooltip() {
  itemTooltipEl.classList.remove('visible');
  itemTooltipEl.classList.add('hidden'); // Hide instantly
}
/**
 * Updates the gold display on the UI.
 */
function updateGoldUI() {
  goldDisplayEl.textContent = `GOLD: ${player.gold}`;
}
/**
 * Rolls for a rarity based on defined chances.
 * @returns {string} The name of the rolled rarity.
 */
function rollRarity() {
  const roll = Math.random() * 100; // Roll a number between 0 and 99.99...
  let cumulativeChance = 0;
  for (const entry of rarityChances) {
    cumulativeChance += entry.chance;
    if (roll < cumulativeChance) {
      return entry.rarity;
    }
  }
  return 'Common'; // Fallback, should not be reached if chances sum to 100
}
/**
 * Attempts to add an item to the inventory or handle currency.
 * @param {object} itemData - The base item data from the 'items' object.
 * @param {number} quantity - The quantity of the item to add.
 * @param {number} [droppedByEnemyLevel=1] - The level of the enemy that dropped the item. Defaults to 1.
 */
function addItemToInventory(itemData, quantity = 1, droppedByEnemyLevel = 1) {
  if (itemData.type === 'currency') {
    player.gold += quantity;
    logMessage(`You gained ${quantity} ${itemData.name}(s)! Total Gold: ${player.gold}`);
    updateGoldUI();
  } else {
    for (let i = 0; i < quantity; i++) {
      // Determine rarity first
      const rolledRarity = rollRarity();
      // The itemLevel is now simply the droppedByEnemyLevel (capped by MAX_LEVEL_DIFFERENCE)
      // The rarityBoost will be applied to stats, not the item's inherent level.
      const itemActualLevel = Math.min(droppedByEnemyLevel, droppedByEnemyLevel + ENEMY_LEVEL_RANGE);

      // NEW: Select a random affix for the item type
      const availableAffixes = Object.keys(statAffixes).filter(affixName =>
          statAffixes[affixName].types.includes(itemData.type)
      );
      const randomAffixName = availableAffixes[Math.floor(Math.random() * availableAffixes.length)];
      const selectedAffix = statAffixes[randomAffixName];

      // Create a unique instance of the item
      const newItemInstance = {
        id: crypto.randomUUID(), // Unique ID for this specific item instance
        name: itemData.name,
        type: itemData.type,
        itemLevel: itemActualLevel, // Item level is just the monster's level (capped)
        rarity: rolledRarity, // Store the dynamically rolled rarity
        baseStatValue: itemData.baseStatValue, // Store the baseStatValue from the item definition
        affix: { // Store the selected affix's properties
            name: randomAffixName,
            weights: selectedAffix // Store the actual weights object
        },
        sellPrice: itemActualLevel * 1 // Basic sell price: 1 gold per item level
      };
      inventory.push(newItemInstance); // Add to inventory array
      logMessage(`You found a Lvl ${newItemInstance.itemLevel} ${rolledRarity} ${itemData.name} ${newItemInstance.affix.name}!`); // Log for each individual item
    }
    updateInventoryUI(); // Update UI after adding item
  }
}
/**
 * Displays scrolling combat text near the specified HP bar.
 * @param {number|string} value - The amount of damage dealt/taken or "Miss!" string.
 * @param {boolean} isCritical - True if it was a critical hit (only applies to player attacks).
 * @param {HTMLElement} targetHpBarEl - The HP bar element to position the combat text near (e.g., playerHpBarFillEl or enemyHpBarFillEl).
 * @param {boolean} isDamageTaken - True if this text represents damage taken (for color/sign).
 * @param {boolean} isMiss - True if this text represents a miss (for color/style).
 */
function showCombatText(value, isCritical, targetHpBarEl, isDamageTaken = false, isMiss = false) {
  const combatTextEl = document.createElement('div');
  combatTextEl.classList.add('combat-text');
  if (isCritical) {
    combatTextEl.classList.add('critical');
  }
  if (isDamageTaken) {
    combatTextEl.classList.add('damage-taken');
    combatTextEl.textContent = `-${value.toFixed(0)}`; // Damage taken
  } else if (isMiss) { // NEW: Handle miss
    combatTextEl.classList.add('miss');
    combatTextEl.textContent = value; // Value will be "Miss!" string
  } else {
    combatTextEl.textContent = `-${value.toFixed(0)}`; // Damage dealt
  }
  // Calculate position relative to the game container
  const targetRect = targetHpBarEl.getBoundingClientRect();
  const gameContainerRect = gameContainerEl.getBoundingClientRect();
  // Position the text above the center of the target HP bar
  // `left` relative to game container: center of targetRect - gameContainerRect.left
  // `top` relative to game container: top of targetRect - gameContainerRect.top
  combatTextEl.style.left = `${targetRect.left + targetRect.width / 2 - gameContainerRect.left}px`;
  combatTextEl.style.top = `${targetRect.top - gameContainerRect.top}px`;
  combatTextOverlayEl.appendChild(combatTextEl); // Append to the global overlay
  // Remove the element after the animation completes
  combatTextEl.addEventListener('animationend', () => {
    combatTextEl.remove();
  });
}
/**
 * Updates the display of player and enemy statistics on the UI.
 */
function updateUI() {
  // Update Player Name and Level
  // Only update the input value if it's not currently focused
  if (!isPlayerNameInputFocused) {
      playerNameInputEl.value = player.name;
  }
  playerLevelDisplayEl.textContent = `Lvl.${player.level}`;
  // Update Enemy Name and Level
  enemyNameDisplayEl.textContent = enemy.name;
  enemyLevelDisplayEl.textContent = `Lvl.${enemy.level}`;


  mainCurrentZoneDisplayEl.textContent = currentZone.name; // Display current zone in the main header
  // Update Player HP bar
  const playerHpPercentage = (player.hp / player.maxHp) * 100;
  playerHpBarFillEl.style.width = `${playerHpPercentage}%`;
  // Update player HP text overlay based on resting state
  if (isResting) {
    // Always show the timer when resting, even if it's 0.0s, until resting officially ends.
    playerHpTextOverlayEl.textContent = `RESTING - ${player.hp.toFixed(1)}/${player.maxHp.toFixed(1)} HP`;
    playerHpTextOverlayEl.classList.add('resting-text');
    playerHpTextOverlayEl.classList.add('visible');
  } else {
    playerHpTextOverlayEl.textContent = `${player.hp.toFixed(1)}/${player.maxHp.toFixed(1)} HP`;
    playerHpTextOverlayEl.classList.remove('resting-text'); // Remove resting style
    // Ensure it's visible always
    playerHpTextOverlayEl.classList.add('visible');
  }
  // Update Enemy HP bar
  const enemyHpPercentage = (enemy.hp / enemy.maxHp) * 100;
  // This block is now handled directly in nextEnemy() for immediate reset
  // Temporarily disable transition for immediate update
  // enemyHpBarFillEl.style.transition = 'none';
  // enemyHpFillEl.style.width = `${enemyHpPercentage}%`;
  // Force reflow to apply the width change immediately
  // void enemyHpBarFillEl.offsetWidth;
  // Re-enable transition for future smooth updates
  // enemyHpBarFillEl.style.transition = 'width 0.3s ease-out';
  enemyHpBarFillEl.style.width = `${enemyHpPercentage}%`; // Still update for ongoing damage
  enemyHpTextOverlayEl.textContent = `${enemy.hp.toFixed(1)}/${enemy.maxHp.toFixed(1)} HP`; // Update text content even when hidden
  // Ensure enemy HP text is always visible
  enemyHpTextOverlayEl.classList.add('visible');
  // Update XP bar and text
  // Cap XP at xpToNextLevel for max level to prevent bar from showing over 100%
  const currentXPForDisplay = player.level === MAX_LEVEL ? player.xpToNextLevel : player.xp;
  const xpPercentage = (currentXPForDisplay / player.xpToNextLevel) * 100;
  xpProgressFillEl.style.width = `${Math.min(100, xpPercentage)}%`; // Cap at 100% visually
  xpTextOverlayEl.textContent = `${player.xp}/${player.xpToNextLevel} XP`;
  // If at max level, show "MAX LEVEL"
  if (player.level === MAX_LEVEL) {
    xpTextOverlayEl.textContent = `MAX LEVEL ${MAX_LEVEL}`;
  }
  // Update Player Stats window
  statMaxHealthEl.textContent = player.maxHp.toFixed(1);

  // Calculate and display health regen in raw value and percentage
  const currentRegenPerSecond = player.healthRegen;
  const regenPercentageOfMaxHp = (player.healthRegen / player.maxHp) * 100;
  statHealthRegenEl.textContent = `${currentRegenPerSecond.toFixed(2)} (${regenPercentageOfMaxHp.toFixed(1)}%)`;

  statDamageEl.textContent = player.attack;
  // Calculate damage reduction percentage for armor display
  const K = 100; // Same K value as used in enemyAttack
  let damageReductionPercentage = 0;
  if (player.defense + K > 0) {
    // Avoid division by zero
    damageReductionPercentage = (player.defense / (player.defense + K)) * 100;
  }
  statArmorEl.textContent = `${player.defense.toFixed(1)} (${damageReductionPercentage.toFixed(1)}%)`; // Display armor with percentage, fixed to 1 decimal
  statCriticalChanceEl.textContent = `${player.criticalChance.toFixed(1)}%`; // Display with one decimal and %
  statHasteEl.textContent = `${player.haste.toFixed(1)}%`; // NEW: Display Haste with one decimal and %
  // NEW: Update zone button states (both side panel and main navigation)
  updateZoneButtons();
  // NEW: Update enemy attack power display
  enemyAttackPowerDisplayEl.textContent = `AP: ${enemy.attack}`;
  // Update Talent Points Display
  talentPointsDisplayEl.textContent = `Unspent Talent Points: ${unspentTalentPoints}`;
  
  // Update talent button states
  updateTalentButtonStates();
}

function updateTalentButtonStates() {
  const talentButtons = {
    attackSpeed: attackSpeedTalentBtn,
    criticalStrike: criticalStrikeTalentBtn,
    healthRegen: healthRegenTalentBtn,
    scalingArmor: scalingArmorTalentBtn
  };

  // Get Swift Strikes talent status
  const swiftStrikesMaxed = talents.attackSpeed.currentRank >= talents.attackSpeed.maxRank;

  // Update each talent button
  for (const [talentKey, button] of Object.entries(talentButtons)) {
    const talent = talents[talentKey];
    
    // Check if any of the three dependent talents have points invested
    const hasInvestedPoints = Object.entries(talents).some(([key, t]) => 
      key !== 'attackSpeed' && t.currentRank > 0
    );
    
    // For talents other than Swift Strikes, check multiple conditions
    const requiresSwiftStrikes = talentKey !== 'attackSpeed' && !swiftStrikesMaxed;
    // If we've invested in a dependent talent, only allow further investment in that talent
    const lockedToOtherTalent = hasInvestedPoints && talentKey !== 'attackSpeed' && 
      talent.currentRank === 0;
    
    button.disabled = unspentTalentPoints === 0 || 
      talent.currentRank >= talent.maxRank || 
      requiresSwiftStrikes || 
      lockedToOtherTalent;
    
    button.querySelector('.rank-display').textContent = `${talent.currentRank}/${talent.maxRank}`;
    
    // Update tooltip ranks information
    const tooltipRanks = button.querySelector('.talent-tooltip-ranks');
    if (talent.currentRank >= talent.maxRank) {
      let maxBonusText = '';
      switch(talentKey) {
        case 'attackSpeed':
          maxBonusText = `${talent.bonusPerRank * talent.maxRank}% attack speed`;
          break;
        case 'criticalStrike':
          maxBonusText = `${talent.bonusPerRank * talent.maxRank}% critical strike chance`;
          break;
        case 'healthRegen':
          maxBonusText = `${talent.bonusPerRank * talent.maxRank} health regen`;
          break;
        case 'scalingArmor':
          const maxArmorBonus = talent.bonusPerRank * talent.maxRank * (1 + player.level * 0.1);
          maxBonusText = `${maxArmorBonus.toFixed(0)} armor at current level`;
          break;
      }
      tooltipRanks.textContent = `Maximum rank achieved: ${maxBonusText}`;
    } else {
      const currentBonus = talent.currentRank * talent.bonusPerRank;
      const nextBonus = (talent.currentRank + 1) * talent.bonusPerRank;
      let bonusText = '';
      switch(talentKey) {
        case 'attackSpeed':
          bonusText = `Current: +${currentBonus}%\nNext Rank: +${nextBonus}%`;
          break;
        case 'criticalStrike':
          bonusText = `Current: +${currentBonus}%\nNext Rank: +${nextBonus}%`;
          break;
        case 'healthRegen':
          bonusText = `Current: +${currentBonus}\nNext Rank: +${nextBonus}`;
          break;
        case 'scalingArmor':
          const currentArmorBonus = currentBonus * (1 + player.level * 0.1);
          const nextArmorBonus = nextBonus * (1 + player.level * 0.1);
          bonusText = `Current: +${currentArmorBonus.toFixed(0)}\nNext Rank: +${nextArmorBonus.toFixed(0)}`;
          break;
      }
      tooltipRanks.innerHTML = bonusText.replace(/\n/g, '<br>');
    }
  }
}

// Talent click handlers
function onTalentClick(talentKey) {
  const talent = talents[talentKey];
  if (unspentTalentPoints > 0 && talent.currentRank < talent.maxRank) {
    talent.currentRank++;
    unspentTalentPoints--;
    
    // Apply the bonus based on talent type
    const totalBonus = talent.currentRank * talent.bonusPerRank;
    switch(talentKey) {
      case 'attackSpeed':
        player.haste = player.baseHaste + totalBonus;
        break;
      case 'criticalStrike':
        player.criticalChance = player.baseCriticalChance + totalBonus;
        break;
      case 'healthRegen':
        player.healthRegen = player.baseHealthRegen + totalBonus;
        break;
      case 'scalingArmor':
        // Scale armor bonus with level (10% increase per level)
        const scaledArmorBonus = totalBonus * (1 + player.level * 0.1);
        player.defense = player.baseDefense + scaledArmorBonus;
        break;
    }
    
    // Update UI
    updateUI();
    logMessage(`Invested a point in ${talent.name}! (${talent.currentRank}/${talent.maxRank})`);
  }
}

// Add event listeners for all talent buttons
attackSpeedTalentBtn.addEventListener('click', () => onTalentClick('attackSpeed'));
criticalStrikeTalentBtn.addEventListener('click', () => onTalentClick('criticalStrike'));
healthRegenTalentBtn.addEventListener('click', () => onTalentClick('healthRegen'));
scalingArmorTalentBtn.addEventListener('click', () => onTalentClick('scalingArmor'));
/**
 * Adds a new message to the battle log.
 * @param {string} message - The message to add to the log.
 */
function logMessage(message) {
  const logEntry = document.createElement('div');
  logEntry.classList.add('log-entry');
  logEntry.textContent = `${message}`;
  logAreaEl.appendChild(logEntry);
  // Keep log area from getting too long (max 20 entries)
  if (logAreaEl.children.length > 20) {
    logAreaEl.removeChild(logAreaEl.firstChild);
  }
  // Scroll to the bottom to show the latest message
  logAreaEl.scrollTop = logAreaEl.scrollHeight;
}
/**
 * Calculates the XP needed for the next level.
 * This formula makes leveling progressively harder.
 * @param {number} level - The current player level.
 * @returns {number} The XP required for the next level.
 */
function calculateXpToNextLevel(level) {
  // Using a power function for exponential growth in XP requirement
  // Math.pow(level, 1.5) provides a good curve where higher levels take significantly more XP
  return Math.floor(100 * Math.pow(level, 1.5));
}
/**
 * Handles player leveling up.
 */
function levelUp() {
  // Only allow leveling up if not at max level
  if (player.level < MAX_LEVEL) {
    player.level++;
    // Recalculate baseAttack based on the new scaling formula
    player.baseAttack = Math.floor(10 + Math.pow(player.level, 1.1)); // Changed 5 to 10 for base scaling
    player.baseMaxHp += 5; // Reduced from 20
    player.baseDefense += 1; // Reduced from 2
    player.baseHealthRegen += 0.05; // Reduced from 0.1
    // player.baseCriticalChance += 0.2; // REMOVED: Critical Chance will now scale primarily from items/talents
    // Subtract XP needed for the just completed level
    player.xp -= player.xpToNextLevel;
    // If the player is now at max level, cap their XP at the max level's requirement
    if (player.level === MAX_LEVEL) {
      player.xpToNextLevel = calculateXpToNextLevel(MAX_LEVEL); // Set final XP goal
      player.xp = player.xpToNextLevel; // Cap XP at max level
    } else {
      // Calculate XP for the new next level
      player.xpToNextLevel = calculateXpToNextLevel(player.level);
    }
    // Award talent points starting at level 10 and then every 2 levels
    if (player.level >= 10 && (player.level - 10) % 2 === 0) {
      talentPoints++;
      unspentTalentPoints++;
      logMessage(`You gained a talent point! (${unspentTalentPoints} unspent)`);
    }
  }
  updatePlayerStats(); // Recalculate total attack and defense after level up
  player.hp = player.maxHp; // Heal to full HP after maxHp is recalculated
  logMessage(`You leveled up to Level ${player.level} and regained all missing health points!`); // New log message
  updateUI(); // Ensure UI is updated after level up
}
/**
 * Applies health regeneration to the player.
 */
function applyHealthRegen() {
  if (isGameOver || isGhostForm) return; // Do not regen in game over or ghost form

  if (player.hp < player.maxHp) {
    let effectiveHealthRegen = player.healthRegen;

    if (isResting) {
      effectiveHealthRegen *= 15; // Apply 15x bonus when resting (no cap when resting)
    } else {
      // Apply cap only when not resting
      const maxRegenAmount = player.maxHp * HEALTH_REGEN_CAP_PERCENTAGE;
      effectiveHealthRegen = Math.min(effectiveHealthRegen, maxRegenAmount);
    }

    player.hp = Math.min(player.maxHp, player.hp + effectiveHealthRegen);
    updateUI(); // Update UI to reflect HP changes during rest
  }
}
/**
 * Updates the Ghost Form timer and progress bar.
 */
function updateGhostForm() {
  ghostFormTimer -= GHOST_FORM_UPDATE_INTERVAL_MS / 1000; // Decrement by update interval in seconds
  // Update timer text
  ghostFormTimerTextEl.textContent = `${Math.ceil(ghostFormTimer)}s`;
  // Update progress bar
  const progressPercentage = (ghostFormTimer / (GHOST_FORM_DURATION_MS / 1000)) * 100;
  ghostFormProgressFillEl.style.width = `${progressPercentage}%`;
  if (ghostFormTimer <= 0) {
    clearInterval(ghostFormInterval);
    isGhostForm = false; // Exit ghost form
    ghostFormOverlayEl.classList.add('hidden'); // Hide ghost form overlay
    player.hp = player.maxHp; // Heal player to full HP
    logMessage('You have returned from Ghost Form with full HP!');
    // NEW: Logic to move to previous zone if not in the first zone
    const currentIndex = levelZones.findIndex(zone => zone.name === currentZone.name);
    if (currentIndex > 0) {
      const newZone = levelZones[currentIndex - 1];
      currentZone = newZone;
      logMessage(`You were defeated! Moving back to ${currentZone.name}.`);
    } else {
      logMessage(`You were defeated, but you're already in the first zone (${currentZone.name}).`);
    }
    updateUI(); // Update UI to reflect full HP and potentially new zone
    // Restart player and enemy attack intervals with current game speed
    applyGameSpeed();
    // Spawn a new enemy in the (potentially new) current zone
    nextEnemy();
  }
}
/**
 * Initiates the resting state.
 * This function can be called by auto-rest or the new manual "Force Rest" button.
 */
function startResting() {
  // Prevent resting if already resting, in ghost form, or game over
  if (isResting || isGhostForm || isGameOver) {
    if (isResting) logMessage('You are already resting.');
    else if (isGhostForm) logMessage('Cannot rest while in Ghost Form.');
    else if (isGameOver) logMessage('Cannot rest, game is over.');
    return;
  }
  // New: Prevent resting if HP is at or above 85%
  if (player.hp / player.maxHp >= REST_ENTRY_HP_THRESHOLD) {
    logMessage(`You are already at ${Math.round((player.hp / player.maxHp) * 100)}% HP. No need to rest. Rest at or below 85%.`);
    return;
  }
  // If there's an active enemy, make it run away
  if (enemy.hp > 0) {
    logMessage(`${enemy.name} runs away!`);
    enemy.hp = 0; // Ensure enemy is considered defeated for nextEnemy() logic
    updateUI(); // Update UI to show enemy HP as 0
  }
  isResting = true;
  logMessage('You begin resting to recover HP.');
  clearInterval(playerGameInterval); // Stop player attacks
  clearInterval(enemyGameInterval); // Stop enemy attacks
  playerHpTextOverlayEl.classList.add('resting-text'); // Apply resting style
  updateUI(); // Update UI immediately to show "RESTING" text
}
/**
 * Handles a full game over state (triggered by restart button).
 */
function gameOver() {
  isGameOver = true;
  clearInterval(playerGameInterval);
  clearInterval(enemyGameInterval);
  clearInterval(ghostFormInterval); // Ensure ghost form interval is cleared
  clearInterval(healthRegenInterval); // Stop health regen
  ghostFormOverlayEl.classList.add('hidden'); // Hide ghost form overlay
  gameOverOverlayEl.classList.remove('hidden'); // Show game over overlay
  logMessage('GAME OVER! Click Restart Game to try again.');
}
/**
 * Saves the current game state to a JSON file.
 */
function saveGame() {
  // Stop all intervals before saving to capture accurate timestamps
  clearInterval(playerGameInterval);
  clearInterval(enemyGameInterval);
  clearInterval(healthRegenInterval);
  clearInterval(ghostFormInterval); // Clear ghost form interval if active
  // Capture current state, including timestamps for attack progress
  const gameState = {
    player: player,
    enemy: enemy,
    inventory: inventory,
    currentZoneName: currentZone.name, // Save only the name, as levelZones is constant
    gameSpeedMultiplier: gameSpeedMultiplier,
    isGameOver: isGameOver,
    isGhostForm: isGhostForm,
    isResting: isResting,
    autoRestEnabled: autoRestEnabled,
    inventorySortOrder: inventorySortOrder,
    ghostFormTimer: ghostFormTimer,
    playerAttackStartTime: playerAttackStartTime,
    enemyAttackStartTime: enemyAttackStartTime,
    talentPoints: talentPoints,
    unspentTalentPoints: unspentTalentPoints,
    talents: talents,
  };
  const jsonString = JSON.stringify(gameState, null, 2); // Pretty print JSON
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'idle_game_save.json'; // Use .json extension for clarity
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url); // Clean up the URL object
  logMessage('Game saved successfully!');
  // Restart intervals after saving
  applyGameSpeed();
  if (isGhostForm) { // If was in ghost form, restart its interval
      ghostFormInterval = setInterval(updateGhostForm, GHOST_FORM_UPDATE_INTERVAL_MS);
  }
}
/**
 * Loads game state from a selected JSON file.
 */
function loadGame(event) {
  const file = event.target.files[0];
  if (!file) {
    logMessage('No file selected for loading.');
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const loadedState = JSON.parse(e.target.result);
      // Apply loaded state to game variables
      player = loadedState.player;
      enemy = loadedState.enemy;
      inventory = loadedState.inventory;
      // Find the current zone object from the constant array
      currentZone = levelZones.find(zone => zone.name === loadedState.currentZoneName) || levelZones[0];
      gameSpeedMultiplier = loadedState.gameSpeedMultiplier;
      isGameOver = loadedState.isGameOver;
      isGhostForm = loadedState.isGhostForm;
      isResting = loadedState.isResting;
      autoRestEnabled = loadedState.autoRestEnabled;
      inventorySortOrder = loadedState.inventorySortOrder;
      ghostFormTimer = loadedState.ghostFormTimer || 0; // Add fallback for older saves
      playerAttackStartTime = loadedState.playerAttackStartTime || Date.now(); // Add fallback
      enemyAttackStartTime = loadedState.enemyAttackStartTime || Date.now(); // Add fallback
      // Load talent data with fallbacks for older saves
      talentPoints = loadedState.talentPoints || 0;
      unspentTalentPoints = loadedState.unspentTalentPoints || 0;
      if (loadedState.talents) {
        talents = loadedState.talents;
        // Apply talent effects
        const totalHasteBonus = talents.attackSpeed.currentRank * talents.attackSpeed.bonusPerRank;
        player.haste = player.baseHaste + totalHasteBonus;
      }
      // Re-initialize game intervals and update UI
      clearInterval(playerGameInterval);
      clearInterval(enemyGameInterval);
      clearInterval(healthRegenInterval);
      clearInterval(ghostFormInterval); // Clear any old ghost form interval
      applyGameSpeed(); // Restart main game intervals
      if (isGhostForm) { // If loading into ghost form, restart its interval
          ghostFormOverlayEl.classList.remove('hidden');
          ghostFormInterval = setInterval(updateGhostForm, GHOST_FORM_UPDATE_INTERVAL_MS);
      } else {
          ghostFormOverlayEl.classList.add('hidden');
      }
      // Update UI elements based on loaded state
      updateUI();
      updateGoldUI();
      updateInventoryUI();
      updateEquippedItemsUI();
      updatePlayerStats(); // Recalculate stats based on loaded equipped items
      // Update UI controls that reflect state
      autoRestCheckbox.checked = autoRestEnabled;
      // Update game speed radio buttons
      gameSpeedRadios.forEach(radio => {
          radio.checked = (parseInt(radio.value, 10) === gameSpeedMultiplier);
      });
      // Ensure enemy HP bar is visually correct after load
      enemyHpBarFillEl.style.transition = 'none';
      enemyHpBarFillEl.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
      void enemyHpBarFillEl.offsetWidth;
      enemyHpBarFillEl.style.transition = 'width 0.3s ease-out';

      logMessage('Game loaded successfully!');
      // Hide game over overlay if it was active and game is no longer over
      if (!isGameOver) {
          gameOverOverlayEl.classList.add('hidden');
      }
    } catch (e) {
      logMessage('Error loading game: Invalid save file or corrupted data.');
      console.error('Error parsing save file:', e);
    }
  };
  reader.onerror = function () {
    logMessage('Error reading file.');
  };
  reader.readAsText(file);
}
/**
 * Resets the game to its initial state and starts all game intervals.
 * This function now serves as the primary game initialization point.
 */
function resetGame() {
  // Clear all existing intervals to prevent multiple loops running
  clearInterval(playerGameInterval);
  clearInterval(enemyGameInterval);
  clearInterval(ghostFormInterval);
  clearInterval(healthRegenInterval);
  // Reset progress bars immediately
  playerAttackProgressFillEl.style.width = '0%';
  enemyAttackProgressFillEl.style.width = '0%';
  xpProgressFillEl.style.width = '0%';
  ghostFormProgressFillEl.style.width = '0%';
  // Reset player object to its initial state
  player = {
    name: 'Edd',
    level: 1,
    baseAttack: 0, // Will be calculated below
    attack: 0,
    baseDefense: 0,
    defense: 0,
    baseMaxHp: 200, // CHANGED from 100 to 150
    maxHp: 200, // CHANGED from 100 to 150
    baseHealthRegen: 1.0, // CHANGED from 0.5 to 1.0
    healthRegen: 1.0, // CHANGED from 0.5 to 1.0
    baseCriticalChance: 0, // Changed from 5 to 0. Critical chance will now primarily come from items/talents.
    criticalChance: 0, // Current critical chance
    baseHaste: 0, // NEW: Base Haste
    haste: 0,     // NEW: Current Haste
    hp: 200, // CHANGED from 100 to 150
    xp: 0,
    xpToNextLevel: calculateXpToNextLevel(1), // Recalculate initial XP to next level
    gold: 0, // Reset gold
    equippedWeapon: null, // Reset equipped weapon
    equippedOffHand: null, // Reset equipped off-hand weapon
    equippedHead: null,
    equippedShoulders: null,
    equippedChest: null,
    equippedLegs: null,
    equippedFeet: null // Reset feet slot
  };
  // Calculate initial baseAttack based on the new scaling formula for level 1
  player.baseAttack = Math.floor(10 + Math.pow(player.level, 1.1)); // Changed 5 to 10 for base scaling
  // Reset game flags and timers
  isGameOver = false;
  isGhostForm = false; // Reset ghost form flag
  isResting = false; // Reset resting flag
  ghostFormTimer = 0; // Reset ghost form timer
  playerAttackStartTime = Date.now(); // Reset attack bar start times
  enemyAttackStartTime = Date.now();
  // Hide any overlays that might be active
  gameOverOverlayEl.classList.add('hidden'); // Hide game over screen
  ghostFormOverlayEl.classList.add('hidden'); // Hide ghost form screen
  settingsOverlay.classList.add('hidden'); // Hide settings overlay if open
  helpOverlay.classList.remove('active'); // Hide help overlay
  document.body.classList.remove('help-active'); // Ensure main game area is reset
  hideConfirmationModal(); // Hide confirmation modal on reset
  // Clear game log and inventory
  logAreaEl.innerHTML = ''; // Clear log
  inventory = []; // Clear inventory ARRAY
  // Reset talents
  talentPoints = 0;
  unspentTalentPoints = 0;
  talents.attackSpeed.currentRank = 0;
  player.haste = player.baseHaste; // Reset haste to base value
  // Set autoRestEnabled to true by default and update the checkbox
  autoRestEnabled = true;
  if (autoRestCheckbox) {
    autoRestCheckbox.checked = true;
  }
  // Set initial zone to Ashfen
  currentZone = levelZones[0];
  // Initialize enemy stats based on current zone and player level
  nextEnemy(); // Call nextEnemy to set up the first enemy based on zone/player level
  // Update all UI elements to reflect the reset state
  updateInventoryUI(); // Update inventory display
  updateGoldUI(); // Update gold display
  updatePlayerStats(); // Ensure player attack and defense are correct after reset
  updateEquippedItemsUI(); // Update equipped items display
  updateUI(); // This will also update zone buttons
  // Start all game intervals with the current game speed (default x1)
  applyGameSpeed();
  logMessage('Game reset. Adventure started!'); // Log a message after reset
}
/**
 * Applies the current game speed multiplier to all relevant intervals.
 * This function should be called when the game speed changes or on game reset.
 */
function applyGameSpeed() {
  // Clear existing intervals to prevent multiple loops running
  clearInterval(playerGameInterval);
  clearInterval(enemyGameInterval);
  clearInterval(healthRegenInterval); // Clear health regen interval too
  // Calculate new intervals based on multiplier and Haste
  // Haste reduces the interval, so a higher haste means a smaller interval
  // 100% haste should be 2x attack speed, meaning interval / 2
  // So, interval / (1 + haste/100)
  // Calculate haste factor, including talent bonuses
  const hasteFactor = 1 + (player.haste / 100); // If haste is 100, factor is 2. If 0, factor is 1.
  const currentPlayerAttackInterval = BASE_PLAYER_ATTACK_INTERVAL_MS / gameSpeedMultiplier / hasteFactor;
  const currentEnemyAttackInterval = BASE_ENEMY_ATTACK_INTERVAL_MS / gameSpeedMultiplier;
  const currentHealthRegenInterval = BASE_HEALTH_REGEN_INTERVAL_MS / gameSpeedMultiplier;
  // Restart intervals with new speeds
  playerGameInterval = setInterval(playerAttack, currentPlayerAttackInterval);
  playerAttackStartTime = Date.now(); // Reset start time for player attack
  enemyGameInterval = setInterval(enemyAttack, currentEnemyAttackInterval);
  enemyAttackStartTime = Date.now(); // Reset start time for enemy attack
  healthRegenInterval = setInterval(applyHealthRegen, currentHealthRegenInterval); // Restart health regen
  //logMessage(`Game speed set to x${gameSpeedMultiplier}.`);
}
/**
 * Calculates the player's miss chance based on the level difference with the enemy.
 * @param {number} playerLevel - The player's current level.
 * @param {number} enemyLevel - The enemy's current level.
 * @returns {number} The calculated miss chance percentage.
 */
function calculatePlayerMissChance(playerLevel, enemyLevel) {
    const levelDifference = enemyLevel - playerLevel;
    if (levelDifference <= 0) {
        return BASE_PLAYER_MISS_CHANCE; // 1% miss chance for same level or lower
    } else if (levelDifference >= 10) {
        return 90; // 90% miss chance for 10+ levels above
    } else {
        // Exponential increase for level differences 1 to 9 (quadratic curve)
        // Formula: BASE_PLAYER_MISS_CHANCE + C * (levelDifference)^E
        // With BASE_PLAYER_MISS_CHANCE = 1, target 90 at diff 10.
        // If E=2, then C * 10^2 = 90 - 1 = 89 => C = 0.89
        const C = 0.5; // Adjusted C value for a flatter initial curve
        const E = 2; // Exponent for quadratic growth
        const additionalMissChance = C * Math.pow(levelDifference, E);
        return BASE_PLAYER_MISS_CHANCE + additionalMissChance;
    }
}
/**
 * Advances to the next enemy, increasing its difficulty slightly.
 * @param {boolean} [immediate=false] - If true, spawns enemy immediately without delay
 */
function nextEnemy(immediate = false) {
  if (!immediate && isEnemySpawnPending) return; // Prevent multiple pending spawns
  
  if (!immediate) {
    isEnemySpawnPending = true;
    setTimeout(() => {
      spawnNewEnemy();
      isEnemySpawnPending = false;
    }, ENEMY_SPAWN_DELAY_MS / gameSpeedMultiplier);
    return;
  }
  
  spawnNewEnemy();
}

/**
 * Helper function to handle the actual enemy spawn logic
 */
function spawnNewEnemy() {
  // Get enemy names for the current zone
  const enemyNamesForZone = currentZone.enemyNames;
  const newEnemyName = enemyNamesForZone[Math.floor(Math.random() * enemyNamesForZone.length)];
  let monsterLevel;
  if (player.level < currentZone.minLevel) {
    // Player is too low for the zone, enemies start at zone's minLevel
    monsterLevel = currentZone.minLevel;
    logMessage(`WARNING: You are under-leveled for ${currentZone.name}. Enemies here are Level ${monsterLevel}+!`);
  } else if (player.level > currentZone.maxLevel && currentZone.maxLevel !== Infinity) {
    // Player is too high for the zone, enemies are capped at zone's maxLevel
    monsterLevel = currentZone.maxLevel;
  } else {
    // Player level is within the zone range, spawn enemies around player level
    let minEnemyLevel = Math.max(currentZone.minLevel, player.level - ENEMY_LEVEL_RANGE);
    let maxEnemyLevel = Math.min(currentZone.maxLevel, player.level + ENEMY_LEVEL_RANGE);
    // Ensure min level doesn't exceed max level, especially at zone boundaries
    if (minEnemyLevel > maxEnemyLevel) {
      minEnemyLevel = maxEnemyLevel;
    }
    monsterLevel = Math.floor(Math.random() * (maxEnemyLevel - minEnemyLevel + 1)) + minEnemyLevel;
  }
  // Adjust enemy stats based on the chosen monsterLevel
  enemy.name = newEnemyName;
  enemy.level = monsterLevel; // Store enemy level
  // Enemy HP scales with new formula: 50 × (1.12 ^ Level)
  enemy.maxHp = Math.floor(75 * Math.pow(1.12, monsterLevel));
  enemy.hp = enemy.maxHp;
  // Enemy attack scales with monster level (keeping existing linear scaling for attack as no new formula was provided)
  enemy.attack = Math.floor(10 * Math.pow(1.08, monsterLevel)); // CHANGED: Doubled base attack from 5 to 10
  // XP reward scales linearly with monster level
  enemy.xpReward = Math.floor(20 + (monsterLevel - 1) * 2);
  // Ensure XP reward and attack are at least 1
  if (enemy.xpReward < 1) enemy.xpReward = 1;
  if (enemy.attack < 1) enemy.attack = 1;
  //logMessage(`A new enemy appears: ${enemy.name} (Level: ${enemy.level})!`);
  // Explicitly reset enemy health bar visually
  enemyHpBarFillEl.style.transition = 'none'; // Disable transition for instant reset
  enemyHpBarFillEl.style.width = '100%'; // Set width to 100%
  void enemyHpBarFillEl.offsetWidth; // Force reflow
  enemyHpBarFillEl.style.transition = 'width 0.3s ease-out'; // Re-enable transition
  updateUI(); // Ensure UI is updated when a new enemy appears
  console.log(`[nextEnemy] Spawned: ${enemy.name} (Level: ${enemy.level}), HP: ${enemy.hp}/${enemy.maxHp}`);
}
/**
 * Applies a random variance to a base damage value.
 * @param {number} baseDamage - The calculated base damage.
 * @param {number} variancePercentage - The percentage of variance (e.g., 0.20 for 20%).
 * @param {number} [minVarMultiplier=1] - The minimum multiplier for the variance (e.g., 0.8 for -20%, 1 for 0%).
 * @returns {number} The damage value with variance applied.
 */
function applyDamageVariance(baseDamage, variancePercentage, minVarMultiplier = 1) {
  const minMultiplier = minVarMultiplier;
  const maxMultiplier = 1 + variancePercentage;
  const randomMultiplier = Math.random() * (maxMultiplier - minMultiplier) + minMultiplier;
  return Math.floor(baseDamage * randomMultiplier);
}
/**
 * Handles the player attacking the enemy.
 */
function playerAttack() {
  if (isGameOver || isGhostForm || isResting) return; // Do nothing if game is over, in ghost form, or resting
  console.log(`[playerAttack] Before attack: Enemy HP: ${enemy.hp}/${enemy.maxHp}`);

  // NEW: Calculate player miss chance
  const currentMissChance = calculatePlayerMissChance(player.level, enemy.level);
  if (Math.random() * 100 < currentMissChance) {
      showCombatText('Miss!', false, enemyHpBarFillEl, false, true); // Show "Miss!" text
      logMessage(`${player.name} missed ${enemy.name}!`);
      playerAttackStartTime = Date.now(); // Reset player attack start time for next cycle
      return; // Exit function, no damage dealt
  }

  let damage = player.attack;
  let wasCritical = false; // Flag for critical hit
  // Apply damage variance first
  damage = applyDamageVariance(damage, 0.2, 0.8); // 20% variance, min 80% of base for player
  // Apply critical hit chance
  if (Math.random() * 100 < player.criticalChance) {
    damage *= 1.5; // Critical damage increased by 1.5x
    wasCritical = true; // Set flag
  }
  enemy.hp -= damage;
  showCombatText(damage, wasCritical, enemyHpBarFillEl, false); // Show combat text for damage dealt to enemy
  // Update UI after every hit to show enemy HP changes
  updateUI();
  if (enemy.hp <= 0) {
    enemy.hp = 0; // Ensure HP doesn't go negative on display
    //logMessage(`${enemy.name} has been defeated!`);
    // Item drop logic based on loot table
    for (const lootEntry of lootTable) {
      const dropRoll = Math.random() * 100; // Roll a number between 0 and 99.99...
      if (dropRoll < lootEntry.dropChance) {
        const quantity = Math.floor(Math.random() * (lootEntry.maxQuantity - lootEntry.minQuantity + 1)) + lootEntry.minQuantity;
        // Pass enemy.level as the itemLevel for the dropped item
        addItemToInventory(lootEntry.item, quantity, enemy.level);
      }
    }
    // Only gain XP if not at max level
    if (player.level < MAX_LEVEL) {
      player.xp += enemy.xpReward; // Gain XP
      logMessage(`${player.name} gained ${enemy.xpReward} XP!`);
      // Update UI immediately after XP gain to show progress
      updateUI();
      // Check for level up
      if (player.xp >= player.xpToNextLevel) {
        levelUp(); // levelUp also calls updateUI() internally
        console.log(`[playerAttack DEBUG] AFTER levelUp: Player HP: ${player.hp.toFixed(1)} / ${player.maxHp.toFixed(1)}`);
      }
    } else {
      // If at max level, ensure XP doesn't go beyond max level's requirement
      player.xp = player.xpToNextLevel;
      updateUI(); // Update UI even if at max level to reflect capped XP
    }
    // Check for auto-rest condition immediately after enemy defeat
    // If auto-rest is enabled and player HP is low, start resting instead of spawning a new enemy
    console.log(
      `[playerAttack DEBUG] Before Auto-Rest Check: autoRestEnabled=${autoRestEnabled}, player.hp=${player.hp.toFixed(
        1
      )}, player.maxHp=${player.maxHp.toFixed(1)}, Ratio=${(player.hp / player.maxHp).toFixed(
        2
      )}, REST_HP_THRESHOLD=${REST_HP_THRESHOLD}, enemy.hp=${enemy.hp}`
    );
    if (autoRestEnabled && player.hp / player.maxHp <= REST_HP_THRESHOLD) {
      startResting();
    } else {
      nextEnemy(); // Spawn next enemy if auto-rest is not triggered
    }
  }
  playerAttackStartTime = Date.now(); // Reset player attack start time for next cycle
}
/**
 * Handles the enemy attacking the player.
 */
function enemyAttack() {
  if (isGameOver || isGhostForm || isResting) return; // Do nothing if game is over, in ghost form, or resting
  let incomingDamage = enemy.attack;
  // Apply damage variance to enemy attack
  incomingDamage = applyDamageVariance(incomingDamage, 0.2, 1); // 20% variance, min 100% of base for enemy
  const armor = player.defense;
  const K = 100; // Define K as 100 as per your request
  // Calculate effective damage based on the new armor formula
  // Effective_Damage = Incoming_Damage × (1 - (Armor / (Armor + K)))
  let effectiveDamage = incomingDamage * (1 - armor / (armor + K));
  // Ensure damage is not negative
  effectiveDamage = Math.max(0, effectiveDamage);

  // NEW: Apply damage multiplier if player is below zone's minLevel
  if (player.level < currentZone.minLevel) {
      const levelDifference = currentZone.minLevel - player.level;
      // Example: For every level below minLevel, increase damage by 20%
      // At 1 level below, damage * 1.2
      // At 2 levels below, damage * 1.4
      // At 5 levels below, damage * 2.0
      const damageMultiplier = 1 + (levelDifference * 0.2); // 20% increase per level difference
      effectiveDamage *= damageMultiplier;
      logMessage(`You are under-leveled! ${enemy.name} deals ${damageMultiplier.toFixed(1)}x increased damage!`);
  }

  player.hp -= effectiveDamage;
  showCombatText(effectiveDamage, false, playerHpBarFillEl, true); // Show combat text for damage taken by player
  // Ensure player HP doesn't go below 0
  if (player.hp < 0) {
    player.hp = 0;
  }
  //logMessage(`${enemy.name} attacks you for ${effectiveDamage.toFixed(1)} damage! (${player.hp.toFixed(1)}/${player.maxHp.toFixed(1)} HP remaining)`);
  updateUI(); // Update UI to show player HP changes
  if (player.hp <= 0) {
    if (!isGhostForm) {
      // Only enter ghost form if not already in it
      isGhostForm = true;
      logMessage('Edd has been defeated! Entering Ghost Form...');
      clearInterval(playerGameInterval); // Stop player attacks
      clearInterval(enemyGameInterval); // Stop enemy attacks
      clearInterval(healthRegenInterval); // Stop health regen
      ghostFormOverlayEl.classList.add('hidden'); // Ensure game over is hidden
      gameOverOverlayEl.classList.add('hidden'); // Ensure game over is hidden
      ghostFormOverlayEl.classList.remove('hidden'); // Show ghost form overlay
      ghostFormTimer = GHOST_FORM_DURATION_MS / 1000; // Initialize timer
      // Set Ghost Form progress bar to 100% to start depleting
      ghostFormProgressFillEl.style.transitionDuration = '0s'; // No transition for initial set
      ghostFormProgressFillEl.style.width = '100%'; // Start full
      void ghostFormProgressFillEl.offsetWidth; // Force reflow for immediate application
      ghostFormInterval = setInterval(updateGhostForm, GHOST_FORM_UPDATE_INTERVAL_MS); // Start countdown
    }
  }
  enemyAttackStartTime = Date.now(); // Reset enemy attack start time for next cycle
}
/**
 * Main game loop for smooth progress bar and timer updates.
 */
function gameLoop() {
  if (!isGameOver && !isGhostForm) {
    // Only update combat bars if not in special states (excluding resting for now)
    const currentTime = Date.now();
    // Get current intervals based on game speed multiplier
    const currentPlayerAttackInterval = BASE_PLAYER_ATTACK_INTERVAL_MS / gameSpeedMultiplier;
    const currentEnemyAttackInterval = BASE_ENEMY_ATTACK_INTERVAL_MS / gameSpeedMultiplier;
    // Update Player Attack Bar and Timer
    const playerTimeElapsed = currentTime - playerAttackStartTime;
    const playerProgress = (playerTimeElapsed / currentPlayerAttackInterval) * 100;
    playerAttackProgressFillEl.style.width = `${Math.min(100, playerProgress)}%`;
    const playerTimeRemaining = (currentPlayerAttackInterval - playerTimeElapsed) / 1000;
    playerAttackTimerTextEl.textContent = `${Math.max(0, playerTimeRemaining).toFixed(1)}s`;
    // Update Enemy Attack Bar and Timer
    const enemyTimeElapsed = currentTime - enemyAttackStartTime;
    const enemyProgress = (enemyTimeElapsed / currentEnemyAttackInterval) * 100;
    enemyAttackProgressFillEl.style.width = `${Math.min(100, enemyProgress)}%`;
    const enemyTimeRemaining = (currentEnemyAttackInterval - enemyTimeElapsed) / 1000;
    enemyAttackTimerTextEl.textContent = `${Math.max(0, enemyTimeRemaining).toFixed(1)}s`;
    // The auto-rest check in gameLoop is now primarily for when an enemy is NOT present (e.g., after a manual rest or fleeing)
    // The primary auto-rest trigger after enemy defeat is now in playerAttack().
    // This condition here is still valid if player HP drops low outside of combat and an enemy isn't present.
    console.log(
      `[gameLoop DEBUG] Before Auto-Rest Check: autoRestEnabled=${autoRestEnabled}, isResting=${isResting}, player.hp=${player.hp.toFixed(
        1
      )}, player.maxHp=${player.maxHp.toFixed(1)}, Ratio=${(player.hp / player.maxHp).toFixed(
        2
      )}, THRESHOLD=${REST_HP_THRESHOLD}, enemy.hp=${enemy.hp}`
    );
    if (autoRestEnabled && !isResting && player.hp / player.maxHp <= REST_HP_THRESHOLD && enemy.hp <= 0) {
      startResting();
    }
    // New: Check to end resting if player is at full HP AND minimum rest duration has passed
    // The resting state now ends only if both conditions are met.
    if (isResting && player.hp >= player.maxHp) {
      isResting = false; // Exit resting state
      logMessage('You have finished resting and are at full HP!');
      playerHpTextOverlayEl.classList.remove('resting-text');
      updateUI();
      // After resting, spawn a new enemy
      nextEnemy();
      // Restart combat intervals with current game speed
      applyGameSpeed();
    }
  } else {
    // If game is over or in ghost form or resting, ensure combat bars are not animating
    playerAttackProgressFillEl.style.width = '0%';
    enemyAttackProgressFillEl.style.width = '0%';
    playerAttackTimerTextEl.textContent = '';
    enemyAttackTimerTextEl.textContent = '';
  }
  requestAnimationFrame(gameLoop); // Continue the loop
}
/**
 * Shows a custom confirmation modal.
 * @param {string} title - The title of the modal.
 * @param {string} message - The message to display.
 * @param {function} onConfirm - Callback function if 'Confirm' is clicked.
 */
function showConfirmationModal(title, message, onConfirm) {
  // Defensive check: If title or message are empty, prevent showing the modal and log a warning.
  if (!title && !message) {
    console.warn('Attempted to show confirmation modal with empty title and message. This call might be unintentional.');
    console.trace(); // Log the call stack to help identify the source of the call.
    return; // Prevent showing an empty modal.
  }
  confirmationModalTitle.textContent = title;
  confirmationModalMessage.textContent = message;
  currentConfirmationCallback = onConfirm; // Store the callback
  confirmationModalOverlay.classList.remove('hidden');
  confirmationModalOverlay.style.display = 'flex'; // Force show
  console.log('showConfirmationModal: Modal overlay display style:', confirmationModalOverlay.style.display);
  console.log('showConfirmationModal: Modal overlay class list:', confirmationModalOverlay.classList);
}
/**
 * Hides the custom confirmation modal.
 */
function hideConfirmationModal() {
  console.log('hideConfirmationModal called'); // Debugging log
  confirmationModalOverlay.style.display = 'none'; // Force hide
  confirmationModalOverlay.classList.add('hidden'); // Keep class for consistency
  currentConfirmationCallback = null; // Clear the callback
  console.log('hideConfirmationModal: Modal overlay display style:', confirmationModalOverlay.style.display);
  console.log('hideConfirmationModal: Modal overlay class list:', confirmationModalOverlay.classList);
}
/**
 * Handles selling all items in the inventory.
 */
function sellAllItems() {
  if (inventory.length === 0) {
    logMessage('Your inventory is empty. Nothing to sell!');
    return;
  }
  let totalGoldValue = 0;
  inventory.forEach(item => {
    totalGoldValue += item.sellPrice || 0; // Sum up sell prices
  });
  showConfirmationModal(
    'Sell All Items?',
    `Are you sure you want to sell all ${inventory.length} items for a total of ${totalGoldValue} Gold?`,
    sellAllItemsConfirmed

  );
}
/**
 * Confirms selling all items and performs the action.
 */
function sellAllItemsConfirmed() {
  let totalGoldGained = 0;
  let itemsSoldCount = 0;
  // Iterate through a copy of the inventory to safely remove items
  // We need to create a temporary array of IDs of equipped items that are also in inventory
  const equippedItemIdsInInventory = [];
  for (const slot in player) {
    if (slot.startsWith('equipped') && player[slot]) {
      const equippedItem = player[slot];
      if (inventory.some(item => item.id === equippedItem.id)) {
        equippedItemIdsInInventory.push(equippedItem.id);
      }
    }
  }
  // Unequip items that are about to be sold
  equippedItemIdsInInventory.forEach(itemId => {
    for (const slot in player) {
      if (slot.startsWith('equipped') && player[slot] && player[slot].id === itemId) {
        player[slot] = null; // Unequip the item
        break;
      }
    }
  });
  inventory.forEach(item => {
    totalGoldGained += item.sellPrice || 0;
    itemsSoldCount++;
  });
  inventory = []; // Clear the inventory
  player.gold += totalGoldGained; // Add gold to player
  logMessage(`You sold ${itemsSoldCount} items and ${totalGoldGained} Gold!`);
  updateGoldUI();
  updateInventoryUI();
  updateEquippedItemsUI(); // Update equipped UI in case items were unequipped
  hideConfirmationModal(); // Hide the modal after action
  updatePlayerStats(); // Recalculate stats after potential unequip
}
/**
 * Sells a single item from the inventory.
 * @param {string} itemInstanceId - The unique ID of the item instance to sell.
 */
function sellIndividualItem(itemInstanceId) {
  const itemIndex = inventory.findIndex(item => item.id === itemInstanceId);
  if (itemIndex !== -1) {
    const itemToSell = inventory[itemIndex];
    // Check if the item is equipped and unequip it if necessary
    let wasEquipped = false;
    for (const slot in player) {
      if (slot.startsWith('equipped') && player[slot] && player[slot].id === itemToSell.id) {
        player[slot] = null; // Unequip the item
        wasEquipped = true;
        break;
      }
    }
    inventory.splice(itemIndex, 1); // Remove item from inventory
    player.gold += itemToSell.sellPrice || 0; // Add gold
    logMessage(`You sold a Lvl ${itemToSell.itemLevel} ${itemToSell.rarity} ${itemToSell.name} for ${itemToSell.sellPrice} Gold.`);
    updateGoldUI();
    updateInventoryUI();
    if (wasEquipped) {
      updateEquippedItemsUI(); // Update equipped UI if an item was unequipped
      updatePlayerStats(); // Recalculate stats after unequip
    }
  } else {
    logMessage('Item not found in inventory.');
  }
}
/**
 * Navigates to the previous zone if available and updates UI.
 */
function goToPreviousZone() {
  const currentIndex = levelZones.findIndex(zone => zone.name === currentZone.name);
  if (currentIndex > 0) {
    const newZone = levelZones[currentIndex - 1];
    currentZone = newZone;
    logMessage(`You returned to ${currentZone.name}.`);
    nextEnemy();
    updateUI();
  } else {
    logMessage('You are already in the first zone.');
  }
}
/**
 * Navigates to the next zone if available and unlocked, then updates UI.
 */
function goToNextZone() {
  const currentIndex = levelZones.findIndex(zone => zone.name === currentZone.name);
  if (currentIndex < levelZones.length - 1) {
    const newZone = levelZones[currentIndex + 1];
    // Allow entry regardless of level, but log a warning if under-leveled
    if (player.level < newZone.minLevel) {
      logMessage(
        `WARNING: You are entering ${newZone.name}, which is recommended for Level ${newZone.minLevel}+. Proceed with caution!`
      );
    }
    currentZone = newZone;
    logMessage(`You entered ${currentZone.name}.`);
    nextEnemy();
    updateUI();
  } else {
    logMessage('You are already in the last zone.');
  }
}
/**
 * Renders and updates the state of all zone selection buttons (side panel and main navigation).
 */
function updateZoneButtons() {
  const currentIndex = levelZones.findIndex(zone => zone.name === currentZone.name);
  // Previous button
  if (prevZoneBtn) {
    prevZoneBtn.disabled = currentIndex === 0;
    prevZoneBtn.title = currentIndex === 0 ? 'Already in the first zone' : `Go to ${levelZones[currentIndex - 1].name}`;
  }
  // Next button
  if (nextZoneBtn) {
    nextZoneBtn.disabled = currentIndex === levelZones.length - 1; // Only disable if it's the very last zone
    if (nextZoneBtn.disabled) {
      nextZoneBtn.title = 'Already in the last zone';
    } else {
      const nextZone = levelZones[currentIndex + 1];
      // Always show the "You need to reach a higher level first!" tooltip if under-leveled, even if clickable.
      // This is a warning, not a block.
      if (player.level < nextZone.minLevel) {
        nextZoneBtn.title = `You need to reach Level ${nextZone.minLevel} first!`;
      } else {
        nextZoneBtn.title = `Go to ${nextZone.name}`;
      }
    }
  }
  // Update the main zone display text
  if (mainCurrentZoneDisplayEl) {
    mainCurrentZoneDisplayEl.textContent = currentZone.name;
  }
}
// Initial UI update when the page loads
window.onload = function () {
  // Set initial xpToNextLevel based on level 1
  player.xpToNextLevel = calculateXpToNextLevel(player.level);
  // Manually set initial enemy stats based on player level 1
  nextEnemy(); // Call nextEnemy to set up the first enemy based on zone/player level
  updateUI();
  updateGoldUI(); // Initial gold display update
  updatePlayerStats(); // Calculate initial player attack and defense based on base + equipped (none initially)
  updateInventoryUI(); // Initial inventory display
  updateEquippedItemsUI(); // Initial equipped items display
  updateZoneButtons(); // Initial update of zone buttons
  logMessage("Welcome to Edd's Test Project!"); // Initial message
  restartGameBtn.onclick = resetGame; // Set restart button action to directly call resetGame
  // Event delegation for inventory and equipped items
  inventoryListEl.addEventListener('click', event => {
    const listItem = event.target.closest('.inventory-list-item');
    if (listItem) {
      const itemId = listItem.dataset.itemId; // Get the unique ID
      if (event.shiftKey) {
        sellIndividualItem(itemId); // Sell item if Shift is held
      } else {
        equipItem(itemId); // Otherwise, equip/unequip
      }
    }
  });
  equippedListEl.addEventListener('click', event => {
    const listItem = event.target.closest('.equipped-list-item');
    if (listItem && listItem.dataset.itemId) {
      // Ensure it's an equipped item, not an empty slot message
      const itemId = listItem.dataset.itemId; // Get the unique ID
      equipItem(itemId);
    }
  });
  // Start the continuous game loop for progress bars and timers
  requestAnimationFrame(gameLoop);
  // Call resetGame immediately when the window loads to start the game
  resetGame();
  // Removed previous console.log here, as MutationObserver will provide more detailed info
  // Settings Overlay Logic
  settingsButton.addEventListener('click', () => {
    settingsOverlay.classList.remove('hidden');
  });
  closeSettingsButton.addEventListener('click', () => {
    settingsOverlay.classList.add('hidden');
  });
  // Close overlay if user clicks outside the settings panel
  settingsOverlay.addEventListener('click', event => {
    if (event.target === settingsOverlay) {
      settingsOverlay.classList.add('hidden');
    }
  });
  // Event listener for the new "Reset Game" button in settings
  if (resetGameFromSettingsBtn) {
    resetGameFromSettingsBtn.addEventListener('click', () => {
      resetGame(); // Call the resetGame function
    });
  }
  // NEW: Event listeners for save/load buttons
  if (saveGameBtn) {
      saveGameBtn.addEventListener('click', saveGame);
  }
  // Changed from loadFileInput to loadGameBtn
  if (loadGameBtn) {
      loadGameBtn.addEventListener('click', () => {
          loadFileInput.click(); // Programmatically click the hidden file input
      });
  }
  if (loadFileInput) {
      loadFileInput.addEventListener('change', loadGame);
  }
  // Example: Handling setting changes (e.g., volume control)
  if (volumeControl) {
    volumeControl.addEventListener('input', event => {
      console.log('Volume changed to:', event.target.value);
      // Implement actual volume control here (e.g., for background music, sound effects)
    });
  }
  // Example: Handling setting changes (e.g., dark mode toggle)
  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', event => {
      console.log('Dark Mode enabled:', event.target.checked);
      // Implement actual dark mode toggle here (e.g., change body classes or CSS variables)
      if (event.target.checked) {
        document.body.classList.add('dark-mode-active'); // Add a class to body
        // You'd need to define .dark-mode-active styles in your CSS
        // For example:
        // body.dark-mode-active { background-color: #000; color: #fff; }
      } else {
        document.body.classList.remove('dark-mode-active'); // Remove the class
      }
    });
  }
  // Event listener for Auto-Rest checkbox
  if (autoRestCheckbox) {
    autoRestCheckbox.addEventListener('change', event => {
      autoRestEnabled = event.target.checked;
      if (autoRestEnabled) {
        logMessage('Auto-Rest enabled. You will rest when below 35% HP.');
      } else {
        logMessage('Auto-Rest disabled.');
        // If auto-rest is disabled while resting, stop resting immediately
        if (isResting) {
          isResting = false; // Stop resting
          playerHpTextOverlayEl.classList.remove('resting-text');
          updateUI();
          // Restart combat intervals if they were stopped due to resting
          applyGameSpeed(); // Use applyGameSpeed to restart intervals
        }
      }
    });
  }
  // Event listener for the new "Force Rest" button
  if (forceRestBtn) {
    forceRestBtn.addEventListener('click', () => {
      startResting(); // Call the startResting function
    });
  }
  // Event listener for the new "Sell All" button
  if (sellAllBtn) {
    sellAllBtn.addEventListener('click', sellAllItems);
  }
  // Event listener for the new "Sort by Level" button
  if (sortInventoryBtn) {
    sortInventoryBtn.addEventListener('click', () => {
      // For now, only one sort option (levelDesc). If more are added,
      // this would toggle between them or open a sort menu.
      // For simplicity, just re-render with the current sort order.
      updateInventoryUI();
      logMessage('Inventory sorted by level (descending).');
    });
  }
  // Event listeners for confirmation modal buttons
  confirmButton.addEventListener('click', () => {
    if (currentConfirmationCallback) {
      currentConfirmationCallback(); // Execute the stored callback
    }
  });
  cancelButton.addEventListener('click', hideConfirmationModal);
  // Removed event listeners for level boost radio buttons
  // levelBoostRadios.forEach(radio => {
  //     radio.addEventListener('change', (event) => {
  //         levelRangeBoost = parseInt(event.target.value, 10);
  //         logMessage(`Enemy level range boost set to +${levelRangeBoost}.`);
  //         nextEnemy(); // Immediately spawn a new enemy with the updated level range
  //     });
  // });
  // Help Overlay Logic
  helpButton.addEventListener('click', () => {
    helpOverlay.classList.add('active'); // Show help overlay
    document.body.classList.add('help-active'); // Add class to body to shift game area
  });
  helpCloseButton.addEventListener('click', () => {
    helpOverlay.classList.remove('active'); // Hide help overlay
    document.body.classList.remove('help-active'); // Remove class from body to shift game area back
  });
  // NEW: Event listeners for main zone navigation buttons
  prevZoneBtn.addEventListener('click', goToPreviousZone);
  nextZoneBtn.addEventListener('click', goToNextZone);
  // Event listeners for game speed radios
  gameSpeedRadios.forEach(radio => {
    radio.addEventListener('change', event => {
      gameSpeedMultiplier = parseInt(event.target.value, 10);
      applyGameSpeed(); // Apply the new speed
    });
  });

  // NEW: Event listener for player name input
  playerNameInputEl.addEventListener('focus', () => {
      isPlayerNameInputFocused = true;
  });
  playerNameInputEl.addEventListener('blur', (event) => {
      isPlayerNameInputFocused = false;
      player.name = event.target.value.trim(); // Update player name in game state
      if (player.name === '') {
          player.name = 'Adventurer'; // Default name if empty
          playerNameInputEl.value = 'Adventurer';
      }
      logMessage(`Your name has been changed to ${player.name}.`);
      updateUI(); // Update UI to reflect name change in other places (e.g., log messages)
  });
  // Also update on 'change' for cases where user presses Enter
  playerNameInputEl.addEventListener('change', (event) => {
      // The blur event will also trigger change, so this might be redundant but harmless.
      // Keeping it for robustness in case blur doesn't always fire change in all environments.
      player.name = event.target.value.trim(); // Update player name in game state
      if (player.name === '') {
          player.name = 'Adventurer'; // Default name if empty
          playerNameInputEl.value = 'Adventurer';
      }
      logMessage(`Your name has been changed to ${player.name}.`);
      updateUI(); // Update UI to reflect name change in other places (e.g., log messages)
  });
};
// Map item types to the player's equipped properties (slots)
const itemSlotMap = {
  weapon: ['equippedWeapon', 'equippedOffHand'], // Weapons can go in either main or off-hand
  dagger: ['equippedOffHand'], // Daggers can ONLY go in off-hand
  head: ['equippedHead'],
  shoulders: ['equippedShoulders'],
  chest: ['equippedChest'],
  legs: ['equippedLegs'],
  feet: ['equippedFeet']
};
/**
 * Handles equipping and unequipping items.
 * @param {string} itemInstanceId - The unique ID of the item instance to equip/unequip.
 */
function equipItem(itemInstanceId) {
  let itemToManage = null;
  let itemIndexInInventory = -1;
  let currentEquippedSlot = null;
  // Try to find the item in inventory
  itemIndexInInventory = inventory.findIndex(item => item.id === itemInstanceId);
  if (itemIndexInInventory !== -1) {
    itemToManage = inventory[itemIndexInInventory];
  } else {
    // If not in inventory, check if it's currently equipped
    for (const slotProp in player) {
      if (slotProp.startsWith('equipped') && player[slotProp] && player[slotProp].id === itemInstanceId) {
        itemToManage = player[slotProp];
        currentEquippedSlot = slotProp;
        break;
      }
      }
  }
  if (!itemToManage) {
    console.error('Item instance not found for ID:', itemInstanceId);
    return;
  }
  const itemType = itemToManage.type;
  const possibleSlots = itemSlotMap[itemType];
  if (!possibleSlots) {
    logMessage(`You can't equip ${itemToManage.name}.`);
    return;
  }
  // --- Unequip Logic ---
  if (currentEquippedSlot) {
    // The item is currently equipped, so unequip it.
    player[currentEquippedSlot] = null;
    inventory.push(itemToManage); // Add it back to inventory
    logMessage(`You unequipped ${itemToManage.name}.`);
  }
  // --- Equip Logic ---
  else if (itemIndexInInventory !== -1) {
    // The item is in inventory, try to equip it.
    // NEW: Check if item level is higher than player level
    if (itemToManage.itemLevel > player.level) {
      logMessage(
        `You cannot equip ${itemToManage.name} (Lvl ${itemToManage.itemLevel}). Your level is too low (Lvl ${player.level}).`
      );
      return; // Stop the function here
    }
    let equippedSuccessfully = false;
    // 1. Try to find an empty slot first
    for (const slotProp of possibleSlots) {
      if (player[slotProp] === null) {
        player[slotProp] = itemToManage;
        inventory.splice(itemIndexInInventory, 1); // Remove from inventory
        logMessage(`You equipped ${itemToManage.name}.`);
        equippedSuccessfully = true;
        break; // Item equipped, exit loop
      }
    }
    // 2. If no empty slot was found, try to replace an item in the first preferred slot
    if (!equippedSuccessfully) {
      const targetSlot = possibleSlots[0]; // Always target the first defined slot for replacement
      if (player[targetSlot]) {
        // Return the old item from that slot to inventory
        inventory.push(player[targetSlot]);
        logMessage(`You unequipped ${player[targetSlot].name} to equip ${itemToManage.name}.`);
      }
      // Equip the new item
      player[targetSlot] = itemToManage;
      inventory.splice(itemIndexInInventory, 1); // Remove from inventory
      logMessage(`You equipped ${itemToManage.name}.`);
      equippedSuccessfully = true; // Mark as successful
    }
    if (!equippedSuccessfully) {
      logMessage(`Could not find a suitable empty slot for ${itemToManage.name}.`);
    }
  } else {
    // This case should ideally not be hit if logic is correct:
    // itemToManage should either be in equippedSlot or inventory.
    logMessage(`Error: Item ${itemToManage.name} not found in inventory or equipped slots.`);
  }
  updatePlayerStats();
  updateInventoryUI();
  updateEquippedItemsUI();
}