// Main Game File - Modular Version
// This file imports from the separate modules and contains the main game loop

// Global error handler
window.onerror = function(message, source, lineno, colno, error) {
    const errorDisplay = document.getElementById('errorMessageDisplay');
    if (errorDisplay) {
        errorDisplay.textContent = `Error: ${message} (Line: ${lineno})`;
        errorDisplay.classList.remove('hidden');
        setTimeout(() => {
            errorDisplay.classList.add('hidden');
        }, 10000);
    }
    console.error("Global Error Caught:", { message, source, lineno, colno, error });
    return false;
};

// Import all modules
import { 
    ARMOR_K_VALUE,
    CRIT_K_VALUE, 
    HASTE_K_VALUE, 
    MASTERY_K_VALUE,
    PLAYER_BASE_ATTACK_START,
    PLAYER_BASE_ATTACK_SCALING_FACTOR,
    MAX_LEVEL,
    ENEMY_HP_BASE,
    ENEMY_HP_SCALING_FACTOR,
    ENEMY_ATTACK_BASE,
    ENEMY_ATTACK_SCALING_FACTOR,
    ENEMY_XP_BASE,
    ENEMY_XP_REWARD_EXPONENT
} from './js/constants.js';

import { 
    levelZones,
    rarities,
    lootTable
} from './js/gameData.js';

import { domElements } from './js/domElements.js';

import { 
    player, 
    enemy, 
    talents,
    currentZone,
    inventory,
    setCurrentZone,
    isGameOver,
    isGhostForm,
    isResting,
    gameSpeedMultiplier,
    setGameSpeedMultiplier,
    setPlayerNameInputFocused,
    setGameOver,
    setGhostForm,
    setResting,
    setAutoSellStatsEnabled,
    setAutoSellCommonEnabled,
    setAutoSellUncommonEnabled,
    setAutoSellRareEnabled
} from './js/gameState.js';

import { 
    calculateXpToNextLevel,
    clamp,
    flatToPercentage,
    percentageToFlat,
    getRandomElement
} from './js/utils.js';

import { 
    addItemToInventory,
    shouldAutoSellForStats,
    getEquippedItemForComparison,
    sellAllItems,
    sellIndividualItem
} from './js/itemSystem.js';

import { 
    updateUI,
    logMessage,
    updateGoldUI,
    updateInventoryUI,
    updateEquippedItemsUI,
    showCombatText,
    getCurrentConfirmationCallback,
    hideTooltip
} from './js/ui.js';

import { startHealthRegenLoop } from './js/healthSystem.js';
import { spawnNextEnemy } from './js/enemySystem.js';
import { levelUp, spendTalentPoint } from './js/progression.js';
import { startCombat, stopCombat } from './js/combat.js';
import { saveGame, loadGame, handleLoadFile } from './js/saveSystem.js';

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Game modules loaded successfully!');
    initializeGame();
    setupEventListeners();
});

/**
 * Initialize the game
 */
function initializeGame() {
    // Calculate initial player base attack
    player.baseAttack = PLAYER_BASE_ATTACK_START * Math.pow(PLAYER_BASE_ATTACK_SCALING_FACTOR, player.level - 1);
    
    // Update player stats and UI
    updatePlayerStats();
    updateUI();
    
    // Initialize inventory and equipment display
    updateInventoryUI();
    updateEquippedItemsUI();
    
    // Log initial message
    logMessage('Game started! Fight monsters to gain experience and loot.');
    
    // Start game systems
    startHealthRegenLoop();
    spawnEnemy();
}

/**
 * Setup event listeners for UI elements
 */
function setupEventListeners() {
    // Game speed controls
    domElements.gameSpeedRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const newSpeed = parseFloat(e.target.value);
            setGameSpeedMultiplier(newSpeed);
            logMessage(`Game speed set to ${newSpeed}x`);
        });
    });
    
    // Player name input
    domElements.playerNameInput.addEventListener('focus', () => {
        setPlayerNameInputFocused(true);
    });
    
    domElements.playerNameInput.addEventListener('blur', () => {
        setPlayerNameInputFocused(false);
        player.name = domElements.playerNameInput.value || 'Player';
        updateUI();
    });
    
    // Zone navigation
    domElements.prevZoneBtn.addEventListener('click', () => {
        import('./js/enemySystem.js').then(module => {
            module.changeToPreviousZone();
        });
    });
    
    domElements.nextZoneBtn.addEventListener('click', () => {
        import('./js/enemySystem.js').then(module => {
            module.changeToNextZone();
        });
    });
    
    // Shardspire floor controls
    if (domElements.floorDownBtn) {
        domElements.floorDownBtn.addEventListener('click', () => {
            import('./js/gameState.js').then(stateModule => {
                import('./js/enemySystem.js').then(enemyModule => {
                    import('./js/ui.js').then(uiModule => {
                        if (stateModule.shardspireFloor > 1) {
                            stateModule.setShardspireFloor(stateModule.shardspireFloor - 1);
                            uiModule.updateShardspireFloorDisplay();
                            enemyModule.spawnNextEnemy();
                            logMessage(`Descended to Floor ${stateModule.shardspireFloor}.`);
                        }
                    });
                });
            });
        });
    }
    
    if (domElements.floorUpBtn) {
        domElements.floorUpBtn.addEventListener('click', () => {
            import('./js/gameState.js').then(stateModule => {
                import('./js/enemySystem.js').then(enemyModule => {
                    import('./js/ui.js').then(uiModule => {
                        if (stateModule.shardspireFloor < 20) {
                            stateModule.setShardspireFloor(stateModule.shardspireFloor + 1);
                            uiModule.updateShardspireFloorDisplay();
                            enemyModule.spawnNextEnemy();
                            logMessage(`Ascended to Floor ${stateModule.shardspireFloor}.`);
                        }
                    });
                });
            });
        });
    }
    
    // Rest controls
    domElements.forceRestBtn.addEventListener('click', () => {
        import('./js/healthSystem.js').then(module => {
            module.forceRest();
        });
    });
    
    domElements.autoRestCheckbox.addEventListener('change', (e) => {
        import('./js/healthSystem.js').then(module => {
            module.setAutoRest(e.target.checked);
        });
    });
    
    // Auto-sell controls
    domElements.autoSellStatsCheckbox.addEventListener('change', (e) => {
        setAutoSellStatsEnabled(e.target.checked);
    });
    
    domElements.autoSellCommonCheckbox.addEventListener('change', (e) => {
        setAutoSellCommonEnabled(e.target.checked);
    });
    
    domElements.autoSellUncommonCheckbox.addEventListener('change', (e) => {
        setAutoSellUncommonEnabled(e.target.checked);
    });
    
    domElements.autoSellRareCheckbox.addEventListener('change', (e) => {
        setAutoSellRareEnabled(e.target.checked);
    });
    
    // Sell All and Sort controls
    if (domElements.sellAllBtn) {
        domElements.sellAllBtn.addEventListener('click', () => {
            import('./js/itemSystem.js').then(module => {
                module.sellAllItems();
            });
        });
    }
    
    if (domElements.sortInventoryBtn) {
        domElements.sortInventoryBtn.addEventListener('click', () => {
            updateInventoryUI();
            logMessage('Inventory sorted by level (descending).');
        });
    }
    
    // Inventory controls
    domElements.inventoryList.addEventListener('click', (e) => {
        const listItem = e.target.closest('.inventory-list-item');
        if (listItem && listItem.dataset.itemId) {
            if (e.ctrlKey) {
                // Ctrl+click to sell individual item
                sellIndividualItem(listItem.dataset.itemId);
            } else {
                // Normal click to equip
                equipItemById(listItem.dataset.itemId);
            }
        }
    });
    
    domElements.equippedList.addEventListener('click', (e) => {
        const listItem = e.target.closest('.equipped-list-item');
        if (listItem && listItem.dataset.itemId) {
            unequipItemById(listItem.dataset.itemId);
        }
    });
    
    // Talent buttons
    setupTalentButtons();
    
    // Settings and help
    setupSettingsAndHelp();
    
    // Save/Load functionality
    setupSaveLoad();
    
    // Modal event listeners
    setupModalEventListeners();
}

/**
 * Recalculates player's total attack and defense based on base stats and equipped items.
 */
export function updatePlayerStats() {
    player.attack = player.baseAttack;
    player.defense = player.baseDefense;
    player.maxHp = player.baseMaxHp;
    player.healthRegen = player.baseHealthRegen;
    
    // Initialize base flat secondary stats
    player.baseCriticalChance = 0;
    player.baseHaste = 0;
    player.baseMastery = 0;

    let equippedItemsHealthRegen = 0;

    // Apply equipped item bonuses
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
        if (item) {
            player.attack += item.bonusAttack || 0;
            player.defense += item.bonusDefense || 0;
            player.maxHp += item.bonusMaxHp || 0;
            equippedItemsHealthRegen += item.bonusHealthRegen || 0;
            player.baseCriticalChance += item.bonusCriticalChance || 0;
            player.baseHaste += item.bonusHaste || 0;
            player.baseMastery += item.bonusMastery || 0;
        }
    });

    player.healthRegen += equippedItemsHealthRegen;

    // Apply health regen cap
    const maxRegenCapValue = player.maxHp * 0.10; // 10% cap (increased from 5%)
    player.isHealthRegenCappedByStats = (player.healthRegen >= maxRegenCapValue);
    player.healthRegen = Math.min(player.healthRegen, maxRegenCapValue);

    // Add talent health regen after cap
    player.healthRegen += talents.healthRegen.currentRank * talents.healthRegen.bonusPerRank;

    // Apply talent bonuses for secondary stats
    const targetHastePercentagePerRank = 5;
    const targetCritPercentagePerRank = 3;
    
    const hastePointsPerRank = (targetHastePercentagePerRank * HASTE_K_VALUE) / (100 - targetHastePercentagePerRank);
    player.baseHaste += talents.attackSpeed.currentRank * hastePointsPerRank;
    
    const critPointsPerRank = (targetCritPercentagePerRank * CRIT_K_VALUE) / (100 - targetCritPercentagePerRank);
    player.baseCriticalChance += talents.criticalStrike.currentRank * critPointsPerRank;
    
    // Scaling Armor
    const armorBonus = talents.scalingArmor.currentRank * talents.scalingArmor.bonusPerRank * (1 + player.level * 0.1);
    player.defense += armorBonus;

    // Convert flat stats to percentages
    player.criticalChance = flatToPercentage(player.baseCriticalChance, CRIT_K_VALUE);
    player.haste = flatToPercentage(player.baseHaste, HASTE_K_VALUE);
    player.mastery = flatToPercentage(player.baseMastery, MASTERY_K_VALUE);
    
    // Hard cap secondary stats - Haste capped at 75% for better visual attack speed
    player.criticalChance = Math.min(player.criticalChance, 95);
    player.haste = Math.min(player.haste, 75); // Reduced from 95% to 75% for better attack speed visuals
    player.mastery = Math.min(player.mastery, 95);

    // Ensure current HP doesn't exceed new max HP
    if (player.hp > player.maxHp) {
        player.hp = player.maxHp;
    }
    
    updateUI();
}

/**
 * Spawns the next enemy using the enemy system
 */
function spawnEnemy() {
    spawnNextEnemy();
}

/**
 * Starts combat between player and enemy
 */
function startCombatSystem() {
    startCombat();
}

/**
 * Setup talent button event listeners
 */
function setupTalentButtons() {
    domElements.attackSpeedTalent.addEventListener('click', () => {
        spendTalentPoint('attackSpeed');
    });
    
    domElements.criticalStrikeTalentBtn.addEventListener('click', () => {
        spendTalentPoint('criticalStrike');
    });
    
    domElements.healthRegenTalentBtn.addEventListener('click', () => {
        spendTalentPoint('healthRegen');
    });
    
    domElements.scalingArmorTalentBtn.addEventListener('click', () => {
        spendTalentPoint('scalingArmor');
    });
}

/**
 * Setup settings and help event listeners
 */
function setupSettingsAndHelp() {
    // Settings overlay
    domElements.settingsButton.addEventListener('click', () => {
        domElements.settingsOverlay.classList.remove('hidden');
    });
    
    domElements.closeSettingsButton.addEventListener('click', () => {
        domElements.settingsOverlay.classList.add('hidden');
    });
    
    // Help overlay
    domElements.helpButton.addEventListener('click', () => {
        domElements.helpOverlay.classList.remove('hidden');
    });
    
    if (domElements.helpCloseButton) {
        domElements.helpCloseButton.addEventListener('click', () => {
            domElements.helpOverlay.classList.add('hidden');
        });
    }
    
    // Game reset
    domElements.resetGameFromSettingsBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset the game? This will delete all progress!')) {
            resetGame();
        }
    });
}

/**
 * Equips an item by its ID
 */
function equipItemById(itemId) {
    const item = inventory.find(item => item.id === itemId);
    if (!item) return;
    
    // Check level requirement
    if (player.level < item.itemLevel) {
        logMessage(`You cannot equip ${item.name} (Lvl ${item.itemLevel}). Your level is too low (Lvl ${player.level}).`);
        return;
    }
    
    // Determine which slot this item goes into
    let targetSlot = null;
    if (item.type === 'weapon') {
        targetSlot = 'equippedWeapon';
    } else if (item.type === 'dagger') {
        targetSlot = 'equippedOffHand';
    } else if (item.type === 'head') {
        targetSlot = 'equippedHead';
    } else if (item.type === 'shoulders') {
        targetSlot = 'equippedShoulders';
    } else if (item.type === 'chest') {
        targetSlot = 'equippedChest';
    } else if (item.type === 'legs') {
        targetSlot = 'equippedLegs';
    } else if (item.type === 'feet') {
        targetSlot = 'equippedFeet';
    }
    
    if (targetSlot) {
        // Unequip current item if any
        if (player[targetSlot]) {
            inventory.push(player[targetSlot]);
        }
        
        // Equip new item
        player[targetSlot] = item;
        
        // Remove from inventory
        const inventoryIndex = inventory.findIndex(invItem => invItem.id === itemId);
        if (inventoryIndex !== -1) {
            inventory.splice(inventoryIndex, 1);
        }
        
        logMessage(`Equipped ${item.name} ${item.affix ? item.affix.name : ''}`);
        updatePlayerStats();
        
        // Hide tooltip and force UI updates
        hideTooltip(); // Hide the tooltip that was showing for the inventory item
        import('./js/ui.js').then(uiModule => {
            uiModule.updateInventoryUI(true); // Force update
            uiModule.updateEquippedItemsUI(true); // Force update
        });
    }
}

/**
 * Unequips an item by its ID
 */
function unequipItemById(itemId) {
    console.log('Attempting to unequip item with ID:', itemId); // Debug log
    let unequippedItem = null;
    let slotName = '';
    
    // Find which slot contains this item
    const slots = ['equippedWeapon', 'equippedOffHand', 'equippedHead', 'equippedShoulders', 'equippedChest', 'equippedLegs', 'equippedFeet'];
    
    for (const slot of slots) {
        if (player[slot] && player[slot].id === itemId) {
            unequippedItem = player[slot];
            player[slot] = null;
            slotName = slot;
            console.log('Found item in slot:', slot); // Debug log
            break;
        }
    }
    
    if (unequippedItem) {
        inventory.push(unequippedItem);
        logMessage(`Unequipped ${unequippedItem.name} ${unequippedItem.affix ? unequippedItem.affix.name : ''}`);
        updatePlayerStats();
        
        // Hide tooltip and force UI updates
        hideTooltip(); // Hide any visible tooltip
        import('./js/ui.js').then(uiModule => {
            uiModule.updateInventoryUI(true); // Force update
            uiModule.updateEquippedItemsUI(true); // Force update
        });
        console.log('Item unequipped successfully'); // Debug log
    } else {
        console.log('Item not found for unequipping'); // Debug log
    }
}

/**
 * Setup save/load event listeners
 */
function setupSaveLoad() {
    // Save game button
    if (domElements.saveGameFromSettingsBtn) {
        domElements.saveGameFromSettingsBtn.addEventListener('click', () => {
            saveGame();
        });
    }
    
    // Load game button
    if (domElements.loadGameFromSettingsBtn) {
        domElements.loadGameFromSettingsBtn.addEventListener('click', () => {
            loadGame();
        });
    }
    
    // Load file input
    if (domElements.loadFileInput) {
        domElements.loadFileInput.addEventListener('change', handleLoadFile);
    }
}

/**
 * Resets the entire game
 */
function resetGame() {
    // Reset player stats
    player.name = 'Edd';
    player.level = 1;
    player.hp = 200;
    player.xp = 0;
    player.xpToNextLevel = 100;
    player.gold = 0;
    
    // Clear equipment
    player.equippedWeapon = null;
    player.equippedOffHand = null;
    player.equippedHead = null;
    player.equippedShoulders = null;
    player.equippedChest = null;
    player.equippedLegs = null;
    player.equippedFeet = null;
    
    // Clear inventory
    inventory.length = 0;
    
    // Reset talents
    for (const talentKey in talents) {
        talents[talentKey].currentRank = 0;
    }
    
    // Reset zone
    setCurrentZone(levelZones[0]);
    
    // Reset game state flags
    setGameOver(false);
    setGhostForm(false);
    setResting(false);
    
    // Reinitialize
    initializeGame();
    
    logMessage('Game has been reset!');
}

/**
 * Setup modal event listeners
 */
function setupModalEventListeners() {
    // Confirmation modal buttons
    domElements.confirmButton.addEventListener('click', () => {
        // Import and call the callback from ui.js
        import('./js/ui.js').then(uiModule => {
            const callback = uiModule.getCurrentConfirmationCallback();
            if (callback) {
                callback();
            }
            uiModule.hideConfirmationModal();
        });
    });
    
    domElements.cancelButton.addEventListener('click', () => {
        import('./js/ui.js').then(uiModule => {
            uiModule.hideConfirmationModal();
        });
    });
    
    // Close modal when clicking outside
    domElements.confirmationModalOverlay.addEventListener('click', (e) => {
        if (e.target === domElements.confirmationModalOverlay) {
            import('./js/ui.js').then(uiModule => {
                uiModule.hideConfirmationModal();
            });
        }
    });
}

/*
 * This modular architecture provides a solid foundation for the game.
 * All original functionality has been preserved while improving code organization.
 */
