// Health and Rest System
import { 
    BASE_HEALTH_REGEN_INTERVAL_MS,
    REST_HP_THRESHOLD,
    REST_ENTRY_HP_THRESHOLD,
    REST_UPDATE_INTERVAL_MS,
    HEALTH_REGEN_CAP_PERCENTAGE
} from './constants.js';
import { 
    player, 
    isResting,
    isGameOver,
    isGhostForm,
    autoRestEnabled,
    setResting,
    setRestInterval,
    restInterval,
    gameSpeedMultiplier,
    enemy
} from './gameState.js';
import { updateUI, logMessage } from './ui.js';
import { pauseCombat, resumeCombat } from './combat.js';

let restTimer = 0;
let restStartTime = 0;

/**
 * Starts the health regeneration system
 */
export function startHealthRegenLoop() {
    setInterval(() => {
        applyHealthRegen();
    }, BASE_HEALTH_REGEN_INTERVAL_MS / gameSpeedMultiplier);
}

/**
 * Applies health regeneration to the player
 */
function applyHealthRegen() {
    if (isGameOver || isGhostForm) return;
    
    if (player.hp < player.maxHp) {
        let healAmount = 0;
        
        if (isResting) {
            // Resting heals for 5% of max HP per second
            healAmount = player.maxHp * HEALTH_REGEN_CAP_PERCENTAGE;
        } else {
            // Normal health regen from stats
            healAmount = player.healthRegen;
        }
        
        player.hp = Math.min(player.hp + healAmount, player.maxHp);
        updateUI();
        
        // Check if resting should end
        if (isResting && player.hp >= player.maxHp) {
            endRest();
        }
    }
    
    // Check for auto-rest (only when not in combat)
    if (autoRestEnabled && !isResting && !isGhostForm && !enemy) {
        const hpPercentage = player.hp / player.maxHp;
        if (hpPercentage <= REST_HP_THRESHOLD) {
            startRest();
        }
    }
}

/**
 * Starts resting
 */
export function startRest() {
    if (isResting || isGameOver || isGhostForm) return;
    
    // Prevent resting during combat
    if (enemy && enemy.hp > 0) {
        logMessage('You cannot rest while in combat!');
        return;
    }
    
    const hpPercentage = player.hp / player.maxHp;
    if (hpPercentage >= REST_ENTRY_HP_THRESHOLD) {
        logMessage('You are too healthy to rest right now.');
        return;
    }
    
    setResting(true);
    pauseCombat();
    
    logMessage('You begin resting to recover health...');
    
    restStartTime = Date.now();
    startRestCountdown();
    updateUI();
}

/**
 * Forces rest regardless of HP threshold
 */
export function forceRest() {
    if (isResting || isGameOver || isGhostForm) return;
    
    // Allow force rest during combat only if HP is at or below 85%
    if (enemy && enemy.hp > 0) {
        const hpPercentage = player.hp / player.maxHp;
        if (hpPercentage > REST_ENTRY_HP_THRESHOLD) {
            logMessage('You cannot rest while in combat at high health!');
            return;
        }
    }
    
    setResting(true);
    pauseCombat();
    
    logMessage('You force yourself to rest...');
    
    restStartTime = Date.now();
    startRestCountdown();
    updateUI();
}

/**
 * Ends resting
 */
export function endRest() {
    if (!isResting) return;
    
    setResting(false);
    
    if (restInterval) {
        clearInterval(restInterval);
        setRestInterval(null);
    }
    
    logMessage('You finish resting and feel refreshed!');
    
    // If no enemy exists (because we were resting after defeating one), spawn next enemy
    if (!enemy || enemy.hp <= 0) {
        import('./gameState.js').then(gameModule => {
            gameModule.setEnemySpawnPending(true);
            updateUI(); // Update UI to show spawning state
        });
        
        setTimeout(() => {
            import('./gameState.js').then(gameModule => {
                gameModule.setEnemySpawnPending(false);
            });
            import('./enemySystem.js').then(module => {
                module.spawnNextEnemy();
            });
        }, 1000); // Short delay after rest ends
    } else {
        // Resume combat if there's an enemy
        if (!isGhostForm && !isGameOver) {
            resumeCombat();
        }
    }
    
    updateUI();
}

/**
 * Checks if auto-rest should trigger after combat ends
 */
export function checkAutoRestAfterCombat() {
    if (!autoRestEnabled || isResting || isGhostForm || isGameOver) return;
    
    const hpPercentage = player.hp / player.maxHp;
    if (hpPercentage <= REST_HP_THRESHOLD) {
        startRest();
        return true; // Indicate that rest was started
    }
    return false; // No rest needed
}

/**
 * Starts the rest countdown timer
 */
function startRestCountdown() {
    const intervalId = setInterval(() => {
        if (!isResting) {
            clearInterval(intervalId);
            return;
        }
        
        updateUI(); // This will update the rest timer display
        
        // Check if fully healed
        if (player.hp >= player.maxHp) {
            endRest();
        }
    }, REST_UPDATE_INTERVAL_MS);
    
    setRestInterval(intervalId);
}

/**
 * Gets the remaining rest time
 * @returns {number} Time remaining in seconds
 */
export function getRestTimeRemaining() {
    if (!isResting) return 0;
    
    const hpToHeal = player.maxHp - player.hp;
    const healPerSecond = player.maxHp * HEALTH_REGEN_CAP_PERCENTAGE;
    
    if (healPerSecond <= 0) return 0;
    
    return hpToHeal / healPerSecond;
}

/**
 * Toggles auto-rest setting
 * @param {boolean} enabled - Whether auto-rest should be enabled
 */
export function setAutoRest(enabled) {
    autoRestEnabled = enabled;
    logMessage(`Auto-rest ${enabled ? 'enabled' : 'disabled'}.`);
}

/**
 * Checks if player can rest
 * @returns {boolean} True if player can rest
 */
export function canRest() {
    if (isResting || isGameOver || isGhostForm) return false;
    
    const hpPercentage = player.hp / player.maxHp;
    return hpPercentage < REST_ENTRY_HP_THRESHOLD;
}
