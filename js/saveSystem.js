// Save/Load System
import { 
    player, 
    enemy, 
    talents, 
    inventory,
    currentZone,
    setCurrentZone,
    setGameSpeedMultiplier,
    setAutoSellStatsEnabled,
    setAutoSellCommonEnabled,
    setAutoSellUncommonEnabled,
    setAutoSellRareEnabled,
    shardspireFloor,
    setShardspireFloor
} from './gameState.js';
import { levelZones } from './gameData.js';
import { updateUI, logMessage, updateInventoryUI, updateEquippedItemsUI } from './ui.js';
import { domElements } from './domElements.js';
import { updatePlayerStats } from '../game_modular.js';

/**
 * Saves the current game state to a JSON file
 */
export async function saveGame() {
    // Get vendor data
    const vendorData = await import('./vendorSystem.js').then(module => module.getVendorItems());
    
    const gameState = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        player: {
            name: player.name,
            level: player.level,
            baseAttack: player.baseAttack,
            attack: player.attack,
            baseDefense: player.baseDefense,
            defense: player.defense,
            baseMaxHp: player.baseMaxHp,
            maxHp: player.maxHp,
            baseHealthRegen: player.baseHealthRegen,
            healthRegen: player.healthRegen,
            baseCriticalChance: player.baseCriticalChance,
            criticalChance: player.criticalChance,
            baseHaste: player.baseHaste,
            haste: player.haste,
            baseMastery: player.baseMastery,
            mastery: player.mastery,
            hp: player.hp,
            xp: player.xp,
            xpToNextLevel: player.xpToNextLevel,
            gold: player.gold,
            equippedWeapon: player.equippedWeapon,
            equippedOffHand: player.equippedOffHand,
            equippedHead: player.equippedHead,
            equippedShoulders: player.equippedShoulders,
            equippedChest: player.equippedChest,
            equippedLegs: player.equippedLegs,
            equippedFeet: player.equippedFeet,
            isHealthRegenCappedByStats: player.isHealthRegenCappedByStats
        },
        enemy: {
            name: enemy.name,
            level: enemy.level,
            maxHp: enemy.maxHp,
            hp: enemy.hp,
            attack: enemy.attack,
            attackSpeed: enemy.attackSpeed,
            lastAttackTime: enemy.lastAttackTime,
            xpReward: enemy.xpReward,
            goldReward: enemy.goldReward
        },
        inventory: inventory,
        talents: talents,
        currentZone: currentZone,
        shardspireFloor: shardspireFloor,
        vendor: vendorData,
        settings: {
            autoRestEnabled: domElements.autoRestCheckbox?.checked || false,
            autoSellStatsEnabled: domElements.autoSellStatsCheckbox?.checked || false,
            autoSellCommonEnabled: domElements.autoSellCommonCheckbox?.checked || false,
            autoSellUncommonEnabled: domElements.autoSellUncommonCheckbox?.checked || false,
            autoSellRareEnabled: domElements.autoSellRareCheckbox?.checked || false,
            gameSpeedMultiplier: parseFloat(document.querySelector('input[name="gameSpeed"]:checked')?.value || 1)
        }
    };

    const dataStr = JSON.stringify(gameState, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `idle-game-save-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    
    logMessage('Game saved successfully!');
}

/**
 * Loads a game state from a JSON file
 */
export function loadGame() {
    domElements.loadFileInput.click();
}

/**
 * Handles the file input change event for loading
 */
export function handleLoadFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const gameState = JSON.parse(e.target.result);
            applyLoadedGameState(gameState);
            logMessage('Game loaded successfully!');
        } catch (error) {
            logMessage('Error loading save file: Invalid file format.');
            console.error('Load error:', error);
        }
    };
    reader.readAsText(file);
}

/**
 * Applies the loaded game state to the current game
 */
function applyLoadedGameState(gameState) {
    // Restore player state
    Object.assign(player, gameState.player);
    
    // Restore enemy state
    if (gameState.enemy) {
        Object.assign(enemy, gameState.enemy);
    }
    
    // Restore inventory (clear current and load saved)
    inventory.length = 0;
    if (gameState.inventory) {
        inventory.push(...gameState.inventory);
    }
    
    // Restore talents (only currentRank to preserve structure)
    if (gameState.talents) {
        for (const talentName in gameState.talents) {
            if (talents[talentName] && gameState.talents[talentName].hasOwnProperty('currentRank')) {
                talents[talentName].currentRank = Math.min(
                    gameState.talents[talentName].currentRank,
                    talents[talentName].maxRank
                );
            }
        }
    }
    
    // Restore current zone
    if (gameState.currentZone) {
        const zone = levelZones.find(z => z.name === gameState.currentZone.name);
        if (zone) {
            setCurrentZone(zone);
        }
    }
    
    // Restore Shardspire floor
    if (gameState.shardspireFloor !== undefined) {
        setShardspireFloor(gameState.shardspireFloor);
    }
    
    // Restore vendor data
    if (gameState.vendor) {
        import('./vendorSystem.js').then(module => {
            module.setVendorItems(gameState.vendor);
        });
    }
    
    // Restore settings
    if (gameState.settings) {
        const settings = gameState.settings;
        
        setAutoSellStatsEnabled(settings.autoSellStatsEnabled || false);
        setAutoSellCommonEnabled(settings.autoSellCommonEnabled || false);
        setAutoSellUncommonEnabled(settings.autoSellUncommonEnabled || false);
        setAutoSellRareEnabled(settings.autoSellRareEnabled || false);
        setGameSpeedMultiplier(settings.gameSpeedMultiplier || 1);
        
        // Update UI checkboxes
        if (domElements.autoRestCheckbox) domElements.autoRestCheckbox.checked = settings.autoRestEnabled || false;
        if (domElements.autoSellStatsCheckbox) domElements.autoSellStatsCheckbox.checked = settings.autoSellStatsEnabled || false;
        if (domElements.autoSellCommonCheckbox) domElements.autoSellCommonCheckbox.checked = settings.autoSellCommonEnabled || false;
        if (domElements.autoSellUncommonCheckbox) domElements.autoSellUncommonCheckbox.checked = settings.autoSellUncommonEnabled || false;
        if (domElements.autoSellRareCheckbox) domElements.autoSellRareCheckbox.checked = settings.autoSellRareEnabled || false;
        
        // Update game speed radio buttons
        const speedRadio = document.querySelector(`input[name="gameSpeed"][value="${settings.gameSpeedMultiplier}"]`);
        if (speedRadio) speedRadio.checked = true;
    }
    
    // CRITICAL: Recalculate all player stats from equipped items and talents
    // This fixes the issue where loaded characters have incorrect stats
    updatePlayerStats();
    
    // Update all UI elements after stats are recalculated
    updateUI();
    updateInventoryUI(true); // Force update after loading save
    updateEquippedItemsUI();
    
    // Clear the file input
    domElements.loadFileInput.value = '';
}

/**
 * Exports game state as JSON string (for debugging or API use)
 */
export function exportGameState() {
    const gameState = {
        player,
        inventory,
        talents,
        currentZone
    };
    return JSON.stringify(gameState, null, 2);
}

/**
 * Imports game state from JSON string (for debugging or API use)
 */
export function importGameState(jsonString) {
    try {
        const gameState = JSON.parse(jsonString);
        applyLoadedGameState(gameState);
        return true;
    } catch (error) {
        console.error('Import error:', error);
        return false;
    }
}

/**
 * Automatically saves the game state to localStorage
 */
export async function autoSaveGame() {
    try {
        // Get vendor data
        const vendorData = await import('./vendorSystem.js').then(module => module.getVendorItems());
        
        const gameState = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            player: {
                name: player.name,
                level: player.level,
                baseAttack: player.baseAttack,
                attack: player.attack,
                baseDefense: player.baseDefense,
                defense: player.defense,
                baseMaxHp: player.baseMaxHp,
                maxHp: player.maxHp,
                baseHealthRegen: player.baseHealthRegen,
                healthRegen: player.healthRegen,
                baseCriticalChance: player.baseCriticalChance,
                criticalChance: player.criticalChance,
                baseHaste: player.baseHaste,
                haste: player.haste,
                baseMastery: player.baseMastery,
                mastery: player.mastery,
                hp: player.hp,
                xp: player.xp,
                xpToNextLevel: player.xpToNextLevel,
                gold: player.gold,
                equippedWeapon: player.equippedWeapon,
                equippedOffHand: player.equippedOffHand,
                equippedHead: player.equippedHead,
                equippedShoulders: player.equippedShoulders,
                equippedChest: player.equippedChest,
                equippedLegs: player.equippedLegs,
                equippedFeet: player.equippedFeet
            },
            enemy: {
                name: enemy.name,
                level: enemy.level,
                maxHp: enemy.maxHp,
                hp: enemy.hp,
                attack: enemy.attack,
                xpReward: enemy.xpReward
            },
            inventory: inventory,
            vendor: vendorData,
            currentZone: currentZone.name,
            talents: {
                attackSpeed: talents.attackSpeed,
                criticalStrike: talents.criticalStrike,
                healthRegen: talents.healthRegen,
                scalingArmor: talents.scalingArmor
            },
            shardspireFloor: shardspireFloor,
            settings: {
                autoRestEnabled: domElements.autoRestCheckbox?.checked || false,
                autoSellStatsEnabled: domElements.autoSellStatsCheckbox?.checked || false,
                autoSellCommonEnabled: domElements.autoSellCommonCheckbox?.checked || false,
                autoSellUncommonEnabled: domElements.autoSellUncommonCheckbox?.checked || false,
                autoSellRareEnabled: domElements.autoSellRareCheckbox?.checked || false,
                gameSpeedMultiplier: parseFloat(document.querySelector('input[name="gameSpeed"]:checked')?.value || 1)
            }
        };
        
        localStorage.setItem('idleGameAutosave', JSON.stringify(gameState));
        
        // Show autosave indicator
        const indicator = document.createElement('div');
        indicator.className = 'autosave-indicator';
        indicator.textContent = 'Game autosaved';
        document.body.appendChild(indicator);
        
        // Remove indicator after animation
        indicator.addEventListener('animationend', () => {
            indicator.remove();
        });
        
        console.log('Game autosaved successfully');
        logMessage('Successful Autosave');
    } catch (error) {
        console.error('Autosave failed:', error);
        logMessage('Failed to autosave game');
    }
}

/**
 * Loads the autosaved game state from localStorage
 */
export function loadAutosave() {
    try {
        const savedGame = localStorage.getItem('idleGameAutosave');
        if (!savedGame) {
            console.log('No autosave found');
            return false;
        }

        const loadedState = JSON.parse(savedGame);
        
        // Apply the loaded state using existing function
        applyLoadedGameState(loadedState);
        
        logMessage('Autosave loaded successfully!');
        return true;
    } catch (error) {
        console.error('Error loading autosave:', error);
        return false;
    }
}
