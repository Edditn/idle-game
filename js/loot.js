// Loot System - Updated to match monolithic version
import { 
    player, 
    enemy, 
    inventory,
    autoSellStatsEnabled,
    autoSellCommonEnabled,
    autoSellUncommonEnabled,
    autoSellRareEnabled
} from './gameState.js';
import { lootTable, rarities } from './gameData.js';
import { shouldAutoSellForStats, createItemInstance } from './itemSystem.js';
import { updateUI, logMessage, updateInventoryUI, updateGoldUI } from './ui.js';

/**
 * Roll for loot drops after defeating an enemy (uses lootTable like monolithic version)
 */
export function rollForLoot() {
    // Use the proper lootTable system from monolithic version
    for (const lootEntry of lootTable) {
        const dropRoll = Math.random() * 100; // Roll 0-99.99
        if (dropRoll < lootEntry.dropChance) {
            const quantity = Math.floor(Math.random() * (lootEntry.maxQuantity - lootEntry.minQuantity + 1)) + lootEntry.minQuantity;
            
            // Handle currency items (Coin)
            if (lootEntry.item.type === 'currency') {
                // Scale gold with enemy level
                const levelScaledQuantity = quantity + enemy.level;
                player.gold += levelScaledQuantity;
                logMessage(`You gained ${levelScaledQuantity} ${lootEntry.item.name}(s)! Total Gold: ${player.gold}`);
                updateGoldUI();
            } else {
                // Handle equipment items - create item instances with proper stats
                for (let i = 0; i < quantity; i++) {
                    const itemInstance = createItemInstance(lootEntry.item, enemy.level);
                    
                    // Check auto-sell conditions
                    if (shouldAutoSell(itemInstance)) {
                        // Auto-sell the item
                        const sellPrice = calculateSellPrice(itemInstance);
                        player.gold += sellPrice;
                        logMessage(`Auto-sold Lvl ${itemInstance.itemLevel} ${itemInstance.rarity} ${itemInstance.name} ${itemInstance.affix.name} for ${sellPrice} gold!`);
                        updateGoldUI();
                    } else {
                        // Add to inventory
                        inventory.push(itemInstance);
                        logMessage(`You found a Lvl ${itemInstance.itemLevel} ${itemInstance.rarity} ${itemInstance.name} ${itemInstance.affix.name}!`);
                    }
                }
                updateInventoryUI(true); // Force update to ensure immediate refresh
            }
        }
    }
    
    updateUI();
}

/**
 * Check if an item should be auto-sold (updated for proper item structure)
 */
function shouldAutoSell(item) {
    // Check rarity-based auto-sell (item.rarity is now a string)
    if (autoSellCommonEnabled && item.rarity === 'Common') {
        return true;
    }
    if (autoSellUncommonEnabled && item.rarity === 'Uncommon') {
        return true;
    }
    if (autoSellRareEnabled && item.rarity === 'Rare') {
        return true;
    }
    
    // Check stats-based auto-sell
    if (autoSellStatsEnabled && shouldAutoSellForStats(item)) {
        return true;
    }
    
    return false;
}

/**
 * Calculate the sell price of an item (updated for proper item structure)
 */
export function calculateSellPrice(item) {
    // Sell price is itemLevel × rarity multiplier
    const rarityData = rarities[item.rarity];
    const rarityMultiplier = rarityData?.goldMultiplier || 1;
    return Math.max(1, Math.floor(item.itemLevel * rarityMultiplier));
}
