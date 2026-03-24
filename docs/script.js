/**
 * Biomas em Guerra: Floresta vs Invasores (Engine v2.0)
 * Gameplay Pro com Combate Visual e IA de Bioma
 */

const FACTIONS = { FOREST: 'Floresta', INVADERS: 'Invasores' };
const PHASES = { RECRUIT: 'Recrutamento', MOVE: 'Movimento', EVENT: 'Ação', COMBAT: 'Combate' };
const BIOMES = {
    AMAZON: { name: 'Amazônia', color: '#4ade80', moveMod: (d) => Math.floor(d / 2) },
    ATLANTIC: { name: 'Mata Atlântica', color: '#16a34a', moveMod: (d) => d },
    CERRADO: { name: 'Cerrado', color: '#f59e0b', def: -1, moveMod: (d) => d },
    CAATINGA: { name: 'Caatinga', color: '#facc15', cost: 2, moveMod: (d) => d },
    PANTANAL: { name: 'Pantanal', color: '#38bdf8', moveMod: (d) => (d <= 2 ? 1 : d) },
    ROCKY: { name: 'Costão', color: '#94a3b8', moveMod: (d) => d }
};

class GameEngine {
    constructor() {
        this.turn = FACTIONS.FOREST;
        this.phase = PHASES.RECRUIT;
        this.territories = {};
        this.resources = { [FACTIONS.FOREST]: 12, [FACTIONS.INVADERS]: 12 };
        this.selectedId = null;
        this.movePoints = 0;
        this.log = [];
        this.init();
    }

    init() {
        const layout = [
            { t: 'AMAZON', c: 7 }, { t: 'ATLANTIC', c: 6 },
            { t: 'CERRADO', c: 5 }, { t: 'CAATINGA', c: 4 },
            { t: 'PANTANAL', c: 4 }, { t: 'ROCKY', c: 3 }
        ];

        let idCounter = 1;
        layout.forEach(row => {
            for (let i = 0; i < row.c; i++) {
                const id = `T${idCounter++}`;
                this.territories[id] = {
                    id, biome: row.t, name: `${BIOMES[row.t].name} ${i + 1}`,
                    owner: idCounter <= 15 ? FACTIONS.FOREST : FACTIONS.INVADERS,
                    troops: 3, scorched: 0, neighbors: []
                };
            }
        });

        // Grafo Dinâmico
        const tids = Object.keys(this.territories);
        tids.forEach((id, idx) => {
            if (tids[idx+1]) this.addLink(id, tids[idx+1]);
            const randomJump = (idx + 4) % tids.length;
            this.addLink(id, tids[randomJump]);
        });

        this.updateHUD();
        this.renderMap();
        this.addLog("O Desafio começou! Proteja a Terra ou avance com o progresso.");
    }

    addLink(a, b) {
        if (!this.territories[a].neighbors.includes(b)) this.territories[a].neighbors.push(b);
        if (!this.territories[b].neighbors.includes(a)) this.territories[b].neighbors.push(a);
    }

    addLog(msg) {
        const time = new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
        this.log.push({ time, msg });
        const logBox = document.getElementById('console-log');
        logBox.innerHTML = this.log.slice(-10).reverse().map(l => `<div class="msg"><span class="msg-title">[${l.time}]</span>${l.msg}</div>`).join('');
    }

    handleTerritoryClick(id) {
        const t = this.territories[id];
        
        if (this.phase === PHASES.RECRUIT) {
            this.handleRecruit(id);
        } else if (this.phase === PHASES.MOVE) {
            this.handleMove(id);
        } else if (this.phase === PHASES.COMBAT) {
            this.handleCombatClick(id);
        } else {
            this.selectedId = (this.selectedId === id) ? null : id;
        }
        
        this.renderMap();
        this.updateHUD();
    }

    handleRecruit(id) {
        const t = this.territories[id];
        if (t.owner !== this.turn) return;
        const cost = BIOMES[t.biome].cost || 1;
        if (this.resources[this.turn] >= cost) {
            this.resources[this.turn] -= cost;
            t.troops++;
            this.addLog(`Reforço em ${t.name} (+1).`);
        }
    }

    handleMove(id) {
        if (!this.selectedId) {
            if (this.territories[id].owner === this.turn) this.selectedId = id;
            return;
        }

        const from = this.territories[this.selectedId];
        const to = this.territories[id];

        if (from.neighbors.includes(id) && to.owner === this.turn && from.troops > 1) {
            if (this.movePoints === 0) {
                const roll = Math.floor(Math.random() * 6) + 1;
                this.movePoints = BIOMES[from.biome].moveMod(roll);
                this.addLog(`Movimentação (${from.biome}): ${this.movePoints} pontos.`);
            }

            if (this.movePoints > 0) {
                from.troops--;
                to.troops++;
                this.movePoints--;
                this.addLog(`Tropas movidas para ${id}.`);
            }
        } else {
            this.selectedId = id;
        }
    }

    handleCombatClick(id) {
        if (!this.selectedId) {
            if (this.territories[id].owner === this.turn) this.selectedId = id;
            return;
        }

        const attacker = this.territories[this.selectedId];
        const defender = this.territories[id];

        if (attacker.owner !== defender.owner && attacker.neighbors.includes(id) && attacker.troops >= 2) {
            this.launchBattle(this.selectedId, id);
        } else {
            this.selectedId = id;
        }
    }

    launchBattle(attId, defId) {
        const att = this.territories[attId];
        const def = this.territories[defId];
        
        document.getElementById('target-name').textContent = def.name;
        document.getElementById('battle-overlay').classList.remove('hidden');
        document.getElementById('battle-result').textContent = "Prepare os dados!";
        
        const forestDiceDiv = document.getElementById('forest-dice');
        const invaderDiceDiv = document.getElementById('invader-dice');
        forestDiceDiv.innerHTML = ''; invaderDiceDiv.innerHTML = '';

        document.getElementById('roll-battle-btn').onclick = () => {
            const attCount = Math.min(3, att.troops - 1);
            const defCount = Math.min(3, def.troops);

            const rollA = [0,0,0].slice(0,attCount).map(() => Math.floor(Math.random()*6)+1).sort((a,b)=>b-a);
            const rollD = [0,0,0].slice(0,defCount).map(() => Math.floor(Math.random()*6)+1).sort((a,b)=>b-a);

            forestDiceDiv.innerHTML = (att.owner === FACTIONS.FOREST ? rollA : rollD).map(v => `<div class="die forest">${v}</div>`).join('');
            invaderDiceDiv.innerHTML = (att.owner === FACTIONS.INVADERS ? rollA : rollD).map(v => `<div class="die invader">${v}</div>`).join('');

            let winA = 0, winD = 0;
            for(let i=0; i < Math.min(rollA.length, rollD.length); i++) {
                let dVal = rollD[i];
                if (def.biome === 'CERRADO') dVal = Math.max(1, dVal - 1);
                
                let attWins = att.owner === FACTIONS.FOREST ? rollA[i] >= dVal : rollA[i] > dVal;
                if (attWins) winA++; else winD++;
            }

            att.troops -= winD;
            def.troops -= winA;

            if (def.troops <= 0) {
                def.owner = att.owner;
                def.troops = rollA.length;
                att.troops -= rollA.length;
                this.addLog(`TERRITÓRIO CONQUISTADO: ${def.name}`);
                document.getElementById('battle-result').textContent = "CONQUISTA!";
            } else {
                document.getElementById('battle-result').textContent = `Baixas: Atacante ${winD}, Defensor ${winA}`;
            }

            setTimeout(() => {
                document.getElementById('battle-overlay').classList.add('hidden');
                this.updateHUD();
                this.renderMap();
            }, 2500);
        };
    }

    nextPhase() {
        const keys = Object.values(PHASES);
        let idx = keys.indexOf(this.phase);
        if (idx === keys.length - 1) {
            this.phase = keys[0];
            this.turn = (this.turn === FACTIONS.FOREST) ? FACTIONS.INVADERS : FACTIONS.FOREST;
            this.processEndTurn();
        } else {
            this.phase = keys[idx+1];
        }

        this.selectedId = null;
        this.movePoints = 0;
        if (this.phase === PHASES.EVENT) this.spawnEvent();
        this.updateHUD();
        this.renderMap();
    }

    processEndTurn() {
        Object.values(this.territories).forEach(t => { if(t.scorched > 0) t.scorched--; });
        const control = { [FACTIONS.FOREST]: 0, [FACTIONS.INVADERS]: 0 };
        Object.values(this.territories).forEach(t => { if(t.scorched === 0) control[t.owner]++; });
        
        const gainF = Math.max(3, Math.floor(control[FACTIONS.FOREST] / 3));
        const gainI = Math.max(3, Math.floor(control[FACTIONS.INVADERS] / 3));
        this.resources[FACTIONS.FOREST] += gainF;
        this.resources[FACTIONS.INVADERS] += gainI;
        
        this.addLog(`Reforços: Floresta +${gainF}, Invasores +${gainI}`);
    }

    spawnEvent() {
        const isForest = this.turn === FACTIONS.FOREST;
        const roll = Math.random();
        
        if (roll < 0.4) {
            const deck = isForest ? 
                [{n:"Cipó", d:"Movimento Extra"}, {n:"Névoa", d:"Defesa +1"}] : 
                [{n:"Drone", d:"Visão Total"}, {n:"Moto", d:"Ataque +2"}];
            const card = deck[Math.floor(Math.random()*deck.length)];
            this.showEvent(card.n, card.d);
        } else {
            this.showQuiz();
        }
    }

    showEvent(title, desc) {
        document.getElementById('event-title').textContent = title;
        document.getElementById('event-text').textContent = desc;
        document.getElementById('quiz-options').classList.add('hidden');
        document.getElementById('event-overlay').classList.remove('hidden');
    }

    showQuiz() {
        const questions = [
            {q: "O que é o Cerrado?", a:["Savana", "Floresta", "Deserto"], c:0},
            {q: "Bioma da Amazônia?", a:["Verde", "Seco", "Gelado"], c:0}
        ];
        const q = questions[Math.floor(Math.random()*questions.length)];
        
        document.getElementById('event-title').textContent = "Santuário: Quiz";
        document.getElementById('event-text').textContent = q.q;
        const opts = document.getElementById('quiz-options');
        opts.innerHTML = '';
        opts.classList.remove('hidden');
        q.a.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-btn';
            btn.textContent = opt;
            btn.onclick = () => {
                if (i === q.c) { this.resources[this.turn] += 3; this.addLog("Acertou o Quiz! +3 tropas."); }
                document.getElementById('event-overlay').classList.add('hidden');
            };
            opts.appendChild(btn);
        });
        document.getElementById('event-overlay').classList.remove('hidden');
    }

    updateHUD() {
        document.getElementById('current-faction').textContent = this.turn;
        document.getElementById('forest-res').textContent = `${this.resources[FACTIONS.FOREST]} Tropas`;
        document.getElementById('invader-res').textContent = `${this.resources[FACTIONS.INVADERS]} Tropas`;
        
        document.getElementById('forest-hud').classList.toggle('active', this.turn === FACTIONS.FOREST);
        document.getElementById('invader-hud').classList.toggle('active', this.turn === FACTIONS.INVADERS);
        
        document.querySelectorAll('.step-box').forEach(s => {
            const phaseKey = Object.keys(PHASES).find(k => PHASES[k] === this.phase);
            s.classList.toggle('active', s.dataset.id === phaseKey);
        });

        const nextBtn = document.getElementById('next-btn');
        nextBtn.className = `glow-btn ${this.turn === FACTIONS.INVADERS ? 'invader' : ''}`;
        
        document.getElementById('dice-display').classList.toggle('hidden', this.phase !== PHASES.MOVE || this.movePoints <= 0);
        document.getElementById('d6-visual').textContent = this.movePoints;
    }

    renderMap() {
        const pos = this.getLayout();
        const links = document.getElementById('links-layer');
        const terrs = document.getElementById('territories-layer');
        links.innerHTML = ''; terrs.innerHTML = '';

        Object.values(this.territories).forEach(t => {
            const p = pos[t.id];
            t.neighbors.forEach(nId => {
                const np = pos[nId];
                links.insertAdjacentHTML('beforeend', `<line class="line-connect" x1="${p.x}" y1="${p.y}" x2="${np.x}" y2="${np.y}" />`);
            });
        });

        Object.values(this.territories).forEach(t => {
            const p = pos[t.id];
            const isSel = this.selectedId === t.id;
            const isNeigh = this.selectedId && this.territories[this.selectedId].neighbors.includes(t.id);
            const color = t.owner === FACTIONS.FOREST ? '#2ecc71' : '#e74c3c';
            const stroke = BIOMES[t.biome].color;
            
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', `territory ${isSel ? 'selected' : ''} ${isNeigh ? 'neighbor' : ''}`);
            g.innerHTML = `
                <circle cx="${p.x}" cy="${p.y}" r="35" fill="${color}" stroke="${stroke}" stroke-width="4" filter="url(#glow)" />
                <text x="${p.x}" y="${p.y+5}" text-anchor="middle" class="biome-label">${t.id}</text>
                <circle cx="${p.x+25}" cy="${p.y-25}" r="12" fill="#0f172a" />
                <text x="${p.x+25}" y="${p.y-20}" text-anchor="middle" class="unit-badge">${t.troops}</text>
            `;
            g.onclick = () => this.handleTerritoryClick(t.id);
            terrs.appendChild(g);
        });
    }

    getLayout() {
        const centers = {
            AMAZON: {x:250, y:200}, ATLANTIC: {x:750, y:250},
            CERRADO: {x:500, y:450}, CAATINGA: {x:800, y:550},
            PANTANAL: {x:200, y:600}, ROCKY: {x:500, y:720}
        };
        const p = {};
        const b = {};
        Object.values(this.territories).forEach(t => {
            b[t.biome] = (b[t.biome] || 0) + 1;
            const angle = (b[t.biome] / 8) * (2 * Math.PI);
            p[t.id] = { x: centers[t.biome].x + Math.cos(angle)*100, y: centers[t.biome].y + Math.sin(angle)*100 };
        });
        return p;
    }
}

const game = new GameEngine();
document.getElementById('next-btn').onclick = () => game.nextPhase();
document.getElementById('event-close-btn').onclick = () => document.getElementById('event-overlay').classList.add('hidden');
window.onkeydown = (e) => { if(e.key === 'Enter') game.nextPhase(); };
