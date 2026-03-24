import { gameState, FACTIONS } from './gameState.js';

export function resolveCombat(attackerId, defenderId) {
    const attacker = gameState.territories[attackerId];
    const defender = gameState.territories[defenderId];

    if (!attacker || !defender) return;
    if (attacker.owner === defender.owner) return;
    if (attacker.neighbors.indexOf(defenderId) === -1) return;

    const attackerDiceCount = Math.min(3, attacker.troops - 1);
    const defenderDiceCount = Math.min(3, defender.troops);

    if (attackerDiceCount < 1) return;

    const attackerDice = rollDice(attackerDiceCount).sort((a, b) => b - a);
    const defenderDice = rollDice(defenderDiceCount).sort((a, b) => b - a);

    const results = [];
    const comparisons = Math.min(attackerDiceCount, defenderDiceCount);

    for (let i = 0; i < comparisons; i++) {
        let attackerValue = attackerDice[i];
        let defenderValue = defenderDice[i];

        // Biome Cerrado modifier: Defense has -1 in combat
        if (defender.biome === 'CERRADO') {
            defenderValue = Math.max(1, defenderValue - 1);
        }

        // Win check (Forest wins on tie)
        let attackerWins = false;
        if (attacker.owner === FACTIONS.FOREST) {
            attackerWins = attackerValue >= defenderValue;
        } else {
            attackerWins = attackerValue > defenderValue;
        }

        if (attackerWins) {
            defender.troops--;
            results.push(`Atacante (${attackerValue}) vs Defensor (${defenderValue}): Atacante vence!`);
        } else {
            attacker.troops--;
            results.push(`Atacante (${attackerValue}) vs Defensor (${defenderValue}): Defensor vence!`);
        }
    }

    // Capture check
    if (defender.troops <= 0) {
        defender.owner = attacker.owner;
        defender.troops = attackerDiceCount;
        attacker.troops -= attackerDiceCount;
        gameState.addLog(`Território ${defenderId} conquistado pela ${attacker.owner}!`);
    }

    gameState.addLog(`Combate em ${defenderId}: ` + results.join(' | '));
    gameState.notify();
}

function rollDice(count) {
    const dice = [];
    for (let i = 0; i < count; i++) {
        dice.push(Math.floor(Math.random() * 6) + 1);
    }
    return dice;
}

export function scorchedEarth(territoryId) {
    const territory = gameState.territories[territoryId];
    if (gameState.turn === FACTIONS.INVADERS && territory.owner === FACTIONS.INVADERS) {
        territory.troops += 5;
        territory.scorchedEarth = 3;
        gameState.addLog(`Extração de Madeira em ${territoryId}! +5 peças, território em terra arrasada.`);
        gameState.notify();
    }
}
