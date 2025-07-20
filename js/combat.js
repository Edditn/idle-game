// Combat System
import { 
    BASE_PLAYER_ATTACK_INTERVAL_MS,
    BASE_ENEMY_ATTACK_INTERVAL_MS,
    BASE_PLAYER_MISS_CHANCE,
    ARMOR_K_VALUE,
    MAX_LEVEL,
    ENEMY_SPAWN_DELAY_MS
} from './constants.js';
import { 
    player, 
    enemy, 
    gameSpeedMultiplier,
    isGameOver,
    isGhostForm,
    isResting,
    playerAttackTimeoutId,
    enemyAttackTimeoutId,
    setPlayerAttackTimeoutId,
    setEnemyAttackTimeoutId,
    playerAttackStartTime,
    enemyAttackStartTime,
    setPlayerAttackStartTime,
    setEnemyAttackStartTime
} from './gameState.js';
import { domElements } from './domElements.js';
import { updateUI, showCombatText, logMessage } from './ui.js';
import { clamp } from './utils.js';

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
 * Stops all combat timers
 */
export function stopCombat() {
    if (playerAttackTimeoutId) {
        clearTimeout(playerAttackTimeoutId);
        setPlayerAttackTimeoutId(null);
    }
    if (enemyAttackTimeoutId) {
        clearTimeout(enemyAttackTimeoutId);
        setEnemyAttackTimeoutId(null);
    }
}

/**
 * Starts combat between player and enemy
 */
export function startCombat() {
    if (isGameOver || isGhostForm) return;
    
    // Stop any existing combat first to prevent overlapping timers
    stopCombat();
    
    // Start attack cycles
    startPlayerAttackCycle();
    startEnemyAttackCycle();
    
    updateUI();
}

/**
 * Starts the player's attack cycle
 */
function startPlayerAttackCycle() {
    if (isGameOver || isGhostForm || isResting || !enemy || enemy.hp <= 0) return;
    
    const baseInterval = BASE_PLAYER_ATTACK_INTERVAL_MS;
    const hasteMultiplier = 1 - (player.haste / 100);
    const actualInterval = Math.max(100, baseInterval * hasteMultiplier / gameSpeedMultiplier);
    
    setPlayerAttackStartTime(Date.now());
    
    const timeoutId = setTimeout(() => {
        executePlayerAttack();
        // Only restart cycle if combat should continue
        if (!isGameOver && !isGhostForm && !isResting && enemy && enemy.hp > 0) {
            startPlayerAttackCycle(); // Restart cycle
        }
    }, actualInterval);
    
    setPlayerAttackTimeoutId(timeoutId);
    
    // Start attack progress bar animation
    updatePlayerAttackProgress();
}

/**
 * Starts the enemy's attack cycle
 */
function startEnemyAttackCycle() {
    if (isGameOver || isGhostForm || !enemy || enemy.hp <= 0) return;
    
    const baseInterval = BASE_ENEMY_ATTACK_INTERVAL_MS;
    const actualInterval = baseInterval / gameSpeedMultiplier;
    
    setEnemyAttackStartTime(Date.now());
    
    const timeoutId = setTimeout(() => {
        executeEnemyAttack();
        // Only restart cycle if combat should continue
        if (!isGameOver && !isGhostForm && enemy && enemy.hp > 0 && player.hp > 0) {
            startEnemyAttackCycle(); // Restart cycle
        }
    }, actualInterval);
    
    setEnemyAttackTimeoutId(timeoutId);
    
    // Start attack progress bar animation
    updateEnemyAttackProgress();
}

/**
 * Executes a player attack
 */
function executePlayerAttack() {
    if (isGameOver || isGhostForm || isResting || enemy.hp <= 0) return;
    
    // Check for miss - scale with level difference
    let missChance = BASE_PLAYER_MISS_CHANCE;
    
    // If enemy is higher level than player, increase miss chance
    if (enemy.level > player.level) {
        const levelDifference = enemy.level - player.level;
        
        if (player.level < MAX_LEVEL) {
            // Before max level: Very punishing scaling
            if (levelDifference >= 10) {
                missChance = 90; // 90% miss for 10+ level difference
            } else {
                // Progressive scaling up to 10 levels
                // 1-3 levels: manageable, 4-9 levels: increasingly difficult
                const scalingRates = [0, 2, 5, 10, 20, 35, 50, 65, 75, 85]; // Miss % per level
                missChance = 1 + scalingRates[levelDifference - 1] || 90;
            }
        } else {
            // At max level: Accuracy based on gear stats
            // Use sum of critical chance + haste + mastery as "accuracy stats" to reduce miss chance
            const accuracyFromStats = player.criticalChance + player.haste + player.mastery;
            
            // Base miss for high level enemies, reduced by accuracy stats
            let baseMissForHighLevel = Math.min(levelDifference * 2, 95); // 2% per level, cap at 95%
            
            // Reduce miss chance based on accuracy stats (up to 70% reduction)
            // Scale down since we're using sum instead of average
            const missReduction = Math.min(accuracyFromStats * 0.35, 70);
            missChance = Math.max(baseMissForHighLevel - missReduction, 5); // Minimum 5% miss
        }
    }
    
    if (Math.random() * 100 < missChance) {
        showCombatText("Miss!", false, domElements.enemyHpBarFill, false, true);
        logMessage(`${player.name} missed!`);
        return;
    }
    
    // Calculate damage
    let damage = player.attack;
    let isCritical = false;
    let isMasteryProc = false;
    
    // Apply damage variance (20% variance, min 80% of base for player)
    damage = applyDamageVariance(damage, 0.2, 0.8);
    
    // Apply mastery as damage multiplier (mastery% becomes additional damage)
    damage *= (1 + player.mastery / 100);
    
    // Check for critical hit
    if (Math.random() * 100 < player.criticalChance) {
        isCritical = true;
        damage *= 2; // Critical hits do double damage
    }
    
    // Apply damage
    enemy.hp = Math.max(0, enemy.hp - damage);
    
    // Show combat text
    showCombatText(damage, isCritical, domElements.enemyHpBarFill, false, false);
    
    // Log the attack
    const critText = isCritical ? " (Critical!)" : "";
    logMessage(`You Deal: ${Math.floor(damage)}${critText}`);
    
    updateUI();
    
    // Check if enemy is defeated
    if (enemy.hp <= 0) {
        handleEnemyDefeat();
    }
}

/**
 * Executes an enemy attack
 */
function executeEnemyAttack() {
    if (isGameOver || isGhostForm || player.hp <= 0 || enemy.hp <= 0) return;
    
    // Calculate damage with armor reduction
    let damage = enemy.attack;
    
    // Apply damage variance to enemy attack (20% variance, min 100% of base for enemy)
    damage = applyDamageVariance(damage, 0.2, 1);
    
    // Apply armor damage reduction using K-value formula
    const damageReduction = player.defense / (player.defense + ARMOR_K_VALUE);
    const actualDamageReduction = Math.min(damageReduction, 0.90); // Cap at 90%
    damage = damage * (1 - actualDamageReduction);
    
    // Apply damage
    player.hp = Math.max(0, player.hp - damage);
    
    // Show combat text
    showCombatText(damage, false, domElements.playerHpBarFill, true, false);
    
    // Log the attack
    logMessage(`Damage Taken: ${Math.floor(damage)}`);
    
    updateUI();
    
    // Check if player is defeated
    if (player.hp <= 0) {
        handlePlayerDefeat();
    }
}

/**
 * Handles enemy defeat
 */
function handleEnemyDefeat() {
    // Stop combat timers
    stopCombat();
    
    // Award XP
    player.xp += enemy.xpReward;
    logMessage(`${enemy.name} defeated! You gained ${enemy.xpReward} XP!`);
    
    // Check for level up
    if (player.xp >= player.xpToNextLevel && player.level < 100) {
        // Level up logic will be handled by progression system
        // For now, just import and call it
        import('./progression.js').then(module => {
            module.levelUp();
        });
    }
    
    // Drop loot
    import('./loot.js').then(module => {
        module.rollForLoot(enemy.level);
    });
    
    // Check if player should auto-rest before spawning next enemy
    import('./healthSystem.js').then(healthModule => {
        const shouldRest = healthModule.checkAutoRestAfterCombat();
        
        if (shouldRest) {
            // Player started resting - enemy will spawn when rest ends
            logMessage('Auto-rest activated. Next enemy will appear after rest.');
        } else {
            // No rest needed - spawn next enemy after normal delay
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
            }, ENEMY_SPAWN_DELAY_MS / gameSpeedMultiplier);
        }
    });
    
    updateUI();
}

/**
 * Handles player defeat
 */
function handlePlayerDefeat() {
    // Stop combat timers
    stopCombat();
    
    logMessage(`${player.name} has been defeated!`);
    
    // Enter ghost form
    import('./ghostForm.js').then(module => {
        module.enterGhostForm();
    });
    
    updateUI();
}

/**
 * Updates player attack progress bar
 */
function updatePlayerAttackProgress() {
    if (isGameOver || isGhostForm || isResting) return;
    
    const baseInterval = BASE_PLAYER_ATTACK_INTERVAL_MS;
    const hasteMultiplier = 1 - (player.haste / 100);
    const actualInterval = Math.max(100, baseInterval * hasteMultiplier / gameSpeedMultiplier);
    
    const startTime = playerAttackStartTime;
    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    const progress = Math.min(100, (elapsed / actualInterval) * 100);
    
    if (domElements.playerAttackProgressFill) {
        domElements.playerAttackProgressFill.style.width = `${progress}%`;
    }
    
    if (domElements.playerAttackTimerText) {
        const remaining = Math.max(0, (actualInterval - elapsed) / 1000);
        domElements.playerAttackTimerText.textContent = `${remaining.toFixed(1)}s`;
    }
    
    if (progress < 100) {
        requestAnimationFrame(() => updatePlayerAttackProgress());
    }
}

/**
 * Updates enemy attack progress bar
 */
function updateEnemyAttackProgress() {
    if (isGameOver || isGhostForm) return;
    
    const actualInterval = BASE_ENEMY_ATTACK_INTERVAL_MS / gameSpeedMultiplier;
    
    const startTime = enemyAttackStartTime;
    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    const progress = Math.min(100, (elapsed / actualInterval) * 100);
    
    if (domElements.enemyAttackProgressFill) {
        domElements.enemyAttackProgressFill.style.width = `${progress}%`;
    }
    
    if (domElements.enemyAttackTimerText) {
        const remaining = Math.max(0, (actualInterval - elapsed) / 1000);
        domElements.enemyAttackTimerText.textContent = `${remaining.toFixed(1)}s`;
    }
    
    if (progress < 100) {
        requestAnimationFrame(() => updateEnemyAttackProgress());
    }
}

/**
 * Pauses combat (for resting)
 */
export function pauseCombat() {
    stopCombat();
}

/**
 * Resumes combat (after resting)
 */
export function resumeCombat() {
    if (!isResting && !isGhostForm && !isGameOver && enemy.hp > 0) {
        startCombat();
    }
}
