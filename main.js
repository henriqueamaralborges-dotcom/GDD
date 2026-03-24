import { gameState, FACTIONS, PHASES, BIOMES } from './gameState.js';
import { drawMap, updateMapUI } from './mapLogic.js';
import { resolveCombat, scorchedEarth } from './combatSystem.js';
import { showEventModal, showQuizModal } from './cardEvents.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initial draw
    drawMap();
    setupEventListeners();
    gameState.subscribe(updateUI);
    updateUI();
});

function setupEventListeners() {
    const nextPhaseBtn = document.getElementById('next-phase-btn');
    nextPhaseBtn.addEventListener('click', () => {
        gameState.nextPhase();
    });

    const scorchedEarthBtn = document.getElementById('scorched-earth-btn');
    scorchedEarthBtn.addEventListener('click', () => {
        if (gameState.selectedTerritory) {
            scorchedEarth(gameState.selectedTerritory);
        }
    });

    const modalCloseBtn = document.getElementById('modal-close-btn');
    modalCloseBtn.addEventListener('click', () => {
        document.getElementById('modal-container').classList.add('hidden');
    });

    // Special behavior for map clicks during move phase
    const map = document.getElementById('game-map');
    map.addEventListener('click', (e) => {
        const territoryElement = e.target.closest('.territory');
        if (territoryElement) {
            const id = territoryElement.dataset.id;
            handleMapInteraction(id);
        }
    });
}

function handleMapInteraction(id) {
    const t = gameState.territories[id];
    const prevId = gameState.selectedTerritory;
    const prev = gameState.territories[prevId];

    if (gameState.phase === PHASES.RECRUITMENT) {
        if (t.owner === gameState.turn && gameState.resources[gameState.turn] > 0) {
            let cost = 1;
            if (t.biome === 'CAATINGA') cost = 2; // Double cost
            
            if (gameState.resources[gameState.turn] >= cost) {
                t.troops++;
                gameState.resources[gameState.turn] -= cost;
                gameState.addLog(`${gameState.turn} recrutou em ${id}.`);
                gameState.notify();
            }
        }
    } else if (gameState.phase === PHASES.MOVEMENT) {
        if (prev && prev.owner === gameState.turn && prevId !== id) {
            if (prev.neighbors.includes(id)) {
                // Check movement dice
                if (gameState.diceRoll === null) {
                    gameState.diceRoll = Math.floor(Math.random() * 6) + 1;
                    const mod = BIOMES[t.biome].movementMod || ((d) => d);
                    gameState.diceRoll = mod(gameState.diceRoll);
                    gameState.addLog(`Dado de movimento (${t.biome}): ${gameState.diceRoll}`);
                }
                
                if (gameState.diceRoll > 0 && prev.troops > 1) {
                    prev.troops--;
                    t.troops++;
                    gameState.diceRoll--;
                    gameState.addLog(`Moveu tropa para ${id}. Sobram ${gameState.diceRoll} movimentos.`);
                    gameState.notify();
                }
            }
        }
    } else if (gameState.phase === PHASES.COMBAT) {
        if (prev && prev.owner === gameState.turn && prevId !== id) {
            if (t.owner !== gameState.turn && prev.neighbors.includes(id)) {
                // Combat condition check (min 4 attackers if defender has 3, etc. - using the logic from combatSystem)
                resolveCombat(prevId, id);
            }
        }
    } else if (gameState.phase === PHASES.ACTION) {
        // Simple random event on action
        if (Math.random() < 0.2) {
            showEventModal(gameState.turn === FACTIONS.FOREST ? 'FOREST' : 'INVADERS');
        } else if (Math.random() < 0.1) {
            showQuizModal();
        } else {
            gameState.addLog('Nenhum evento especial nesta zona.');
            gameState.nextPhase();
        }
    }
}

function updateUI() {
    const currentFaction = document.getElementById('current-faction');
    const currentPhase = document.getElementById('current-phase');
    const forestRes = document.getElementById('forest-resources');
    const invaderRes = document.getElementById('invader-resources');
    const nextPhaseBtn = document.getElementById('next-phase-btn');
    const actionLog = document.getElementById('action-log');

    currentFaction.textContent = `Turno: ${gameState.turn}`;
    currentFaction.className = gameState.turn === FACTIONS.FOREST ? 'forest-text' : 'invader-text';
    
    currentPhase.textContent = `Fase: ${gameState.phase}`;
    
    forestRes.textContent = `Recrutas: ${gameState.resources[FACTIONS.FOREST]}`;
    invaderRes.textContent = `Recrutas: ${gameState.resources[FACTIONS.INVADERS]}`;

    // Update active faction banner
    document.querySelector('.faction-banner.forest').classList.toggle('active', gameState.turn === FACTIONS.FOREST);
    document.querySelector('.faction-banner.invaders').classList.toggle('active', gameState.turn === FACTIONS.INVADERS);

    // Update phase stepper
    document.querySelectorAll('.step').forEach(step => {
        const p = step.dataset.phase;
        step.classList.toggle('active', gameState.phase === PHASES[p.toUpperCase()]);
    });

    // Update button visibility
    const scorchedEarthBtn = document.getElementById('scorched-earth-btn');
    scorchedEarthBtn.classList.toggle('hidden', gameState.turn !== FACTIONS.INVADERS || gameState.phase !== PHASES.COMBAT);

    // Update action log
    actionLog.innerHTML = gameState.log.slice(-10).reverse().map(l => `<div class="log-entry"><i>[${l.time}]</i> ${l.message}</div>`).join('');

    updateMapUI();
    
    // Reset move roll if phase changed
    if (gameState.phase !== PHASES.MOVEMENT) {
        gameState.diceRoll = null;
    }
}
