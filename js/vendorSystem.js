// Vendor System
import { domElements } from './domElements.js';
import { player, inventory } from './gameState.js';
import { createItemInstance } from './itemSystem.js';
import { rarities, items, statAffixes } from './gameData.js';
import { calculateSellPrice } from './loot.js';
import { generateUniqueId } from './utils.js';
import { logMessage, updateUI, updateInventoryUI, updateGoldUI, showTooltip, hideTooltip } from './ui.js';

// Vendor state
let vendorItems = [];
let lastRefreshLevel = 0;
let freeRefreshCharges = 1; // Start with 1 free refresh
let vendorLevel = 1; // Track vendor item level separately from player level

/**
 * Creates an item for the vendor using the same stat calculation as enemy drops
 * @param {string} itemType - The type of item to create
 * @param {number} itemLevel - The level of the item
 * @param {string} rarity - The rarity of the item
 * @param {string} affixName - The affix name to apply
 * @returns {object} Complete item instance
 */
function createItemFromTypeAndRarity(itemType, itemLevel, rarity, affixName) {
    // Find the base item data for this type
    const itemEntry = Object.values(items).find(item => item.type === itemType);
    
    if (!itemEntry) {
        console.error(`No item found for type: ${itemType}`);
        return null;
    }
    
    const effectiveStatLevel = itemLevel + (rarities[rarity]?.levelBoost || 0);
    const selectedAffix = statAffixes[affixName];
    
    // Use the same level scaling calculation as regular items
    const normalizedLevel = effectiveStatLevel / 100;
    const levelMultiplier = 0.3 + (0.7 * normalizedLevel) + (3.0 * normalizedLevel * normalizedLevel);
    
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
    
    // Calculate primary stats using the SAME constants as regular items
    if (itemEntry.type === 'weapon' || itemEntry.type === 'dagger') {
        // Use the same formula as itemSystem.js: baseStatValue * effectiveStatLevel * WEAPON_ATTACK_SCALING_PER_LEVEL * levelMultiplier
        stats.bonusAttack = itemEntry.baseStatValue * effectiveStatLevel * 5 * levelMultiplier;
    } else if (['head', 'shoulders', 'chest', 'legs', 'feet'].includes(itemEntry.type)) {
        // Use the same formulas as itemSystem.js
        stats.bonusMaxHp = itemEntry.baseStatValue * effectiveStatLevel * 20 * levelMultiplier;
        stats.bonusDefense = itemEntry.baseStatValue * effectiveStatLevel * 2 * levelMultiplier;
        stats.bonusHealthRegen = itemEntry.baseStatValue * effectiveStatLevel * 0.5 * levelMultiplier;
        
        // Calculate Defense Power using the same weights
        stats.defensePower = 
            (stats.bonusMaxHp * 0.05) +
            (stats.bonusDefense * 1) +
            (stats.bonusHealthRegen * 10);
    }
    
    // Calculate secondary stats using the SAME system as regular items
    const secondaryStatKeys = Object.keys(selectedAffix.stats);
    if (secondaryStatKeys.length === 2) {
        const totalSecondaryPoints = itemEntry.baseStatValue * effectiveStatLevel * 8 * levelMultiplier;
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
    
    return {
        id: generateUniqueId(),
        name: itemEntry.name,
        type: itemEntry.type,
        itemLevel: itemLevel,
        rarity: rarity,
        baseStatValue: itemEntry.baseStatValue,
        affix: {
            name: affixName,
        },
        ...stats,
        sellPrice: Math.max(1, Math.floor(itemLevel * (rarities[rarity]?.goldMultiplier || 1))),
        vendorPrice: Math.max(1, Math.floor(itemLevel * (rarities[rarity]?.goldMultiplier || 1))) * 5 // 5x sell price for vendor
    };
}

/**
 * Get a random affix for vendor items
 */
function getRandomAffix() {
    const affixes = ['of the Tiger', 'of the Wolf', 'of the Eagle'];
    const randomIndex = Math.floor(Math.random() * affixes.length);
    return { name: affixes[randomIndex] };
}

/**
 * Creates a vendor item with exact same stats as regular items would have
 * @param {object} itemData - Base item data
 * @param {number} itemLevel - Level of the item
 * @param {string} rarity - Rarity of the item
 * @param {string} affixName - Name of the affix
/**
 * Initialize the vendor system
 */
export function initializeVendor() {
    // Clear any existing vendor data to ensure fresh start
    vendorItems = [];
    lastRefreshLevel = 0;
    vendorLevel = player.level; // Start vendor level at player level
    refreshVendorStock();
    updateVendorUI();
}

/**
 * Refresh vendor stock with new items
 */
export function refreshVendorStock(useCharge = false) {
    vendorItems = [];
    
    // Increment vendor level by 1 each refresh (but don't exceed player level)
    if (useCharge) {
        vendorLevel = Math.min(vendorLevel + 1, player.level);
    } else {
        // On initialization, start at player level
        vendorLevel = Math.max(vendorLevel, player.level);
    }
    
    // Available item types for vendor
    const itemTypes = ['weapon', 'dagger', 'head', 'shoulders', 'chest', 'legs', 'feet'];
    
    // Generate 4-6 items at vendor level with rarity chances
    const itemCount = Math.floor(Math.random() * 3) + 4; // 4-6 items
    
    for (let i = 0; i < itemCount; i++) {
    // Pick random item type
    const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    
    // Find the item data for this type
    const itemData = Object.values(items).find(item => item.type === randomType);
    
    if (itemData) {
        // Determine rarity with weighted chances (no legendaries) - much more rare
        const rarityRoll = Math.random() * 100;
        let itemRarity;
        if (rarityRoll < 97.01) {
            itemRarity = 'Uncommon'; // 97.01% chance
        } else if (rarityRoll < 99.51) {
            itemRarity = 'Rare'; // 2.5% chance
        } else {
            itemRarity = 'Epic'; // 0.49% chance
        }
        
        // Get random affix
        const randomAffix = getRandomAffix();
        
        // Create vendor item using the same system as enemy drops
        // Use createItem with specific rarity and level
        const item = createItemFromTypeAndRarity(itemData.type, vendorLevel, itemRarity, randomAffix.name);
        
        vendorItems.push(item);
    }
    }
    
    lastRefreshLevel = player.level;
    updateVendorUI();
    
    if (useCharge) {
        logMessage('Vendor stock has been refreshed!');
        logMessage(`Vendor now offers level ${vendorLevel} items!`);
    }
}


/**
 * Calculate vendor price for an item (10x sell value)
 */
function calculateVendorPrice(item) {
    // Simple formula: 10x the item's simple sell price (level * rarity multiplier only)
    return item.sellPrice * 5;
}

/**
 * Calculate the gold cost to refresh vendor stock
 */
function calculateRefreshCost() {
    // Cost is 5x the sell price of a level-appropriate item
    const baseSellPrice = player.level * (rarities['Uncommon']?.goldMultiplier || 2);
    return baseSellPrice * 3;
}

/**
 * Attempt to refresh vendor stock (costs gold or uses free charge)
 */
export function attemptVendorRefresh() {
    const refreshCost = calculateRefreshCost();
    
    // Check if player has free charges
    if (freeRefreshCharges > 0) {
        freeRefreshCharges--;
        refreshVendorStock(true);
        logMessage(`Used free refresh charge! Remaining charges: ${freeRefreshCharges}`);
        return;
    }
    
    // Check if player has enough gold
    if (player.gold < refreshCost) {
        logMessage(`Not enough gold to refresh! Need ${refreshCost}, have ${player.gold}.`);
        return;
    }
    
    // Deduct gold and refresh
    player.gold -= refreshCost;
    refreshVendorStock(true);
    logMessage(`Refreshed vendor stock for ${refreshCost} gold!`);
    updateGoldUI();
}

/**
 * Attempt to buy an item from vendor
 */
export function buyVendorItem(itemId) {
    const item = vendorItems.find(item => item.id === itemId);
    if (!item) return;
    
    // Check if player has enough gold
    if (player.gold < item.vendorPrice) {
        logMessage(`Not enough gold! Need ${item.vendorPrice}, have ${player.gold}.`);
        return;
    }
    
    // Deduct gold
    player.gold -= item.vendorPrice;
    
    // Add item to inventory
    inventory.push(item);
    
    // Remove item from vendor
    const vendorIndex = vendorItems.findIndex(vendorItem => vendorItem.id === itemId);
    if (vendorIndex !== -1) {
        vendorItems.splice(vendorIndex, 1);
    }
    
    logMessage(`Purchased ${item.name} for ${item.vendorPrice} gold!`);
    
    // Update UI
    updateVendorUI();
    updateInventoryUI();
    updateGoldUI();
    updateUI();
}

/**
 * Update vendor UI display
 */
export function updateVendorUI() {
    if (!domElements.vendorList) return;
    
    // Update vendor title with current level
    if (domElements.vendorTitle) {
        domElements.vendorTitle.textContent = `Shop Lvl. ${vendorLevel}`;
    }
    
    // Update refresh button text and styling
    const refreshCost = calculateRefreshCost();
    
    if (domElements.refreshVendorBtn) {
        if (freeRefreshCharges > 0) {
            domElements.refreshVendorBtn.textContent = `Refresh Stock (Free: ${freeRefreshCharges})`;
            domElements.refreshVendorBtn.style.backgroundColor = '#22c55e'; // Green for free
            domElements.refreshVendorBtn.style.color = '#ffffff';
            domElements.refreshVendorBtn.style.borderColor = '#22c55e';
        } else {
            domElements.refreshVendorBtn.textContent = `Refresh Stock (${refreshCost}g)`;
            // Reset to default button styling
            domElements.refreshVendorBtn.style.backgroundColor = '';
            domElements.refreshVendorBtn.style.color = '';
            domElements.refreshVendorBtn.style.borderColor = '';
            
            // Add red styling if can't afford
            if (player.gold < refreshCost) {
                domElements.refreshVendorBtn.style.backgroundColor = '#ef4444';
                domElements.refreshVendorBtn.style.color = '#ffffff';
                domElements.refreshVendorBtn.style.borderColor = '#ef4444';
            }
        }
    }
    
    // Clear current vendor display
    domElements.vendorList.innerHTML = '';
    
    // Add vendor items
    vendorItems.forEach(item => {
        const listItem = document.createElement('div');
        listItem.className = 'inventory-list-item vendor-item';
        listItem.dataset.itemId = item.id;
        
        // Apply rarity styling to the list item
        const rarityColor = rarities[item.rarity]?.color || '#e2e8f0';
        listItem.style.borderLeft = `3px solid ${rarityColor}`;
        
        // Create item display with price
        const itemName = document.createElement('div');
        itemName.className = 'item-name';
        itemName.textContent = `${item.name} ${item.affix ? item.affix.name : ''}`;
        // Apply rarity color
        itemName.style.color = rarityColor;
        
        const itemPrice = document.createElement('div');
        itemPrice.className = 'item-price';
        itemPrice.textContent = `${item.vendorPrice}g`;
        itemPrice.style.color = player.gold >= item.vendorPrice ? '#f6e05e' : '#ef4444';
        
        listItem.appendChild(itemName);
        listItem.appendChild(itemPrice);
        
        // Add click handler for purchasing
        listItem.addEventListener('click', () => {
            buyVendorItem(item.id);
        });
        
        // Add tooltip handlers
        listItem.addEventListener('mouseenter', (e) => {
            showTooltip(e, item, true); // true = enable comparison with equipped items
        });
        
        listItem.addEventListener('mouseleave', () => {
            hideTooltip();
        });
        
        domElements.vendorList.appendChild(listItem);
    });
}

/**
 * Check if vendor should give free refresh charge (called on level up)
 */
export function checkVendorRefresh() {
    if (player.level > lastRefreshLevel) {
        // Give 1 free refresh charge per level gained
        const levelsGained = player.level - lastRefreshLevel;
        freeRefreshCharges += levelsGained;
        lastRefreshLevel = player.level;
        
        logMessage(`Level up! Gained ${levelsGained} free vendor refresh charge(s)! Total: ${freeRefreshCharges}`);
        updateVendorUI(); // Update button text
    }
}

/**
 * Reset vendor state (for game reset)
 */
export function resetVendor() {
    vendorItems = [];
    lastRefreshLevel = 0;
    freeRefreshCharges = 1;
    vendorLevel = 1; // Reset vendor level to 1
}

/**
 * Get vendor items (for save/load)
 */
export function getVendorItems() {
    return {
        items: vendorItems,
        lastRefreshLevel: lastRefreshLevel,
        freeRefreshCharges: freeRefreshCharges,
        vendorLevel: vendorLevel
    };
}

/**
 * Set vendor items (for save/load)
 */
export function setVendorItems(vendorData) {
    if (vendorData) {
        // Restore vendor state
        if (vendorData.items && vendorData.items.length > 0) {
            vendorItems = vendorData.items;
        }
        if (vendorData.freeRefreshCharges !== undefined) {
            freeRefreshCharges = vendorData.freeRefreshCharges;
        }
        if (vendorData.lastRefreshLevel !== undefined) {
            lastRefreshLevel = vendorData.lastRefreshLevel;
        }
        if (vendorData.vendorLevel !== undefined) {
            vendorLevel = vendorData.vendorLevel;
        } else {
            // For old saves without vendor level, start at player level
            vendorLevel = player.level;
        }
        
        // Update the UI to show restored items
        updateVendorUI();
    } else {
        // No saved data, start fresh
        vendorLevel = player.level;
        refreshVendorStock();
    }
}
