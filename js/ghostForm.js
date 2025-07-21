// Ghost Form System
import { 
    GHOST_FORM_DURATION_MS,
    GHOST_FORM_UPDATE_INTERVAL_MS
} from './constants.js';
import { 
    player, 
    isGhostForm,
    isGameOver,
    setGhostForm,
    setGhostFormInterval,
    setGhostFormTimer,
    ghostFormTimer,
    ghostFormInterval,
    gameSpeedMultiplier
} from './gameState.js';
import { domElements } from './domElements.js';
import { updateUI, logMessage } from './ui.js';
import { stopCombat } from './combat.js';
import { spawnNextEnemy } from './enemySystem.js';

/**
 * Enters ghost form when player dies
 */
export function enterGhostForm() {
    if (isGhostForm || isGameOver) return;
    
    setGhostForm(true);
    setGhostFormTimer(GHOST_FORM_DURATION_MS);
    
    // Stop combat
    stopCombat();
    
    // Restore player to full health
    player.hp = player.maxHp;
    
    logMessage('You have entered ghost form! You are invulnerable but cannot attack.');
    
    // Show ghost form overlay
    if (domElements.ghostFormOverlay) {
        domElements.ghostFormOverlay.classList.remove('hidden');
    }
    
    startGhostFormCountdown();
    updateUI();
}

/**
 * Exits ghost form
 */
export function exitGhostForm() {
    if (!isGhostForm) return;
    
    setGhostForm(false);
    setGhostFormTimer(0);
    
    // Clear the countdown interval
    if (ghostFormInterval) {
        clearInterval(ghostFormInterval);
        setGhostFormInterval(null);
    }
    
    // Hide ghost form overlay
    if (domElements.ghostFormOverlay) {
        domElements.ghostFormOverlay.classList.add('hidden');
    }
    
    logMessage('Ghost form has ended. You can fight again!');
    
    // Spawn a new enemy
    spawnNextEnemy();
    
    updateUI();
}

/**
 * Starts the ghost form countdown
 */
function startGhostFormCountdown() {
    const intervalId = setInterval(() => {
        if (!isGhostForm) {
            clearInterval(intervalId);
            return;
        }
        
        // Decrease timer
        const newTimer = Math.max(0, ghostFormTimer - GHOST_FORM_UPDATE_INTERVAL_MS);
        setGhostFormTimer(newTimer);
        
        updateGhostFormUI();
        
        // Check if ghost form should end
        if (newTimer <= 0) {
            exitGhostForm();
        }
    }, GHOST_FORM_UPDATE_INTERVAL_MS);
    
    setGhostFormInterval(intervalId);
}

/**
 * Updates the ghost form UI elements
 */
function updateGhostFormUI() {
    const totalDuration = GHOST_FORM_DURATION_MS;
    const progress = ((totalDuration - ghostFormTimer) / totalDuration) * 100;
    const timeRemainingSeconds = ghostFormTimer / 1000;
    
    // Update progress bar
    if (domElements.ghostFormProgressFill) {
        domElements.ghostFormProgressFill.style.width = `${progress}%`;
    }
    
    // Update timer text
    if (domElements.ghostFormTimerText) {
        domElements.ghostFormTimerText.textContent = `${timeRemainingSeconds.toFixed(1)}s`;
    }
}

/**
 * Forces exit from ghost form (for testing or special cases)
 */
export function forceExitGhostForm() {
    if (!isGhostForm) return;
    
    logMessage('Ghost form forcibly ended!');
    exitGhostForm();
}

/**
 * Gets remaining ghost form time
 * @returns {number} Time remaining in milliseconds
 */
export function getGhostFormTimeRemaining() {
    return isGhostForm ? ghostFormTimer : 0;
}

/**
 * Gets ghost form progress as percentage
 * @returns {number} Progress from 0-100
 */
export function getGhostFormProgress() {
    if (!isGhostForm) return 0;
    
    const totalDuration = GHOST_FORM_DURATION_MS;
    return ((totalDuration - ghostFormTimer) / totalDuration) * 100;
}
