/**
 * GDD: Biomas em Guerra - Motor do Jogo
 * Consolidado em Arquivo Único
 */

const FACTIONS = { FOREST: 'Floresta', INVADERS: 'Invasores' };
const PHASES = { RECRUIT: 'Recrutamento', MOVE: 'Movimento', EVENT: 'Ação', COMBAT: 'Combate' };

const BIOMES = {
    AMAZON: { name: 'Amazônia', color: '#2ecc71', moveMod: (d) => Math.floor(d / 2) },
    ATLANTIC: { name: 'Mata Atlântica', color: '#27ae60', moveMod: (d) => d },
    CERRADO: { name: 'Cerrado', color: '#f39c12', defenseMod: -1, moveMod: (d) => d },
    CAATINGA: { name: 'Caatinga', color: '#fbc02d', recruitCost: 2, moveMod: (d) => d },
    PANTANAL: { name: 'Pantanal', color: '#3498db', moveMod: (d) => (d <= 2 ? 1 : d) },
    ROCKY: { name: 'Costão Rochoso', color: '#95a5a6', moveMod: (d) => d }
};

class GameEngine {
    constructor() {
        this.turn = FACTIONS.FOREST;
        this.phase = PHASES.RECRUIT;
        this.territories = {};
        this.resources = { [FACTIONS.FOREST]: 10, [FACTIONS.INVADERS]: 10 };
        this.selectedId = null;
        this.movePoints = 0;
        this.log = [];
        this.init();
    }

    init() {
        const specs = [
            { type: 'AMAZON', count: 7 }, { type: 'ATLANTIC', count: 6 },
            { type: 'CERRADO', count: 5 }, { type: 'CAATINGA', count: 4 },
            { type: 'PANTANAL', count: 4 }, { type: 'ROCKY', count: 3 }
        ];

        let idCounter = 1;
        specs.forEach(s => {
            for (let i = 0; i < s.count; i++) {
                const id = `T${idCounter++}`;
                this.territories[id] = {
                    id, biome: s.type, name: `${BIOMES[s.type].name} ${i + 1}`,
                    owner: idCounter <= 15 ? FACTIONS.FOREST : FACTIONS.INVADERS,
                    troops: 3, scorched: 0, neighbors: []
                };
            }
        });

        // Grafo de conexões simplificado
        const tids = Object.keys(this.territories);
        tids.forEach((tid, idx) => {
            if (tids[idx + 1]) this.addNeighbor(tid, tids[idx + 1]);
            const randomJump = (idx + 5) % tids.length;
            this.addNeighbor(tid, tids[randomJump]);
        });
    }

    addNeighbor(a, b) {
        if (!this.territories[a].neighbors.includes(b)) this.territories[a].neighbors.push(b);
        if (!this.territories[b].neighbors.includes(a)) this.territories[b].neighbors.push(a);
    }

    handleTerritoryClick(id) {
        const t = this.territories[id];
        
        if (this.phase === PHASES.RECRUIT) {
            this.recruit(id);
        } else if (this.phase === PHASES.MOVE) {
            this.movementLogic(id);
        } else if (this.phase === PHASES.COMBAT) {
            this.combatLogic(id);
        } else {
            this.selectedId = id;
        }
        this.updateUI();
    }

    recruit(id) {
        const t = this.territories[id];
        if (t.owner !== this.turn) return;
        const cost = t.biome === 'CAATINGA' ? 2 : 1;
        if (this.resources[this.turn] >= cost) {
            this.resources[this.turn] -= cost;
            t.troops++;
            this.addLog(`Recrutou em ${id}.`);
        }
    }

    movementLogic(id) {
        if (!this.selectedId) {
            if (this.territories[id].owner === this.turn) this.selectedId = id;
            return;
        }

        const from = this.territories[this.selectedId];
        if (from.neighbors.includes(id) && from.troops > 1) {
            if (this.movePoints === 0) {
                const roll = Math.floor(Math.random() * 6) + 1;
                this.movePoints = BIOMES[from.biome].moveMod(roll);
                this.addLog(`Dado: ${roll}. Movimentos: ${this.movePoints}`);
            }

            if (this.movePoints > 0) {
                from.troops--;
                this.territories[id].troops++; // Simplified move (assumes same owner check)
                this.movePoints--;
                this.addLog(`Moveu para ${id}.`);
            }
        } else {
            this.selectedId = id;
        }
    }

    combatLogic(id) {
        if (!this.selectedId) {
            if (this.territories[id].owner === this.turn) this.selectedId = id;
            return;
        }

        const attacker = this.territories[this.selectedId];
        const defender = this.territories[id];

        if (attacker.owner !== defender.owner && attacker.neighbors.includes(id) && attacker.troops >= 2) {
            this.resolveBattle(this.selectedId, id);
        } else {
            this.selectedId = id;
        }
    }

    resolveBattle(aId, dId) {
        const att = this.territories[aId];
        const def = this.territories[dId];
        const attDice = [0,0,0].map(() => Math.floor(Math.random() * 6) + 1).sort((a,b) => b-a);
        const defDice = [0,0,0].map(() => Math.floor(Math.random() * 6) + 1).sort((a,b) => b-a);
        
        let attLoss = 0, defLoss = 0;
        for(let i=0; i<3; i++) {
            let dVal = defDice[i];
            if (def.biome === 'CERRADO') dVal = Math.max(1, dVal - 1);

            let attWins = att.owner === FACTIONS.FOREST ? attDice[i] >= dVal : attDice[i] > dVal;
            if (attWins) defLoss++; else attLoss++;
        }

        att.troops = Math.max(1, att.troops - attLoss);
        def.troops -= defLoss;

        if (def.troops <= 0) {
            def.owner = att.owner;
            def.troops = 1;
            this.addLog(`Vitória! ${dId} conquistado.`);
        } else {
            this.addLog(`Combate em ${dId}: Atacante perdeu ${attLoss}, Defensor perdeu ${defLoss}`);
        }
    }

    nextPhase() {
        const keys = Object.values(PHASES);
        let currIdx = keys.indexOf(this.phase);
        if (currIdx === keys.length - 1) {
            this.phase = keys[0];
            this.turn = this.turn === FACTIONS.FOREST ? FACTIONS.INVADERS : FACTIONS.FOREST;
            this.processEndTurn();
        } else {
            this.phase = keys[currIdx + 1];
        }

        this.selectedId = null;
        this.movePoints = 0;
        if (this.phase === PHASES.EVENT) this.spawnEvent();
        this.updateUI();
    }

    processEndTurn() {
        Object.values(this.territories).forEach(t => { if(t.scorched > 0) t.scorched--; });
        const control = { [FACTIONS.FOREST]: 0, [FACTIONS.INVADERS]: 0 };
        Object.values(this.territories).forEach(t => control[t.owner]++);
        this.resources[FACTIONS.FOREST] += Math.max(2, Math.floor(control[FACTIONS.FOREST] / 3));
        this.resources[FACTIONS.INVADERS] += Math.max(2, Math.floor(control[FACTIONS.INVADERS] / 3));
    }

    spawnEvent() {
        const isForest = this.turn === FACTIONS.FOREST;
        const events = isForest ? ["Poder da Terra", "Cipó Expansivo"] : ["Motosserra Industrial", "Drone de Vigilância"];
        const ev = events[Math.floor(Math.random() * events.length)];
        this.showModal(`Evento: ${ev}`, `A facção ${this.turn} ativou uma carta especial.`);
    }

    showModal(title, body) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').textContent = body;
        document.getElementById('modal-overlay').classList.remove('hidden');
    }

    addLog(msg) {
        this.log.push({ msg, time: new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }) });
        this.updateUI();
    }

    updateUI() {
        document.getElementById('current-faction').textContent = this.turn;
        document.getElementById('current-phase').textContent = this.phase;
        document.getElementById('forest-res').textContent = `${this.resources[FACTIONS.FOREST]} Tropas`;
        document.getElementById('invader-res').textContent = `${this.resources[FACTIONS.INVADERS]} Tropas`;
        
        document.getElementById('forest-hud').classList.toggle('active', this.turn === FACTIONS.FOREST);
        document.getElementById('invader-hud').classList.toggle('active', this.turn === FACTIONS.INVADERS);
        
        document.querySelectorAll('.step').forEach(s => s.classList.toggle('active', s.dataset.id === Object.keys(PHASES).find(k => PHASES[k] === this.phase)));
        document.getElementById('next-btn').className = `main-btn ${this.turn === FACTIONS.INVADERS ? 'invader' : ''}`;
        
        const logBox = document.getElementById('log');
        logBox.innerHTML = this.log.slice(-8).reverse().map(l => `<div class='log-item'>[${l.time}] ${l.msg}</div>`).join('');
        
        document.getElementById('move-dice').classList.toggle('hidden', this.phase !== PHASES.MOVE || this.movePoints <= 0);
        document.getElementById('dice-val').textContent = this.movePoints;
        
        this.renderMap();
    }

    renderMap() {
        const nodesPos = this.getNodesPos();
        const links = document.getElementById('links-layer');
        const terrs = document.getElementById('territories-layer');
        links.innerHTML = ''; terrs.innerHTML = '';

        Object.values(this.territories).forEach(t => {
            const p = nodesPos[t.id];
            t.neighbors.forEach(nId => {
                const np = nodesPos[nId];
                const line = `<line class='link' x1='${p.x}' y1='${p.y}' x2='${np.x}' y2='${np.y}' />`;
                links.insertAdjacentHTML('beforeend', line);
            });
        });

        Object.values(this.territories).forEach(t => {
            const p = nodesPos[t.id];
            const isSelected = this.selectedId === t.id;
            const factionClass = t.owner === FACTIONS.FOREST ? 'forest' : 'invader';
            const color = t.owner === FACTIONS.FOREST ? '#27ae60' : '#c0392b';
            const stroke = BIOMES[t.biome].color;
            
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', `territory ${isSelected ? 'selected' : ''}`);
            g.innerHTML = `
                <circle cx='${p.x}' cy='${p.y}' r='38' fill='${color}' stroke='${stroke}' stroke-width='4' />
                <text x='${p.x}' y='${p.y+5}' text-anchor='middle' class='biome-label'>${t.id}</text>
                <circle cx='${p.x+25}' cy='${p.y-25}' r='12' fill='#333' />
                <text x='${p.x+25}' y='${p.y-21}' text-anchor='middle' class='troop-label'>${t.troops}</text>
            `;
            g.onclick = () => this.handleTerritoryClick(t.id);
            terrs.appendChild(g);
        });
    }

    getNodesPos() {
        const centers = {
            AMAZON: {x: 250, y: 220}, ATLANTIC: {x: 720, y: 250},
            CERRADO: {x: 500, y: 450}, CAATINGA: {x: 750, y: 600},
            PANTANAL: {x: 250, y: 620}, ROCKY: {x: 520, y: 720}
        };
        const pos = {};
        const bCounts = {};
        Object.values(this.territories).forEach(t => {
            const c = centers[t.biome];
            bCounts[t.biome] = (bCounts[t.biome] || 0) + 1;
            const angle = (bCounts[t.biome] / 8) * (2 * Math.PI);
            pos[t.id] = { x: c.x + Math.cos(angle)*100, y: c.y + Math.sin(angle)*100 };
        });
        return pos;
    }
}

const game = new GameEngine();
document.getElementById('next-btn').onclick = () => game.nextPhase();
document.getElementById('modal-close').onclick = () => document.getElementById('modal-overlay').classList.add('hidden');
window.addEventListener('keydown', (e) => { if(e.key === 'Enter') game.nextPhase(); });
 game.updateUI();
