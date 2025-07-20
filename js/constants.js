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
export const BASE_HEALTH_REGEN_INTERVAL_MS = 1000;
export const HEALTH_REGEN_CAP_PERCENTAGE = 0.10; // Increased from 0.05 to 0.10 for 10% cap
export const BASE_PLAYER_MISS_CHANCE = 1;
export const HEALTH_REGEN_STAT_CAP_PERCENTAGE = 0.10; // Increased from 0.05 to 0.10 for 10% cap

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
export const PLAYER_BASE_ATTACK_SCALING_FACTOR = 1.025;

// Item scaling constants
export const WEAPON_ATTACK_SCALING_PER_LEVEL = 8; // Increased from 5 to 8 for better high-level scaling
export const ARMOR_PRIMARY_SCALING_PER_LEVEL = {
    maxHp: 35, // Back to original for proper high-level scaling
    defense: 3, // Back to original for proper high-level scaling
    healthRegen: 1.5 // Reduced from 4.0 to 1.5 - makes health regen gear less powerful early game
};
export const SECONDARY_STAT_SCALING_PER_LEVEL = 15; // Increased from 12 to 15

// Enemy scaling constants
export const ENEMY_HP_BASE = 75;
export const ENEMY_HP_SCALING_FACTOR = 1.0975;
export const ENEMY_ATTACK_BASE = 10;
export const ENEMY_ATTACK_SCALING_FACTOR = 1.080;
export const ENEMY_XP_BASE = 10;
export const ENEMY_XP_REWARD_EXPONENT = 1.07;
