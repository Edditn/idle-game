// Game Constants
export const ARMOR_K_VALUE = 2500; // Increased from 1500 to make armor harder to cap
export const CRIT_K_VALUE = 2000; // Increased from 600 to make much harder to cap
export const HASTE_K_VALUE = 3000; // Increased significantly to make 75% cap very hard to reach
export const MASTERY_K_VALUE = 3000; // Increased from 1000 to make much harder to cap

export const DEFENSE_POWER_WEIGHTS = {
    maxHp: 0.05,
    defense: 1,
    healthRegen: 10
};

// Base game intervals
export const BASE_PLAYER_ATTACK_INTERVAL_MS = 2000;
export const BASE_ENEMY_ATTACK_INTERVAL_MS = 2935;
export const BASE_HEALTH_REGEN_INTERVAL_MS = 1467; // Half of enemy attack interval (2935 / 2)
export const HEALTH_REGEN_CAP_PERCENTAGE = 0.06; // Reduced to 6% of max HP per tick for more balanced healing
export const BASE_PLAYER_MISS_CHANCE = 1;
export const HEALTH_REGEN_STAT_CAP_PERCENTAGE = 0.06; // Reduced to 6% to match the new cap

// Ghost form and rest constants
export const GHOST_FORM_DURATION_MS = 45000;
export const GHOST_FORM_UPDATE_INTERVAL_MS = 100;
export const REST_UPDATE_INTERVAL_MS = 100;
export const REST_HP_THRESHOLD = 0.35;
export const REST_ENTRY_HP_THRESHOLD = 0.85;

// Level and enemy constants
export const MAX_LEVEL = 100;
export const ENEMY_LEVEL_RANGE = 2;
export const ENEMY_SPAWN_DELAY_MS = 2000;

// Player scaling constants
export const PLAYER_INITIAL_BASE_MAX_HP = 200;
export const PLAYER_BASE_ATTACK_START = 10;
export const PLAYER_BASE_ATTACK_SCALING_FACTOR = 1.025; // Reverted back to original value

// Item scaling constants
export const WEAPON_ATTACK_SCALING_PER_LEVEL = 5; // Reverted back to original balance
export const ARMOR_PRIMARY_SCALING_PER_LEVEL = {
    maxHp: 20, // Reduced from 35 to 20 for better low-level balance
    defense: 2, // Reduced from 3 to 2 for better low-level balance
    healthRegen: 0.5 // Reduced from 1.5 to 0.8 for more balanced healing with rarity bonuses
};
export const SECONDARY_STAT_SCALING_PER_LEVEL = 8; // Reduced from 15 to 8 for better low-level balance

// Enemy scaling constants
export const ENEMY_HP_BASE = 75;
export const ENEMY_HP_SCALING_FACTOR = 1.15; // Increased to 1.15 for 15% HP growth per level
export const ENEMY_ATTACK_BASE = 10;
export const ENEMY_ATTACK_SCALING_FACTOR = 1.12; // Increased to 1.12 for 12% attack growth per level

// Dynamic scaling thresholds and multipliers
export const DYNAMIC_SCALING_THRESHOLDS = {
    // Level ranges with different scaling intensities
    ranges: [
        { minLevel: 1, maxLevel: 29, hpMultiplier: 1.0, attackMultiplier: 1.0 },     // Normal scaling
        { minLevel: 30, maxLevel: 70, hpMultiplier: 1.25, attackMultiplier: 1.25 },  // 80% more HP, 60% more attack - challenging but fair
        { minLevel: 71, maxLevel: 100, hpMultiplier: 1.1, attackMultiplier: 1.15 }  // Slightly buffed endgame
    ]
};
export const ENEMY_XP_BASE = 8;
export const ENEMY_XP_REWARD_EXPONENT = 1.07;
