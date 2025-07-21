// Enemy System
import { 
    ENEMY_HP_BASE,
    ENEMY_HP_SCALING_FACTOR,
    ENEMY_ATTACK_BASE,
    ENEMY_ATTACK_SCALING_FACTOR,
    ENEMY_XP_BASE,
    ENEMY_XP_REWARD_EXPONENT,
    ENEMY_LEVEL_RANGE,
    DYNAMIC_SCALING_THRESHOLDS
} from './constants.js';
import { levelZones } from './gameData.js';
import { 
    player, 
    enemy, 
    currentZone,
    setCurrentZone,
    isGameOver,
    shardspireFloor 
} from './gameState.js';
import { getRandomElement } from './utils.js';
import { updateUI, logMessage } from './ui.js';
import { startCombat } from './combat.js';

/**
 * Gets dynamic scaling multipliers based on enemy level
 * @param {number} level - The enemy level
 * @returns {object} Object with hpMultiplier and attackMultiplier
 */
function getDynamicScalingMultipliers(level) {
    const range = DYNAMIC_SCALING_THRESHOLDS.ranges.find(
        r => level >= r.minLevel && level <= r.maxLevel
    );
    
    if (range) {
        return {
            hpMultiplier: range.hpMultiplier,
            attackMultiplier: range.attackMultiplier
        };
    }
    
    // Default to last range if level exceeds all ranges
    const lastRange = DYNAMIC_SCALING_THRESHOLDS.ranges[DYNAMIC_SCALING_THRESHOLDS.ranges.length - 1];
    return {
        hpMultiplier: lastRange.hpMultiplier,
        attackMultiplier: lastRange.attackMultiplier
    };
}

/**
 * Spawns the next enemy
 */
export function spawnNextEnemy() {
    if (isGameOver) return;
    
    // Calculate enemy level based on both zone and player level (except Shardspire)
    let minEnemyLevel, maxEnemyLevel;
    
    if (currentZone.name === 'Shardspire') {
        // Shardspire: Floor-based levels
        // Floor 1: 100-105, Floor 2: 105-110, ..., Floor 20: 195-200
        const floorBaseLevel = 95 + (shardspireFloor * 5);
        minEnemyLevel = floorBaseLevel;
        maxEnemyLevel = floorBaseLevel + 5;
    } else {
        // All other zones: Constrained by both zone AND player level ±2
        const playerMinLevel = Math.max(1, player.level - ENEMY_LEVEL_RANGE);
        const playerMaxLevel = player.level + ENEMY_LEVEL_RANGE;
        
        // Use the intersection of zone range and player range
        minEnemyLevel = Math.max(currentZone.minLevel, playerMinLevel);
        maxEnemyLevel = Math.min(currentZone.maxLevel, playerMaxLevel);
        
        // Ensure min doesn't exceed max (if player is too far from zone range)
        if (minEnemyLevel > maxEnemyLevel) {
            // If no overlap, default to zone range
            minEnemyLevel = currentZone.minLevel;
            maxEnemyLevel = currentZone.maxLevel;
        }
    }
    
    enemy.level = Math.floor(Math.random() * (maxEnemyLevel - minEnemyLevel + 1)) + minEnemyLevel;
    
    // Get dynamic scaling multipliers for this level
    const scaling = getDynamicScalingMultipliers(enemy.level);
    
    // Calculate enemy stats based on level with dynamic scaling
    const baseHp = ENEMY_HP_BASE * Math.pow(ENEMY_HP_SCALING_FACTOR, enemy.level - 1);
    enemy.maxHp = Math.floor(baseHp * scaling.hpMultiplier);
    enemy.hp = enemy.maxHp;
    
    const baseAttack = ENEMY_ATTACK_BASE * Math.pow(ENEMY_ATTACK_SCALING_FACTOR, enemy.level - 1);
    enemy.attack = Math.floor(baseAttack * scaling.attackMultiplier);
    
    enemy.xpReward = Math.floor(ENEMY_XP_BASE * Math.pow(ENEMY_XP_REWARD_EXPONENT, enemy.level - 1));
    
    // Get enemy name from current zone (player chooses zone)
    enemy.name = getRandomElement(currentZone.enemyNames);
    
    updateUI();
    
    // Start combat
    startCombat();
}

/**
 * Updates the current zone based on level
 * @param {number} level - The level to check zones for
 */
function updateCurrentZone(level) {
    for (const zone of levelZones) {
        if (level >= zone.minLevel && level <= zone.maxLevel) {
            if (currentZone !== zone) {
                setCurrentZone(zone);
                logMessage(`You have entered ${zone.name}!`);
            }
            break;
        }
    }
}

/**
 * Gets zone for a specific level
 * @param {number} level - The level to get zone for
 * @returns {object} The zone object
 */
export function getZoneForLevel(level) {
    for (const zone of levelZones) {
        if (level >= zone.minLevel && level <= zone.maxLevel) {
            return zone;
        }
    }
    // Return last zone if level is higher than all defined zones
    return levelZones[levelZones.length - 1];
}

/**
 * Changes to previous zone
 */
export function changeToPreviousZone() {
    const currentIndex = levelZones.indexOf(currentZone);
    if (currentIndex > 0) {
        const newZone = levelZones[currentIndex - 1];
        setCurrentZone(newZone);
        logMessage(`You moved to ${newZone.name}!`);
        
        // Only spawn enemy if not resting
        import('./gameState.js').then(gameModule => {
            if (!gameModule.isResting) {
                spawnEnemyFromCurrentZone();
            }
        });
        updateUI();
    }
}

/**
 * Changes to next zone
 */
export function changeToNextZone() {
    const currentIndex = levelZones.indexOf(currentZone);
    if (currentIndex < levelZones.length - 1) {
        const newZone = levelZones[currentIndex + 1];
        setCurrentZone(newZone);
        logMessage(`You moved to ${newZone.name}!`);
        
        // Only spawn enemy if not resting
        import('./gameState.js').then(gameModule => {
            if (!gameModule.isResting) {
                spawnEnemyFromCurrentZone();
            }
        });
        updateUI();
    }
}

/**
 * Spawns an enemy from the current zone
 */
function spawnEnemyFromCurrentZone() {
    // Calculate level based on both zone and player level (except Shardspire)
    let minLevel, maxLevel;
    
    if (currentZone.name === 'Shardspire') {
        // Shardspire: Floor-based levels
        const floorBaseLevel = 95 + (shardspireFloor * 5);
        minLevel = floorBaseLevel;
        maxLevel = floorBaseLevel + 5;
    } else {
        // All other zones: Constrained by both zone AND player level ±2
        const playerMinLevel = Math.max(1, player.level - ENEMY_LEVEL_RANGE);
        const playerMaxLevel = player.level + ENEMY_LEVEL_RANGE;
        
        // Use the intersection of zone range and player range
        minLevel = Math.max(currentZone.minLevel, playerMinLevel);
        maxLevel = Math.min(currentZone.maxLevel, playerMaxLevel);
        
        // Ensure min doesn't exceed max (if player is too far from zone range)
        if (minLevel > maxLevel) {
            // If no overlap, default to zone range
            minLevel = currentZone.minLevel;
            maxLevel = currentZone.maxLevel;
        }
    }
    
    enemy.level = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;
    
    // Get dynamic scaling multipliers for this level
    const scaling = getDynamicScalingMultipliers(enemy.level);
    
    // Calculate stats with dynamic scaling
    const baseHp = ENEMY_HP_BASE * Math.pow(ENEMY_HP_SCALING_FACTOR, enemy.level - 1);
    enemy.maxHp = Math.floor(baseHp * scaling.hpMultiplier);
    enemy.hp = enemy.maxHp;
    
    const baseAttack = ENEMY_ATTACK_BASE * Math.pow(ENEMY_ATTACK_SCALING_FACTOR, enemy.level - 1);
    enemy.attack = Math.floor(baseAttack * scaling.attackMultiplier);
    
    enemy.xpReward = Math.floor(ENEMY_XP_BASE * Math.pow(ENEMY_XP_REWARD_EXPONENT, enemy.level - 1));
    
    // Get name from zone
    enemy.name = getRandomElement(currentZone.enemyNames);
    
    // Start combat
    startCombat();
}

/**
 * Checks if player can access a zone
 * @param {object} zone - The zone to check
 * @returns {boolean} True if player can access the zone
 */
export function canAccessZone(zone) {
    // Player can access zones up to their level + some buffer
    return player.level >= zone.minLevel - 5;
}

/**
 * Gets all zones player can access
 * @returns {Array} Array of accessible zones
 */
export function getAccessibleZones() {
    return levelZones.filter(zone => canAccessZone(zone));
}
