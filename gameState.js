export const FACTIONS = {
    FOREST: 'Floresta',
    INVADERS: 'Invasores'
};

export const PHASES = {
    RECRUITMENT: 'Recrutamento',
    MOVEMENT: 'Movimento',
    ACTION: 'Ação',
    COMBAT: 'Combate'
};

export const BIOMES = {
    AMAZON: { name: 'Amazônia', color: '#2ecc71', movementMod: (d) => Math.floor(d / 2) },
    ATLANTIC: { name: 'Mata Atlântica', color: '#27ae60', movementMod: (d) => d },
    CERRADO: { name: 'Cerrado', color: '#e67e22', defenseMod: -1, movementMod: (d) => d },
    CAATINGA: { name: 'Caatinga', color: '#f1c40f', recruitmentCost: 2, movementMod: (d) => d },
    PANTANAL: { name: 'Pantanal', color: '#3498db', movementMod: (d) => (d <= 2 ? 1 : d) },
    ROCKY: { name: 'Costão Rochoso', color: '#95a5a6', movementMod: (d) => d }
};

export class GameState {
    constructor() {
        this.turn = FACTIONS.FOREST;
        this.phase = PHASES.RECRUITMENT;
        this.territories = {};
        this.resources = {
            [FACTIONS.FOREST]: 10,
            [FACTIONS.INVADERS]: 10
        };
        this.diceRoll = null;
        this.selectedTerritory = null;
        this.targetTerritory = null;
        this.log = [];
        this.listeners = [];
        this.initializeTerritories();
    }

    initializeTerritories() {
        const biomesData = [
            { type: 'AMAZON', count: 7 },
            { type: 'ATLANTIC', count: 6 },
            { type: 'CERRADO', count: 5 },
            { type: 'CAATINGA', count: 4 },
            { type: 'PANTANAL', count: 4 },
            { type: 'ROCKY', count: 3 }
        ];

        let id = 1;
        biomesData.forEach(biome => {
            for (let i = 0; i < biome.count; i++) {
                const territoryId = `T${id++}`;
                this.territories[territoryId] = {
                    id: territoryId,
                    name: `${BIOMES[biome.type].name} ${i + 1}`,
                    biome: biome.type,
                    owner: id <= 15 ? FACTIONS.FOREST : FACTIONS.INVADERS,
                    troops: 3,
                    scorchedEarth: 0, // rounds left
                    neighbors: []
                };
            }
        });

        // Set up adjacency (will be refined in mapLogic or defined here)
        // For simplicity, we create a graph based on sequential connections and biome proximity
        Object.keys(this.territories).forEach((tid, index, arr) => {
            const current = this.territories[tid];
            if (arr[index + 1]) current.neighbors.push(arr[index + 1]);
            if (arr[index - 1]) current.neighbors.push(arr[index - 1]);
            // Add some "vertical" jumps to make it look like a map graph
            const leap = Math.floor(Math.random() * 5) + 3;
            if (arr[index + leap]) {
                current.neighbors.push(arr[index + leap]);
                this.territories[arr[index + leap]].neighbors.push(tid);
            }
        });
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this));
    }

    addLog(message) {
        this.log.push({ message, time: new Date().toLocaleTimeString() });
        this.notify();
    }

    nextPhase() {
        const phases = Object.values(PHASES);
        const currentIndex = phases.indexOf(this.phase);
        if (currentIndex === phases.length - 1) {
            this.phase = phases[0];
            this.turn = this.turn === FACTIONS.FOREST ? FACTIONS.INVADERS : FACTIONS.FOREST;
            this.processEndOfTurn();
        } else {
            this.phase = phases[currentIndex + 1];
        }
        this.addLog(`Fase: ${this.phase} (${this.turn})`);
        this.notify();
    }

    processEndOfTurn() {
        // Decrease scorched earth timers
        Object.values(this.territories).forEach(t => {
            if (t.scorchedEarth > 0) t.scorchedEarth--;
        });
        
        // Bonus recruits based on count, but skip scorched earth territories
        const counts = { [FACTIONS.FOREST]: 0, [FACTIONS.INVADERS]: 0 };
        Object.values(this.territories).forEach(t => {
            if (t.scorchedEarth === 0) {
                counts[t.owner]++;
            }
        });
        
        this.resources[FACTIONS.FOREST] += Math.max(3, Math.floor(counts[FACTIONS.FOREST] / 3));
        this.resources[FACTIONS.INVADERS] += Math.max(3, Math.floor(counts[FACTIONS.INVADERS] / 3));
        
        this.addLog(`Recrutas distribuídos: ${FACTIONS.FOREST}: +${Math.max(3, Math.floor(counts[FACTIONS.FOREST] / 3))}, ${FACTIONS.INVADERS}: +${Math.max(3, Math.floor(counts[FACTIONS.INVADERS] / 3))}`);
    }

    getTerritoryCounts() {
        const counts = { [FACTIONS.FOREST]: 0, [FACTIONS.INVADERS]: 0 };
        Object.values(this.territories).forEach(t => counts[t.owner]++);
        return counts;
    }
}

export const gameState = new GameState();
