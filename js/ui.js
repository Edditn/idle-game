// UI Management
import { domElements } from './domElements.js';
import { player, enemy, currentZone, talents, unspentTalentPoints, isResting, inventory, isEnemySpawnPending, shardspireFloor } from './gameState.js';
import { rarities } from './gameData.js';
import { 
    ARMOR_K_VALUE, 
    CRIT_K_VALUE, 
    HASTE_K_VALUE, 
    MASTERY_K_VALUE,
    HEALTH_REGEN_STAT_CAP_PERCENTAGE,
    MAX_LEVEL 
} from './constants.js';
import { formatNumber, calculatePercentage } from './utils.js';

/**
 * Adds a new message to the battle log.
 * @param {string} message - The message to add to the log.
 */
export function logMessage(message) {
  const logEntry = document.createElement('div');
  logEntry.textContent = message;
  logEntry.style.borderBottom = '1px solid #374151'; // Add line separator
  logEntry.style.paddingBottom = '2px';
  logEntry.style.marginBottom = '2px';
  domElements.logArea.appendChild(logEntry);
  domElements.logArea.scrollTop = domElements.logArea.scrollHeight;
}

/**
 * Updates the gold display on the UI.
 */
export function updateGoldUI() {
  domElements.goldDisplay.textContent = `GOLD: ${player.gold}`;
}

/**
 * Updates the main UI elements
 */
export function updateUI() {
  updatePlayerInfo();
  updateEnemyInfo();
  updateBars();
  updateStats();
  updateZoneInfo();
  updateTalentDisplay();
  // Only update inventory/equipment if forced or on initial load
  // This prevents flickering during frequent combat updates
}

/**
 * Updates player name and level display
 */
function updatePlayerInfo() {
  // Only update the input value if it's not currently focused
  if (!domElements.playerNameInput.matches(':focus')) {
    domElements.playerNameInput.value = player.name;
  }
  domElements.playerLevelDisplay.textContent = `Lvl.${player.level}`;
}

/**
 * Updates enemy name and level display
 */
function updateEnemyInfo() {
  domElements.enemyNameDisplay.textContent = enemy.name;
  domElements.enemyLevelDisplay.textContent = `Lvl.${enemy.level}`;
  
  // Calculate miss chance for display
  let missChance = 1; // BASE_PLAYER_MISS_CHANCE
  if (enemy.level > player.level) {
    const levelDifference = enemy.level - player.level;
    
    if (player.level < MAX_LEVEL) {
      // Before max level: Very punishing scaling
      if (levelDifference >= 10) {
        missChance = 90; // 90% miss for 10+ level difference
      } else {
        // Progressive scaling up to 10 levels
        const scalingRates = [0, 2, 5, 10, 20, 35, 50, 65, 75, 85]; // Miss % per level
        missChance = 1 + scalingRates[levelDifference - 1] || 90;
      }
    } else {
      // At max level: Accuracy based on gear stats
      const accuracyFromStats = player.criticalChance + player.haste + player.mastery;
      
      // Base miss for high level enemies, reduced by accuracy stats
      let baseMissForHighLevel = Math.min(levelDifference * 2, 95); // 2% per level, cap at 95%
      
      // Reduce miss chance based on accuracy stats (up to 70% reduction)
      // Scale down since we're using sum instead of average
      const missReduction = Math.min(accuracyFromStats * 0.35, 70);
      missChance = Math.max(baseMissForHighLevel - missReduction, 5); // Minimum 5% miss
    }
  }
  
  // Show attack power and miss chance if > 1%
  if (missChance > 1) {
    let displayText = `AP: ${Math.floor(enemy.attack)} | Miss: ${missChance.toFixed(1)}%`;
    
    // At max level, show accuracy bonus
    if (player.level >= MAX_LEVEL && enemy.level >= MAX_LEVEL) {
      const accuracyFromStats = player.criticalChance + player.haste + player.mastery;
      const missReduction = Math.min(accuracyFromStats * 0.35, 70);
      if (missReduction > 0) {
        displayText += ` (Acc: -${missReduction.toFixed(1)}%)`;
      }
    }
    
    domElements.enemyAttackPowerDisplay.textContent = displayText;
  } else {
    domElements.enemyAttackPowerDisplay.textContent = `AP: ${Math.floor(enemy.attack)}`;
  }
  
  // Show rarity bonus for high-level enemies
  if (enemy.level > MAX_LEVEL) {
    const levelDifference = enemy.level - MAX_LEVEL;
    const effectiveLevels = levelDifference <= 20 ? levelDifference : 20 + (levelDifference - 20) * 0.5;
    const rarityBonusPercent = Math.min(effectiveLevels * 2, 80);
    
    // Add rarity bonus indicator to enemy level display
    domElements.enemyLevelDisplay.textContent += ` (+${rarityBonusPercent.toFixed(0)}% Rarity)`;
    domElements.enemyLevelDisplay.style.color = '#f6ad55'; // Orange color for bonus
  } else {
    domElements.enemyLevelDisplay.style.color = ''; // Reset color
  }
}

/**
 * Updates all progress bars and health displays
 */
function updateBars() {
  // Player HP bar
  const playerHpPercentage = calculatePercentage(player.hp, player.maxHp);
  domElements.playerHpBarFill.style.width = `${playerHpPercentage}%`;
  
  // Player HP text with resting indicator
  if (isResting) {
    domElements.playerHpTextOverlay.textContent = `RESTING - ${formatNumber(player.hp)}/${formatNumber(player.maxHp)} HP`;
    domElements.playerHpTextOverlay.classList.add('resting-text');
  } else {
    domElements.playerHpTextOverlay.textContent = `${formatNumber(player.hp)}/${formatNumber(player.maxHp)} HP`;
    domElements.playerHpTextOverlay.classList.remove('resting-text');
  }
  domElements.playerHpTextOverlay.classList.add('visible');
  
  // Enemy HP bar
  if (isEnemySpawnPending) {
    // Show spawning indicator
    domElements.enemyHpBarFill.style.width = '0%';
    domElements.enemyHpTextOverlay.textContent = 'Spawning...';
    domElements.enemyHpTextOverlay.classList.add('visible');
  } else {
    const enemyHpPercentage = calculatePercentage(enemy.hp, enemy.maxHp);
    domElements.enemyHpBarFill.style.width = `${enemyHpPercentage}%`;
    domElements.enemyHpTextOverlay.textContent = `${formatNumber(enemy.hp)}/${formatNumber(enemy.maxHp)} HP`;
    domElements.enemyHpTextOverlay.classList.add('visible');
  }
  
  // XP bar
  const currentXPForDisplay = player.level === MAX_LEVEL ? player.xpToNextLevel : player.xp;
  const xpPercentage = calculatePercentage(currentXPForDisplay, player.xpToNextLevel);
  domElements.xpProgressFill.style.width = `${Math.min(100, xpPercentage)}%`;
  
  if (player.level === MAX_LEVEL) {
    domElements.xpTextOverlay.textContent = `MAX LEVEL ${MAX_LEVEL}`;
  } else {
    domElements.xpTextOverlay.textContent = `${player.xp}/${player.xpToNextLevel} XP`;
  }
}

/**
 * Updates player stats display
 */
function updateStats() {
  // Max Health
  domElements.statMaxHealth.textContent = formatNumber(player.maxHp);
  
  // Health Regen with percentage and capping
  const currentRegenPerSecond = player.healthRegen;
  const regenPercentageOfMaxHp = (player.healthRegen / player.maxHp) * 100;
  domElements.statHealthRegen.textContent = `${formatNumber(currentRegenPerSecond, 2)} (${formatNumber(regenPercentageOfMaxHp)}%)`;
  
  if (player.isHealthRegenCappedByStats) {
    domElements.statHealthRegen.classList.add('stat-capped');
  } else {
    domElements.statHealthRegen.classList.remove('stat-capped');
  }
  
  // Damage
  domElements.statDamage.textContent = formatNumber(player.attack);
  
  // Armor with damage reduction percentage
  let rawDamageReductionPercentage = 0;
  if (player.defense + ARMOR_K_VALUE > 0) {
    rawDamageReductionPercentage = (player.defense / (player.defense + ARMOR_K_VALUE)) * 100;
  }
  const displayedDamageReductionPercentage = Math.min(rawDamageReductionPercentage, 90);
  domElements.statArmor.textContent = `${formatNumber(player.defense)} (${formatNumber(displayedDamageReductionPercentage)}%)`;
  
  if (rawDamageReductionPercentage >= 90) {
    domElements.statArmor.classList.add('stat-capped');
  } else {
    domElements.statArmor.classList.remove('stat-capped');
  }
  
  // Critical Chance
  domElements.statCriticalChance.textContent = `${formatNumber(player.criticalChance)}% (${formatNumber(player.baseCriticalChance, 0)})`;
  if (player.criticalChance >= 95) {
    domElements.statCriticalChance.classList.add('stat-capped');
  } else {
    domElements.statCriticalChance.classList.remove('stat-capped');
  }
  
  // Haste
  domElements.statHaste.textContent = `${formatNumber(player.haste)}% (${formatNumber(player.baseHaste, 0)})`;
  if (player.haste >= 75) {
    domElements.statHaste.classList.add('stat-capped');
  } else {
    domElements.statHaste.classList.remove('stat-capped');
  }
  
  // Mastery
  domElements.statMastery.textContent = `${formatNumber(player.mastery)}% (${formatNumber(player.baseMastery, 0)})`;
  if (player.mastery >= 95) {
    domElements.statMastery.classList.add('stat-capped');
  } else {
    domElements.statMastery.classList.remove('stat-capped');
  }
}

/**
 * Updates zone information
 */
function updateZoneInfo() {
  domElements.mainCurrentZoneDisplay.textContent = currentZone.name;
  if (domElements.currentZoneDisplay) {
    domElements.currentZoneDisplay.textContent = currentZone.name;
  }
  
  // Update Shardspire floor controls
  updateShardspireFloorDisplay();
}

/**
 * Updates the Shardspire floor controls display and visibility.
 */
export function updateShardspireFloorDisplay() {
  if (!domElements.shardspireFloorControls || !domElements.shardspireFloorDisplay || !domElements.shardspireFloorRange) {
    return;
  }
  
  // Show controls only when in Shardspire
  if (currentZone.name === 'Shardspire') {
    domElements.shardspireFloorControls.classList.remove('hidden');
    
    // Update floor number display
    domElements.shardspireFloorDisplay.textContent = `Floor ${shardspireFloor}`;
    
    // Calculate and display level range for current floor
    const minLevel = 95 + shardspireFloor * 5;
    const maxLevel = 100 + shardspireFloor * 5;
    domElements.shardspireFloorRange.textContent = `(Levels ${minLevel}-${maxLevel})`;
    
    // Update button states
    if (domElements.floorDownBtn) {
      domElements.floorDownBtn.disabled = shardspireFloor <= 1;
      domElements.floorDownBtn.title = shardspireFloor <= 1 ? 'Already at the lowest floor' : `Go to Floor ${shardspireFloor - 1}`;
    }
    
    if (domElements.floorUpBtn) {
      domElements.floorUpBtn.disabled = shardspireFloor >= 20;
      domElements.floorUpBtn.title = shardspireFloor >= 20 ? 'Already at the highest floor' : `Go to Floor ${shardspireFloor + 1}`;
    }
  } else {
    // Hide controls when not in Shardspire
    domElements.shardspireFloorControls.classList.add('hidden');
  }
}

/**
 * Updates talent points display
 */
function updateTalentDisplay() {
  domElements.talentPointsDisplay.textContent = `Unspent Talent Points: ${unspentTalentPoints}`;
  updateTalentButtonStates();
}

/**
 * Updates talent button states (disabled/enabled and visual feedback)
 */
function updateTalentButtonStates() {
  const talentButtons = {
    attackSpeed: domElements.attackSpeedTalent,
    criticalStrike: domElements.criticalStrikeTalentBtn,
    healthRegen: domElements.healthRegenTalentBtn,
    scalingArmor: domElements.scalingArmorTalentBtn
  };

  const swiftStrikesMaxed = talents.attackSpeed.currentRank >= talents.attackSpeed.maxRank;
  
  // Determine if any second-row talent has points invested but is not yet maxed
  let activeSecondRowTalentKey = null;
  const secondRowTalentKeys = ['criticalStrike', 'healthRegen', 'scalingArmor'];

  for (const key of secondRowTalentKeys) {
    const talent = talents[key];
    if (talent.currentRank > 0 && talent.currentRank < talent.maxRank) {
      activeSecondRowTalentKey = key;
      break; // Found an active, non-maxed second-row talent
    }
  }

  // Update each talent button
  for (const [talentKey, button] of Object.entries(talentButtons)) {
    const talent = talents[talentKey];
    let isDisabled = false;

    if (talentKey === 'attackSpeed') {
      // Logic for Swift Strikes (first row)
      isDisabled = unspentTalentPoints === 0 || talent.currentRank >= talent.maxRank;
    } else {
      // Logic for second row talents
      // 1. Must have unspent points and not be maxed
      isDisabled = unspentTalentPoints === 0 || talent.currentRank >= talent.maxRank;
      
      // 2. Swift Strikes must be maxed
      if (!swiftStrikesMaxed) {
        isDisabled = true;
      }

      // 3. Apply lock-in logic for second row
      if (swiftStrikesMaxed) { // Only apply this if Swift Strikes is maxed
        if (activeSecondRowTalentKey) {
          // If there's an active (non-maxed) second-row talent, lock others
          if (talentKey !== activeSecondRowTalentKey) {
            isDisabled = true;
          }
        }
        // If no activeSecondRowTalentKey, all second-row talents are available
        // (assuming swiftStrikesMaxed and unspent points and not maxed individually)
      }
    }
    
    button.disabled = isDisabled;
    
    // Update rank display
    const rankDisplay = button.querySelector('.rank-display');
    if (rankDisplay) {
      rankDisplay.textContent = `${talent.currentRank}/${talent.maxRank}`;
    }
    
    // Update tooltip ranks information
    const tooltipRanks = button.querySelector('.talent-tooltip-ranks');
    if (tooltipRanks) {
      tooltipRanks.textContent = `Current Rank: ${talent.currentRank}/${talent.maxRank}`;
    }
  }
}

/**
 * Updates inventory UI - full implementation
 */
export function updateInventoryUI(forceUpdate = false, retryCount = 0) {
    // Only clear and rebuild if no tooltip is currently visible to prevent flickering
    // Unless this is a forced update (like when unequipping items)
    const tooltipVisible = domElements.itemTooltip.classList.contains('visible');
    if (tooltipVisible && !forceUpdate && retryCount < 3) {
        // Schedule a retry after a short delay to ensure the update happens (max 3 retries)
        setTimeout(() => updateInventoryUI(true, retryCount + 1), 100);
        return; // Don't rebuild inventory while tooltip is showing
    }
    
    domElements.inventoryList.innerHTML = ''; // Clear existing list items
    
    if (inventory.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.classList.add('inventory-list-item');
        emptyMessage.textContent = 'Inventory is empty.';
        emptyMessage.style.justifyContent = 'center';
        emptyMessage.style.fontStyle = 'italic';
        emptyMessage.style.color = '#a0aec0';
        domElements.inventoryList.appendChild(emptyMessage);
    } else {
        // Sort inventory
        let sortedInventory = [...inventory];
        sortedInventory.sort((a, b) => b.itemLevel - a.itemLevel);
        
        // Group items by name, level, and rarity for display
        const groupedInventory = {};
        sortedInventory.forEach(itemInstance => {
            const key = `${itemInstance.name}_L${itemInstance.itemLevel}_R${itemInstance.rarity}_A${itemInstance.affix ? itemInstance.affix.name : 'None'}`;
            if (!groupedInventory[key]) {
                groupedInventory[key] = {
                    item: itemInstance,
                    quantity: 0,
                    instances: []
                };
            }
            groupedInventory[key].quantity++;
            groupedInventory[key].instances.push(itemInstance);
        });
        
        for (const key in groupedInventory) {
            const group = groupedInventory[key];
            const itemData = group.item;
            const listItem = document.createElement('div');
            listItem.classList.add('inventory-list-item');
            listItem.dataset.itemId = itemData.id;
            listItem.dataset.itemName = itemData.name;
            listItem.dataset.itemType = itemData.type;
            
            const nameSpan = document.createElement('span');
            nameSpan.classList.add('item-name');
            nameSpan.textContent = `${itemData.name} ${itemData.affix ? itemData.affix.name : ''} (Lvl ${itemData.itemLevel})`;
            if (itemData.rarity && rarities[itemData.rarity]) {
                nameSpan.style.color = rarities[itemData.rarity].color;
            }
            listItem.appendChild(nameSpan);
            
            const quantitySpan = document.createElement('span');
            quantitySpan.classList.add('item-quantity');
            quantitySpan.textContent = `x ${group.quantity}`;
            listItem.appendChild(quantitySpan);
            
            listItem.addEventListener('mouseover', e => showTooltip(e, itemData, true));
            listItem.addEventListener('mouseout', hideTooltip);
            domElements.inventoryList.appendChild(listItem);
        }
    }
}

/**
 * Updates equipped items UI
 */
export function updateEquippedItemsUI(forceUpdate = false, retryCount = 0) {
    // Only clear and rebuild if no tooltip is currently visible to prevent flickering
    // Unless this is a forced update (like when unequipping items)
    const tooltipVisible = domElements.itemTooltip.classList.contains('visible');
    if (tooltipVisible && !forceUpdate && retryCount < 3) {
        // Schedule a retry after a short delay to ensure the update happens (max 3 retries)
        setTimeout(() => updateEquippedItemsUI(true, retryCount + 1), 100);
        return; // Don't rebuild equipped items while tooltip is showing
    }
    
    domElements.equippedList.innerHTML = '';
    
    const equippedSlots = [
        { slot: 'equippedWeapon', item: player.equippedWeapon, label: 'Main Hand' },
        { slot: 'equippedOffHand', item: player.equippedOffHand, label: 'Off Hand' },
        { slot: 'equippedHead', item: player.equippedHead, label: 'Head' },
        { slot: 'equippedShoulders', item: player.equippedShoulders, label: 'Shoulders' },
        { slot: 'equippedChest', item: player.equippedChest, label: 'Chest' },
        { slot: 'equippedLegs', item: player.equippedLegs, label: 'Legs' },
        { slot: 'equippedFeet', item: player.equippedFeet, label: 'Feet' }
    ];
    
    for (const slotInfo of equippedSlots) {
        const listItem = document.createElement('div');
        listItem.classList.add('equipped-list-item');
        listItem.dataset.slot = slotInfo.slot;
        
        if (slotInfo.item) {
            listItem.dataset.itemId = slotInfo.item.id;
            listItem.dataset.itemName = slotInfo.item.name;
            listItem.dataset.itemType = slotInfo.item.type;
            listItem.textContent = `${slotInfo.item.name} ${slotInfo.item.affix ? slotInfo.item.affix.name : ''} (Lvl ${slotInfo.item.itemLevel}) (${slotInfo.label})`;
            if (slotInfo.item.rarity && rarities[slotInfo.item.rarity]) {
                listItem.style.color = rarities[slotInfo.item.rarity].color;
            }
            listItem.addEventListener('mouseover', e => showTooltip(e, slotInfo.item, false));
            listItem.addEventListener('mouseout', hideTooltip);
        } else {
            listItem.textContent = `${slotInfo.label}: Empty`;
        }
        domElements.equippedList.appendChild(listItem);
    }
}

/**
 * Shows item tooltip
 */
export function showTooltip(event, itemInstance, isInventoryItem = false) {
    // Prevent tooltip for null/undefined items (empty slots)
    if (!itemInstance) {
        return;
    }
    
    // Import necessary data
    import('./gameData.js').then(module => {
        const { rarities } = module;
        
        let tooltipContent = '';
        let itemNameDisplay = itemInstance.name;
        if (itemInstance.affix && itemInstance.affix.name) {
            itemNameDisplay += ` ${itemInstance.affix.name}`;
        }
        
        const rarityColor = rarities[itemInstance.rarity]?.color || '#e2e8f0';
        tooltipContent += `<strong style="color: ${rarityColor};">${itemNameDisplay} (Lvl ${itemInstance.itemLevel})</strong>`;
        if (itemInstance.rarity) {
            tooltipContent += `<br><span style="color: ${rarityColor};">${itemInstance.rarity}</span>`;
        }
        
        // Display stats
        if (itemInstance.type === 'weapon' || itemInstance.type === 'dagger') {
            if (itemInstance.bonusAttack) tooltipContent += `<br>Attack: +${itemInstance.bonusAttack.toFixed(1)}`;
        } else if (['head', 'shoulders', 'chest', 'legs', 'feet'].includes(itemInstance.type)) {
            if (itemInstance.defensePower) tooltipContent += `<br>Defense Power: ${itemInstance.defensePower.toFixed(0)}`;
        }
        
        if (itemInstance.bonusCriticalChance) tooltipContent += `<br>Crit Points: +${itemInstance.bonusCriticalChance.toFixed(0)}`;
        if (itemInstance.bonusHaste) tooltipContent += `<br>Haste Points: +${itemInstance.bonusHaste.toFixed(0)}`;
        if (itemInstance.bonusMastery) tooltipContent += `<br>Mastery Points: +${itemInstance.bonusMastery.toFixed(0)}`;
        
        // Add comparison section if this is an inventory item
        if (isInventoryItem) {
            import('./itemSystem.js').then(itemModule => {
                const equippedItemForComparison = itemModule.getEquippedItemForComparison(itemInstance);
                
                if (equippedItemForComparison) {
                    tooltipContent += `<div class="comparison-section">`;
                    tooltipContent += `<br><strong>Currently Equipped:</strong>`;
                    
                    let equippedItemNameDisplay = equippedItemForComparison.name;
                    if (equippedItemForComparison.affix && equippedItemForComparison.affix.name) {
                        equippedItemNameDisplay += ` ${equippedItemForComparison.affix.name}`;
                    }
                    const equippedRarityColor = rarities[equippedItemForComparison.rarity]?.color || '#e2e8f0';
                    tooltipContent += `<br><span style="color: ${equippedRarityColor};">${equippedItemNameDisplay} (Lvl ${equippedItemForComparison.itemLevel})</span>`;
                    if (equippedItemForComparison.rarity) {
                        tooltipContent += `<br><span style="color: ${equippedRarityColor};">${equippedItemForComparison.rarity}</span>`;
                    }
                    
                    // Compare stats
                    if (itemInstance.type === 'weapon' || itemInstance.type === 'dagger') {
                        const newAttack = itemInstance.bonusAttack || 0;
                        const oldAttack = equippedItemForComparison.bonusAttack || 0;
                        const attackDiff = newAttack - oldAttack;
                        if (attackDiff !== 0) {
                            const color = attackDiff > 0 ? '#48bb78' : '#f56565';
                            const sign = attackDiff > 0 ? '+' : '';
                            tooltipContent += `<br>Attack: ${oldAttack.toFixed(1)} <span style="color: ${color};">(${sign}${attackDiff.toFixed(1)})</span>`;
                        } else {
                            tooltipContent += `<br>Attack: ${oldAttack.toFixed(1)}`;
                        }
                    } else if (['head', 'shoulders', 'chest', 'legs', 'feet'].includes(itemInstance.type)) {
                        const newDefense = itemInstance.defensePower || 0;
                        const oldDefense = equippedItemForComparison.defensePower || 0;
                        const defenseDiff = newDefense - oldDefense;
                        if (defenseDiff !== 0) {
                            const color = defenseDiff > 0 ? '#48bb78' : '#f56565';
                            const sign = defenseDiff > 0 ? '+' : '';
                            tooltipContent += `<br>Defense Power: ${oldDefense.toFixed(0)} <span style="color: ${color};">(${sign}${defenseDiff.toFixed(0)})</span>`;
                        } else {
                            tooltipContent += `<br>Defense Power: ${oldDefense.toFixed(0)}`;
                        }
                    }
                    
                    // Compare secondary stats
                    const statComparisons = [
                        { new: itemInstance.bonusCriticalChance || 0, old: equippedItemForComparison.bonusCriticalChance || 0, name: 'Crit Points' },
                        { new: itemInstance.bonusHaste || 0, old: equippedItemForComparison.bonusHaste || 0, name: 'Haste Points' },
                        { new: itemInstance.bonusMastery || 0, old: equippedItemForComparison.bonusMastery || 0, name: 'Mastery Points' }
                    ];
                    
                    statComparisons.forEach(stat => {
                        if (stat.new > 0 || stat.old > 0) {
                            const diff = stat.new - stat.old;
                            if (diff !== 0) {
                                const color = diff > 0 ? '#48bb78' : '#f56565';
                                const sign = diff > 0 ? '+' : '';
                                tooltipContent += `<br>${stat.name}: ${stat.old.toFixed(0)} <span style="color: ${color};">(${sign}${diff.toFixed(0)})</span>`;
                            } else {
                                tooltipContent += `<br>${stat.name}: ${stat.old.toFixed(0)}`;
                            }
                        }
                    });
                    
                    tooltipContent += `</div>`;
                }
                
                // Update tooltip content after comparison is added
                domElements.itemTooltip.innerHTML = tooltipContent;
                domElements.itemTooltip.style.left = `${event.clientX + 15}px`;
                domElements.itemTooltip.style.top = `${event.clientY + 15}px`;
                domElements.itemTooltip.classList.remove('hidden');
                domElements.itemTooltip.classList.add('visible');
            });
        } else {
            // No comparison needed, just show the tooltip
            domElements.itemTooltip.innerHTML = tooltipContent;
            domElements.itemTooltip.style.left = `${event.clientX + 15}px`;
            domElements.itemTooltip.style.top = `${event.clientY + 15}px`;
            domElements.itemTooltip.classList.remove('hidden');
            domElements.itemTooltip.classList.add('visible');
        }
    });
}

/**
 * Hides item tooltip
 */
export function hideTooltip() {
    domElements.itemTooltip.classList.remove('visible');
    domElements.itemTooltip.classList.add('hidden');
}

/**
 * Displays scrolling combat text
 */
export function showCombatText(value, isCritical, targetHpBarEl, isDamageTaken = false, isMiss = false) {
  const combatTextEl = document.createElement('div');
  combatTextEl.classList.add('combat-text');
  
  if (isCritical) combatTextEl.classList.add('critical');
  
  if (isDamageTaken) {
    combatTextEl.classList.add('damage-taken');
    combatTextEl.textContent = `-${value.toFixed(0)}`;
  } else if (isMiss) {
    combatTextEl.classList.add('miss');
    combatTextEl.textContent = value;
  } else {
    combatTextEl.textContent = `${value.toFixed(0)}`;
  }
  
  // Position the text
  const targetRect = targetHpBarEl.getBoundingClientRect();
  const gameContainerRect = domElements.gameContainer.getBoundingClientRect();
  
  let topOffset = targetRect.top - gameContainerRect.top;
  
  combatTextEl.style.left = `${targetRect.left + targetRect.width / 2 - gameContainerRect.left}px`;
  combatTextEl.style.top = `${topOffset}px`;
  
  domElements.combatTextOverlay.appendChild(combatTextEl);
  
  // Remove after animation
  combatTextEl.addEventListener('animationend', () => {
    combatTextEl.remove();
  });
}

// Global variable to store confirmation callback
let currentConfirmationCallback = null;

/**
 * Shows a confirmation modal with custom title, message, and callback
 * @param {string} title - The title of the modal
 * @param {string} message - The message to display
 * @param {function} callback - Function to call when confirmed
 */
export function showConfirmationModal(title, message, callback) {
  currentConfirmationCallback = callback;
  
  // Update modal content
  const modalTitle = domElements.confirmationModalOverlay.querySelector('.modal-title');
  const modalMessage = domElements.confirmationModalOverlay.querySelector('.modal-message');
  
  if (modalTitle) modalTitle.textContent = title;
  if (modalMessage) modalMessage.textContent = message;
  
  // Show modal
  domElements.confirmationModalOverlay.classList.remove('hidden');
}

/**
 * Hides the confirmation modal
 */
export function hideConfirmationModal() {
  domElements.confirmationModalOverlay.classList.add('hidden');
  currentConfirmationCallback = null;
}

/**
 * Gets the current confirmation callback
 * @returns {function|null} The current callback function
 */
export function getCurrentConfirmationCallback() {
  return currentConfirmationCallback;
}
