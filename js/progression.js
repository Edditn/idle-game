// Player Progression System
import { 
    MAX_LEVEL,
    PLAYER_BASE_ATTACK_START,
    PLAYER_BASE_ATTACK_SCALING_FACTOR
} from './constants.js';
import { 
    player, 
    talents,
    talentPoints,
    unspentTalentPoints,
    incrementTalentPoints
} from './gameState.js';
import { calculateXpToNextLevel } from './utils.js';
import { updateUI, logMessage } from './ui.js';

/**
 * Handles player leveling up
 */
export function levelUp() {
    if (player.level >= MAX_LEVEL) {
        return; // Already at max level
    }
    
    const oldLevel = player.level;
    player.level++;
    
    // Calculate new base attack
    player.baseAttack = PLAYER_BASE_ATTACK_START * Math.pow(PLAYER_BASE_ATTACK_SCALING_FACTOR, player.level - 1);
    
    // Set new XP requirement
    player.xp = 0;
    player.xpToNextLevel = calculateXpToNextLevel(player.level);
    
    // Award talent points starting at level 10 and then every 2 levels (matches monolithic version)
    if (player.level >= 10 && (player.level - 10) % 2 === 0) {
        incrementTalentPoints();
        logMessage(`Level ${player.level}! You gained a talent point! (${unspentTalentPoints} unspent)`);
    } else {
        logMessage(`Level up! You are now level ${player.level}.`);
    }
    
    // Update player stats to reflect new level
    import('./gameState.js').then(() => {
        // This will be handled by the main game's updatePlayerStats function
        // For now, we'll trigger a UI update
        updateUI();
    });
}

/**
 * Spends a talent point on a specific talent
 * @param {string} talentKey - The key of the talent to upgrade
 * @returns {boolean} True if the talent was successfully upgraded
 */
export function spendTalentPoint(talentKey) {
    const talent = talents[talentKey];
    
    if (!talent) {
        logMessage('Invalid talent!');
        return false;
    }
    
    if (unspentTalentPoints <= 0) {
        logMessage('No talent points available!');
        return false;
    }
    
    if (talent.currentRank >= talent.maxRank) {
        logMessage(`${talent.name} is already at maximum rank!`);
        return false;
    }
    
    // Check talent prerequisites
    if (!checkTalentPrerequisites(talentKey)) {
        logMessage('Prerequisites not met for this talent!');
        return false;
    }
    
    // Spend the point
    talent.currentRank++;
    unspentTalentPoints--;
    
    logMessage(`${talent.name} upgraded to rank ${talent.currentRank}!`);
    
    // Update player stats to reflect new talent bonuses
    import('./gameState.js').then(() => {
        updateUI();
    });
    
    return true;
}

/**
 * Checks if prerequisites are met for a talent
 * @param {string} talentKey - The talent to check
 * @returns {boolean} True if prerequisites are met
 */
function checkTalentPrerequisites(talentKey) {
    // First tier talent (Swift Strikes) - no prerequisites
    if (talentKey === 'attackSpeed') {
        return true;
    }
    
    // Second tier talents - require Swift Strikes to be maxed
    const secondTierTalents = ['criticalStrike', 'healthRegen', 'scalingArmor'];
    if (secondTierTalents.includes(talentKey)) {
        const swiftStrikesMaxed = talents.attackSpeed.currentRank >= talents.attackSpeed.maxRank;
        
        if (!swiftStrikesMaxed) {
            return false;
        }
        
        // Check if another second-tier talent is already being invested in
        let activeSecondRowTalentKey = null;
        for (const key of secondTierTalents) {
            if (talents[key].currentRank > 0 && talents[key].currentRank < talents[key].maxRank) {
                activeSecondRowTalentKey = key;
                break;
            }
        }
        
        // If there's an active talent and it's not this one, can't invest
        if (activeSecondRowTalentKey && activeSecondRowTalentKey !== talentKey) {
            return false;
        }
        
        return true;
    }
    
    return false;
}

/**
 * Gets talent information for UI display
 * @param {string} talentKey - The talent to get info for
 * @returns {object} Talent display information
 */
export function getTalentInfo(talentKey) {
    const talent = talents[talentKey];
    if (!talent) return null;
    
    return {
        name: talent.name,
        currentRank: talent.currentRank,
        maxRank: talent.maxRank,
        bonusPerRank: talent.bonusPerRank,
        canUpgrade: unspentTalentPoints > 0 && 
                   talent.currentRank < talent.maxRank && 
                   checkTalentPrerequisites(talentKey),
        prerequisitesMet: checkTalentPrerequisites(talentKey)
    };
}

/**
 * Gets all talent information for UI
 * @returns {object} All talent information
 */
export function getAllTalentInfo() {
    const talentKeys = Object.keys(talents);
    const talentInfo = {};
    
    for (const key of talentKeys) {
        talentInfo[key] = getTalentInfo(key);
    }
    
    return talentInfo;
}

/**
 * Resets all talents (for respec)
 * @returns {number} Number of talent points refunded
 */
export function resetTalents() {
    let refundedPoints = 0;
    
    for (const talentKey in talents) {
        refundedPoints += talents[talentKey].currentRank;
        talents[talentKey].currentRank = 0;
    }
    
    unspentTalentPoints += refundedPoints;
    
    logMessage(`Talents reset! Refunded ${refundedPoints} talent points.`);
    
    // Update player stats to reflect talent reset
    import('./gameState.js').then(() => {
        updateUI();
    });
    
    return refundedPoints;
}
