// DOM Element References
export const domElements = {
    // Character and Enemy sections
    charSectionTitle: document.getElementById('char-section-title'),
    enemySectionTitle: document.getElementById('enemy-section-title'),
    
    // HP Bars and overlays
    playerHpBarFill: document.getElementById('player-hp-bar-fill'),
    playerHpTextOverlay: document.getElementById('player-hp-text-overlay'),
    enemyHpBarFill: document.getElementById('enemy-hp-bar-fill'),
    enemyHpTextOverlay: document.getElementById('enemy-hp-text-overlay'),
    
    // Zone and combat displays
    currentZoneDisplay: document.getElementById('current-zone-display'),
    mainCurrentZoneDisplay: document.getElementById('main-current-zone-display'),
    enemyAttackPowerDisplay: document.getElementById('enemy-attack-power-display'),
    
    // Log and progress bars
    logArea: document.getElementById('log-area'),
    playerAttackProgressFill: document.getElementById('player-attack-progress-fill'),
    playerAttackTimerText: document.getElementById('player-attack-timer-text'),
    enemyAttackProgressFill: document.getElementById('enemy-attack-progress-fill'),
    enemyAttackTimerText: document.getElementById('enemy-attack-timer-text'),
    
    // XP system
    xpProgressFill: document.getElementById('xp-progress-fill'),
    xpTextOverlay: document.getElementById('xp-text-overlay'),
    
    // Overlays and modals
    gameOverOverlay: document.getElementById('gameOverOverlay'),
    ghostFormOverlay: document.getElementById('ghostFormOverlay'),
    ghostFormProgressFill: document.getElementById('ghost-form-progress-fill'),
    ghostFormTimerText: document.getElementById('ghost-form-timer-text'),
    confirmationModalOverlay: document.getElementById('confirmationModalOverlay'),
    confirmationModalTitle: document.getElementById('confirmationModalTitle'),
    confirmationModalMessage: document.getElementById('confirmationModalMessage'),
    
    // Inventory and equipment
    inventoryList: document.getElementById('inventory-list'),
    equippedList: document.getElementById('equipped-list'),
    itemTooltip: document.getElementById('item-tooltip'),
    goldDisplay: document.getElementById('gold-display'),
    
    // Vendor system
    vendorContainer: document.getElementById('vendor-container'),
    vendorTitle: document.getElementById('vendor-title'),
    vendorList: document.getElementById('vendor-items-list'),
    refreshVendorBtn: document.getElementById('refreshVendorBtn'),
    
    // Stats display
    statMaxHealth: document.getElementById('stat-max-health'),
    statHealthRegen: document.getElementById('stat-health-regen'),
    statDamage: document.getElementById('stat-damage'),
    statArmor: document.getElementById('stat-armor'),
    statCriticalChance: document.getElementById('stat-critical-chance'),
    statHaste: document.getElementById('stat-haste'),
    statMastery: document.getElementById('stat-mastery'),
    
    // Combat and game container
    combatTextOverlay: document.getElementById('combat-text-overlay'),
    gameContainer: document.querySelector('.game-container'),
    
    // Settings and controls
    settingsButton: document.getElementById('settingsButton'),
    settingsOverlay: document.getElementById('settingsOverlay'),
    closeSettingsButton: document.getElementById('closeSettingsButton'),
    volumeControl: document.getElementById('volumeControl'),
    darkModeToggle: document.getElementById('darkModeToggle'),
    helpButton: document.getElementById('helpButton'),
    helpOverlay: document.getElementById('helpOverlay'),
    
    // Buttons
    restartGameBtn: document.getElementById('restartGameBtn'),
    resetGameFromSettingsBtn: document.getElementById('resetGameFromSettingsBtn'),
    saveGameBtn: document.getElementById('saveGameBtn'),
    saveGameFromSettingsBtn: document.getElementById('saveGameFromSettingsBtn'),
    loadGameBtn: document.getElementById('loadGameBtn'),
    loadGameFromSettingsBtn: document.getElementById('loadGameFromSettingsBtn'),
    loadFileInput: document.getElementById('loadFileInput'),
    forceRestBtn: document.getElementById('forceRestBtn'),
    sellAllBtn: document.getElementById('sellAllBtn'),
    sortInventoryBtn: document.getElementById('sortInventoryBtn'),
    confirmButton: document.getElementById('confirmButton'),
    cancelButton: document.getElementById('cancelButton'),
    prevZoneBtn: document.getElementById('prevZoneBtn'),
    nextZoneBtn: document.getElementById('nextZoneBtn'),
    
    // Shardspire floor controls
    shardspireFloorControls: document.getElementById('shardspireFloorControls'),
    floorDownBtn: document.getElementById('floorDownBtn'),
    floorUpBtn: document.getElementById('floorUpBtn'),
    shardspireFloorDisplay: document.getElementById('shardspireFloorDisplay'),
    shardspireFloorRange: document.getElementById('shardspireFloorRange'),
    
    // Checkboxes
    autoRestCheckbox: document.getElementById('autoRestCheckbox'),
    autoSellStatsCheckbox: document.getElementById('autoSellStatsCheckbox'),
    autoSellCommonCheckbox: document.getElementById('autoSellCommonCheckbox'),
    autoSellUncommonCheckbox: document.getElementById('autoSellUncommonCheckbox'),
    autoSellRareCheckbox: document.getElementById('autoSellRareCheckbox'),
    
    // Player and enemy info
    playerNameInput: document.getElementById('player-name-input'),
    playerLevelDisplay: document.getElementById('player-level-display'),
    enemyNameDisplay: document.getElementById('enemy-name-display'),
    enemyLevelDisplay: document.getElementById('enemy-level-display'),
    
    // Talents
    talentPointsDisplay: document.getElementById('talent-points-display'),
    spendTalentPointBtn: document.getElementById('spend-talent-point-btn'),
    attackSpeedTalent: document.getElementById('attackSpeedTalent'),
    criticalStrikeTalentBtn: document.getElementById('criticalStrikeTalentBtn'),
    healthRegenTalentBtn: document.getElementById('healthRegenTalentBtn'),
    scalingArmorTalentBtn: document.getElementById('scalingArmorTalentBtn'),
    
    // Game speed controls
    gameSpeedRadios: document.querySelectorAll('input[name="gameSpeed"]')
};

// Helper to get help overlay close button
domElements.helpCloseButton = document.getElementById('helpCloseButton');
