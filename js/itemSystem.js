// Item System
import { 
    WEAPON_ATTACK_SCALING_PER_LEVEL, 
    ARMOR_PRIMARY_SCALING_PER_LEVEL,
    SECONDARY_STAT_SCALING_PER_LEVEL,
    DEFENSE_POWER_WEIGHTS
} from './constants.js';
import { rarities, statAffixes, items } from './gameData.js';
import { rollRarity, generateUniqueId, getRandomElement } from './utils.js';
import { 
    player, 
    inventory, 
    autoSellStatsEnabled, 
    autoSellCommonEnabled, 
    autoSellUncommonEnabled, 
    autoSellRareEnabled 
} from './gameState.js';
import { logMessage } from './ui.js';
import { updateInventoryUI, updateGoldUI } from './ui.js';

/**
 * Creates an item by type name, level, and rarity
 * @param {string} itemType - The type of item (e.g., 'weapon', 'head', etc.)
 * @param {number} itemLevel - The level of the item
 * @param {string} rarity - The rarity of the item
 * @returns {object} Complete item instance
 */
export function createItem(itemType, itemLevel, rarity = 'Common') {
  // Find the base item data for this type
  const itemEntry = Object.values(items).find(item => item.type === itemType);
  
  if (!itemEntry) {
    console.error(`No item found for type: ${itemType}`);
    return null;
  }
  
  const effectiveStatLevel = itemLevel + (rarities[rarity]?.levelBoost || 0);
  
  // Select random affix
  const affixNames = Object.keys(statAffixes);
  const randomAffixName = getRandomElement(affixNames);
  const selectedAffix = statAffixes[randomAffixName];
  
  // Calculate stats
  const stats = calculateItemStats(itemEntry, effectiveStatLevel, selectedAffix);
  
  return {
    id: generateUniqueId(),
    name: itemEntry.name,
    type: itemEntry.type,
    itemLevel: itemLevel,
    rarity: rarity,
    baseStatValue: itemEntry.baseStatValue,
    affix: {
      name: randomAffixName,
    },
    ...stats,
    sellPrice: itemLevel * 1
  };
}

/**
 * Attempts to add an item to the inventory or handle currency.
 * @param {object} itemData - The base item data from the 'items' object.
 * @param {number} quantity - The quantity of the item to add.
 * @param {number} [droppedByEnemyLevel=1] - The level of the enemy that dropped the item.
 */
export function addItemToInventory(itemData, quantity = 1, droppedByEnemyLevel = 1) {
  if (itemData.type === 'currency') {
    player.gold += quantity;
    logMessage(`You gained ${quantity} ${itemData.name}(s)! Total Gold: ${player.gold}`);
    updateGoldUI();
  } else {
    for (let i = 0; i < quantity; i++) {
      const newItem = createItemInstance(itemData, droppedByEnemyLevel);
      
      // Check autosell conditions
      if (shouldAutoSellItem(newItem)) {
        // Auto-sell the item
        player.gold += newItem.sellPrice;
        logMessage(`Auto-sold Lvl ${newItem.itemLevel} ${newItem.rarity} ${newItem.name} ${newItem.affix.name} for ${newItem.sellPrice} gold!`);
        updateGoldUI();
      } else {
        inventory.push(newItem);
        logMessage(`You found a Lvl ${newItem.itemLevel} ${newItem.rarity} ${newItem.name} ${newItem.affix.name}!`);
      }
    }
    updateInventoryUI();
  }
}

/**
 * Creates a new item instance with stats and properties
 * @param {object} itemData - Base item data
 * @param {number} droppedByEnemyLevel - Level of enemy that dropped it
 * @returns {object} Complete item instance
 */
export function createItemInstance(itemData, droppedByEnemyLevel) {
  const rolledRarity = rollRarity();
  
  // Anti-farming logic
  let itemActualLevel;
  if (player.level >= droppedByEnemyLevel + 3) {
    itemActualLevel = droppedByEnemyLevel;
  } else {
    const minItemLevel = Math.max(1, player.level - 2);
    const maxItemLevel = player.level + 1;
    itemActualLevel = Math.floor(Math.random() * (maxItemLevel - minItemLevel + 1)) + minItemLevel;
  }
  
  const effectiveStatLevel = itemActualLevel + (rarities[rolledRarity]?.levelBoost || 0);
  
  // Select random affix
  const affixNames = Object.keys(statAffixes);
  const randomAffixName = getRandomElement(affixNames);
  const selectedAffix = statAffixes[randomAffixName];
  
  // Calculate stats
  const stats = calculateItemStats(itemData, effectiveStatLevel, selectedAffix);
  
  return {
    id: generateUniqueId(),
    name: itemData.name,
    type: itemData.type,
    itemLevel: itemActualLevel,
    rarity: rolledRarity,
    baseStatValue: itemData.baseStatValue,
    affix: {
      name: randomAffixName,
    },
    ...stats,
    sellPrice: itemActualLevel * 1
  };
}

/**
 * Calculate level-based scaling multiplier for item stats
 * This creates a smooth curve where low-level items are weaker and high-level items are stronger
 * @param {number} itemLevel - The level of the item
 * @returns {number} Multiplier between 0.4 and 2.5
 */
function getLevelScalingMultiplier(itemLevel) {
  // More aggressive quadratic scaling: starts at 30% power at level 1, reaches 100% at level 40, goes to 400% at level 100
  const normalizedLevel = itemLevel / 100; // 0 to 1
  const multiplier = 0.3 + (0.7 * normalizedLevel) + (3.0 * normalizedLevel * normalizedLevel);
  return multiplier;
}

/**
 * Calculates all stats for an item
 * @param {object} itemData - Base item data
 * @param {number} effectiveStatLevel - Level including rarity bonus
 * @param {object} selectedAffix - The chosen affix
 * @returns {object} Calculated stats
 */
function calculateItemStats(itemData, effectiveStatLevel, selectedAffix) {
  // Get level-based scaling multiplier
  const levelMultiplier = getLevelScalingMultiplier(effectiveStatLevel);
  
  const stats = {
    bonusAttack: 0,
    bonusMaxHp: 0,
    bonusDefense: 0,
    bonusHealthRegen: 0,
    bonusCriticalChance: 0,
    bonusHaste: 0,
    bonusMastery: 0,
    defensePower: 0
  };
  
  // Calculate primary stats with level scaling
  if (itemData.type === 'weapon' || itemData.type === 'dagger') {
    stats.bonusAttack = itemData.baseStatValue * effectiveStatLevel * WEAPON_ATTACK_SCALING_PER_LEVEL * levelMultiplier;
  } else if (['head', 'shoulders', 'chest', 'legs', 'feet'].includes(itemData.type)) {
    stats.bonusMaxHp = itemData.baseStatValue * effectiveStatLevel * ARMOR_PRIMARY_SCALING_PER_LEVEL.maxHp * levelMultiplier;
    stats.bonusDefense = itemData.baseStatValue * effectiveStatLevel * ARMOR_PRIMARY_SCALING_PER_LEVEL.defense * levelMultiplier;
    stats.bonusHealthRegen = itemData.baseStatValue * effectiveStatLevel * ARMOR_PRIMARY_SCALING_PER_LEVEL.healthRegen * levelMultiplier;
    
    // Calculate Defense Power
    stats.defensePower = 
      (stats.bonusMaxHp * DEFENSE_POWER_WEIGHTS.maxHp) +
      (stats.bonusDefense * DEFENSE_POWER_WEIGHTS.defense) +
      (stats.bonusHealthRegen * DEFENSE_POWER_WEIGHTS.healthRegen);
  }
  
  // Calculate secondary stats with level scaling
  const secondaryStatKeys = Object.keys(selectedAffix.stats);
  if (secondaryStatKeys.length === 2) {
    const totalSecondaryPoints = itemData.baseStatValue * effectiveStatLevel * SECONDARY_STAT_SCALING_PER_LEVEL * levelMultiplier;
    const splitRatio = 0.25 + Math.random() * 0.5;
    
    const stat1Key = secondaryStatKeys[0];
    const stat2Key = secondaryStatKeys[1];
    
    const stat1Value = totalSecondaryPoints * splitRatio;
    const stat2Value = totalSecondaryPoints * (1 - splitRatio);
    
    // Assign values
    if (stat1Key === 'criticalChance') stats.bonusCriticalChance += stat1Value;
    else if (stat1Key === 'haste') stats.bonusHaste += stat1Value;
    else if (stat1Key === 'mastery') stats.bonusMastery += stat1Value;
    
    if (stat2Key === 'criticalChance') stats.bonusCriticalChance += stat2Value;
    else if (stat2Key === 'haste') stats.bonusHaste += stat2Value;
    else if (stat2Key === 'mastery') stats.bonusMastery += stat2Value;
  }
  
  return stats;
}

/**
 * Determines if an item should be auto-sold
 * @param {object} item - The item to check
 * @returns {boolean} True if should be auto-sold
 */
function shouldAutoSellItem(item) {
  // Check rarity-based autosell
  if ((item.rarity === 'Common' && autoSellCommonEnabled) ||
      (item.rarity === 'Uncommon' && autoSellUncommonEnabled) ||
      (item.rarity === 'Rare' && autoSellRareEnabled)) {
    return true;
  }
  
  // Check stat-based autosell
  if (autoSellStatsEnabled) {
    return shouldAutoSellForStats(item);
  }
  
  return false;
}

/**
 * Determines if an item should be auto-sold based on its stats compared to equipped items.
 * @param {object} item - The item instance to check
 * @returns {boolean} True if the item should be auto-sold
 */
export function shouldAutoSellForStats(item) {
  // Get the currently equipped item in the relevant slot(s)
  let equippedItems = [];
  
  if (item.type === 'weapon') {
    if (player.equippedWeapon) equippedItems.push(player.equippedWeapon);
  } else if (item.type === 'dagger') {
    if (player.equippedOffHand) equippedItems.push(player.equippedOffHand);
  } else if (['head', 'shoulders', 'chest', 'legs', 'feet'].includes(item.type)) {
    const slotMap = {
      head: 'equippedHead',
      shoulders: 'equippedShoulders', 
      chest: 'equippedChest',
      legs: 'equippedLegs',
      feet: 'equippedFeet'
    };
    const slotProperty = slotMap[item.type];
    if (player[slotProperty]) equippedItems.push(player[slotProperty]);
  }
  
  // If no item is equipped in that slot, don't auto-sell
  if (equippedItems.length === 0) {
    return false;
  }
  
  // Compare stats
  for (const equippedItem of equippedItems) {
    // For weapons, compare attack power
    if (item.type === 'weapon' || item.type === 'dagger') {
      if (item.bonusAttack > equippedItem.bonusAttack) {
        return false; // Item is better, don't auto-sell
      }
    }
    // For armor, compare defense power
    else if (['head', 'shoulders', 'chest', 'legs', 'feet'].includes(item.type)) {
      if (item.defensePower > equippedItem.defensePower) {
        return false; // Item is better, don't auto-sell
      }
    }
  }
  
  // Item has equal or worse stats than equipped items
  return true;
}

/**
 * Gets the equipped item for comparison based on item type
 * @param {object} inventoryItem - The inventory item to compare
 * @returns {object|null} The equipped item or null
 */
export function getEquippedItemForComparison(inventoryItem) {
  const itemType = inventoryItem.type;
  const itemSlotMap = {
    weapon: ['equippedWeapon', 'equippedOffHand'],
    dagger: ['equippedOffHand'],
    head: ['equippedHead'],
    shoulders: ['equippedShoulders'],
    chest: ['equippedChest'],
    legs: ['equippedLegs'],
    feet: ['equippedFeet']
  };
  
  const possibleSlots = itemSlotMap[itemType];
  if (!possibleSlots || possibleSlots.length === 0) {
    return null;
  }
  
  let targetSlotProp = null;
  if (itemType === 'weapon') {
    targetSlotProp = 'equippedWeapon';
  } else if (itemType === 'dagger') {
    targetSlotProp = 'equippedOffHand';
  } else {
    targetSlotProp = possibleSlots[0];
  }
  
  if (targetSlotProp && player[targetSlotProp]) {
    return player[targetSlotProp];
  }
  
  return null;
}

/**
 * Sells all items in the inventory
 */
export function sellAllItems() {
  if (inventory.length === 0) {
    logMessage('Your inventory is empty. Nothing to sell!');
    return;
  }
  
  let totalGoldValue = 0;
  inventory.forEach(item => {
    totalGoldValue += item.sellPrice || 0;
  });
  
  // Import the confirmation modal functions
  import('./ui.js').then(uiModule => {
    uiModule.showConfirmationModal(
      'Sell All Items?',
      `Are you sure you want to sell all ${inventory.length} items for a total of ${totalGoldValue} Gold?`,
      sellAllItemsConfirmed
    );
  });
}

/**
 * Confirms and executes selling all items
 */
function sellAllItemsConfirmed() {
  let totalGoldGained = 0;
  let itemsSoldCount = 0;
  
  // Find equipped items that are also in inventory
  const equippedItemIdsInInventory = [];
  const slots = ['equippedWeapon', 'equippedOffHand', 'equippedHead', 'equippedShoulders', 'equippedChest', 'equippedLegs', 'equippedFeet'];
  
  slots.forEach(slot => {
    if (player[slot]) {
      const equippedItem = player[slot];
      if (inventory.some(item => item.id === equippedItem.id)) {
        equippedItemIdsInInventory.push(equippedItem.id);
      }
    }
  });
  
  // Unequip items that are about to be sold
  equippedItemIdsInInventory.forEach(itemId => {
    slots.forEach(slot => {
      if (player[slot] && player[slot].id === itemId) {
        player[slot] = null;
      }
    });
  });
  
  // Sell all items
  inventory.forEach(item => {
    totalGoldGained += item.sellPrice || 0;
    itemsSoldCount++;
  });
  
  // Clear inventory and add gold
  inventory.length = 0;
  player.gold += totalGoldGained;
  
  logMessage(`You sold ${itemsSoldCount} items for ${totalGoldGained} Gold!`);
  
  // Update UI
  updateGoldUI();
  updateInventoryUI();
  
  // Update player stats if items were unequipped
  if (equippedItemIdsInInventory.length > 0) {
    import('./ui.js').then(uiModule => {
      uiModule.updateEquippedItemsUI();
    });
    // Update player stats
    import('../game_modular.js').then(gameModule => {
      gameModule.updatePlayerStats();
    });
  }
  
  // Hide confirmation modal
  import('./ui.js').then(uiModule => {
    uiModule.hideConfirmationModal();
  });
}

/**
 * Sells a single item by ID
 * @param {string} itemId - The ID of the item to sell
 */
export function sellIndividualItem(itemId) {
  const itemIndex = inventory.findIndex(item => item.id === itemId);
  if (itemIndex === -1) {
    logMessage('Item not found in inventory.');
    return;
  }
  
  const itemToSell = inventory[itemIndex];
  
  // Check if item is equipped and unequip it
  let wasEquipped = false;
  const slots = ['equippedWeapon', 'equippedOffHand', 'equippedHead', 'equippedShoulders', 'equippedChest', 'equippedLegs', 'equippedFeet'];
  
  slots.forEach(slot => {
    if (player[slot] && player[slot].id === itemToSell.id) {
      player[slot] = null;
      wasEquipped = true;
    }
  });
  
  // Remove from inventory and add gold
  inventory.splice(itemIndex, 1);
  player.gold += itemToSell.sellPrice || 0;
  
  logMessage(`You sold a Lvl ${itemToSell.itemLevel} ${itemToSell.rarity} ${itemToSell.name} for ${itemToSell.sellPrice} Gold.`);
  
  // Update UI
  updateGoldUI();
  updateInventoryUI();
  
  if (wasEquipped) {
    import('./ui.js').then(uiModule => {
      uiModule.updateEquippedItemsUI();
    });
    // Update player stats
    import('../game_modular.js').then(gameModule => {
      gameModule.updatePlayerStats();
    });
  }
}
