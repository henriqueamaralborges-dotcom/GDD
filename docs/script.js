/**
 * Biomas em Guerra: Floresta vs Invasores (GOD MODE v3.0)
 * Ultimate Strat & Experience
 */

const FACTIONS = { FOREST: 'Floresta', INVADERS: 'Invasores' };
const PHASES = { RECRUIT: 'Recrutamento', MOVE: 'Movimento', EVENT: 'Ação', COMBAT: 'Conquista' };
const BIOMES = {
    AMAZON: { name: 'Amazônia', color: '#10b981', bonus: 'Suporte Nativo: +1 Defesa', moveBonus: 'Atrito: Movimento / 2' },
    ATLANTIC: { name: 'Mata Atlântica', color: '#059669', bonus: 'Regeneração: Extra Recrutas' },
    CERRADO: { name: 'Cerrado', color: '#f59e0b', bonus: 'Solo Exposto: Defesa -1' },
    CAATINGA: { name: 'Caatinga', color: '#eab308', bonus: 'Clima Árido: Recrutar Custa 2' },
    PANTANAL: { name: 'Pantanal', color: '#0ea5e9', bonus: 'Alagamento: Travado em dados baixos' },
    ROCKY: { name: 'Costão', color: '#64748b', bonus: 'Proteção Natural' }
};

class Game {
    constructor() {
        this.turn = FACTIONS.FOREST;
        this.phase = PHASES.RECRUIT;
        this.territories = {};
        this.resources = { [FACTIONS.FOREST]: 15, [FACTIONS.INVADERS]: 15 };
        this.selectedId = null;
        this.moveReserve = 0;
        this.log = [];
        this.init();
    }

    init() {
        // Layout Estratégico do Brasil
        const blueprint = [
            { id: 'T1', b: 'AMAZON', x: 200, y: 150 }, { id: 'T2', b: 'AMAZON', x: 350, y: 120 }, { id: 'T3', b: 'AMAZON', x: 150, y: 280 },
            { id: 'T4', b: 'ATLANTIC', x: 750, y: 180 }, { id: 'T5', b: 'ATLANTIC', x: 820, y: 320 }, { id: 'T6', b: 'ATLANTIC', x: 780, y: 450 },
            { id: 'T7', b: 'CERRADO', x: 450, y: 320 }, { id: 'T8', b: 'CERRADO', x: 550, y: 400 }, { id: 'T9', b: 'CERRADO', x: 420, y: 480 },
            { id: 'T10', b: 'CAATINGA', x: 700, y: 550 }, { id: 'T11', b: 'CAATINGA', x: 800, y: 650 },
            { id: 'T12', b: 'PANTANAL', x: 180, y: 500 }, { id: 'T13', b: 'PANTANAL', x: 250, y: 630 },
            { id: 'T14', b: 'ROCKY', x: 500, y: 680 }, { id: 'T15', b: 'AMAZON', x: 380, y: 250 }
        ];

        blueprint.forEach(t => {
            this.territories[t.id] = {
                ...t, troops: 5, owner: t.x < 500 ? FACTIONS.FOREST : FACTIONS.INVADERS,
                neighbors: []
            };
        });

        // Autoconectar vizinhos próximos
        Object.keys(this.territories).forEach(id => {
            const current = this.territories[id];
            Object.values(this.territories).forEach(other => {
                if(id === other.id) return;
                const dist = Math.hypot(current.x - other.x, current.y - other.y);
                if(dist < 200) current.neighbors.push(other.id);
            });
        });

        this.attachListeners();
        this.updateHUD();
        this.render();
        this.announceTurn();
    }

    attachListeners() {
        document.getElementById('btn-next').onclick = () => this.nextPhase();
        document.getElementById('btn-ev-confirm').onclick = () => document.getElementById('event-modal').classList.add('hidden');
        document.getElementById('btn-action').onclick = () => this.handleAction();
    }

    handleAction() {
        if(this.phase === PHASES.RECRUIT && this.selectedId) {
            const t = this.territories[this.selectedId];
            const cost = t.biome === 'CAATINGA' ? 2 : 1;
            if(this.resources[this.turn] >= cost && t.owner === this.turn) {
                this.resources[this.turn] -= cost;
                t.troops++;
                this.playSound('click');
            }
        }
        this.updateHUD();
        this.render();
    }

    announceTurn() {
        const banner = document.getElementById('turn-banner');
        const text = document.getElementById('banner-text');
        text.textContent = `TURNO: ${this.turn}`;
        text.style.color = this.turn === FACTIONS.FOREST ? 'var(--forest)' : 'var(--invader)';
        banner.classList.remove('hidden');
        this.playSound('turn');
        setTimeout(() => banner.classList.add('hidden'), 1500);
    }

    nextPhase() {
        const keys = Object.values(PHASES);
        let idx = keys.indexOf(this.phase);
        if(idx === keys.length - 1) {
            this.phase = keys[0];
            this.turn = (this.turn === FACTIONS.FOREST) ? FACTIONS.INVADERS : FACTIONS.FOREST;
            this.rewardPlayers();
            this.announceTurn();
        } else {
            this.phase = keys[idx+1];
        }
        this.selectedId = null;
        this.moveReserve = 0;
        if(this.phase === PHASES.EVENT) this.doEvent();
        this.updateHUD();
        this.render();
    }

    rewardPlayers() {
        Object.keys(FACTIONS).forEach(f => {
            const count = Object.values(this.territories).filter(t => t.owner === FACTIONS[f]).length;
            this.resources[FACTIONS[f]] += Math.max(3, Math.floor(count / 2));
        });
    }

    handleMove(toId) {
        if(!this.selectedId) {
            if(this.territories[toId].owner === this.turn) this.selectedId = toId;
            return;
        }

        const from = this.territories[this.selectedId];
        const to = this.territories[toId];

        if(from.neighbors.includes(toId) && to.owner === this.turn && from.troops > 1) {
            if(this.moveReserve === 0) {
                const roll = Math.floor(Math.random()*6)+1;
                this.moveReserve = from.biome === 'AMAZON' ? Math.ceil(roll/2) : roll;
            }
            if(this.moveReserve > 0) {
                from.troops--;
                to.troops++;
                this.moveReserve--;
                this.playSound('move');
            }
        } else {
            this.selectedId = toId;
        }
    }

    launchBattle(attId, defId) {
        const att = this.territories[attId];
        const def = this.territories[defId];
        const modal = document.getElementById('battle-modal');
        modal.classList.remove('hidden');
        document.getElementById('battle-msg').textContent = "Prepare os dados!";
        
        document.getElementById('btn-roll').onclick = () => {
            const dAtt = [0,0,0].map(() => Math.floor(Math.random()*6)+1).sort((a,b)=>b-a);
            const dDef = [0,0,0].map(() => Math.floor(Math.random()*6)+1).sort((a,b)=>b-a);

            document.getElementById('dice-att').innerHTML = dAtt.map(v => `<div class="die ${att.owner.toLowerCase()}">${v}</div>`).join('');
            document.getElementById('dice-def').innerHTML = dDef.map(v => `<div class="die ${def.owner.toLowerCase()}">${v}</div>`).join('');

            let winA = 0, winD = 0;
            for(let i=0; i<3; i++) {
                let dBonus = def.biome === 'CERRADO' ? -1 : 0;
                let valA = dAtt[i], valD = Math.max(1, dDef[i] + dBonus);
                let aWins = att.owner === FACTIONS.FOREST ? valA >= valD : valA > valD;
                if(aWins) winD++; else winA++;
            }

            att.troops -= winA;
            def.troops -= winD;

            if(def.troops <= 0) {
                def.owner = att.owner; def.troops = 1;
                this.addLog(`CONQUISTA: ${def.name}`);
            }

            this.playSound('dice');
            setTimeout(() => { modal.classList.add('hidden'); this.render(); this.updateHUD(); }, 2000);
        };
    }

    doEvent() {
        const isForest = this.turn === FACTIONS.FOREST;
        const roll = Math.random();
        if(roll < 0.5) {
            this.showQuiz();
        } else {
            const evs = isForest ? ["Reforestamento (+5)", "Proteção Nativa (+2)"] : ["Industrialização (+5)", "Drone (+1)"];
            const e = evs[Math.floor(Math.random()*evs.length)];
            this.resources[this.turn] += 5;
            this.showModal("EVENTO", e);
        }
    }

    showQuiz() {
        const q = { q: "Qual o maior bioma do Brasil?", o: ["Amazônia", "Cerrado"], c: 0 };
        const modal = document.getElementById('event-modal');
        document.getElementById('ev-title').textContent = "SANTUÁRIO";
        document.getElementById('ev-text').textContent = q.q;
        const opts = document.getElementById('quiz-options');
        opts.innerHTML = ''; opts.classList.remove('hidden');
        q.o.forEach((txt, i) => {
            const b = document.createElement('button');
            b.className = 'quiz-btn'; b.textContent = txt;
            b.onclick = () => { if(i === q.c) this.resources[this.turn] += 5; modal.classList.add('hidden'); };
            opts.appendChild(b);
        });
        modal.classList.remove('hidden');
    }

    showModal(t, b) {
        document.getElementById('ev-title').textContent = t;
        document.getElementById('ev-text').textContent = b;
        document.getElementById('quiz-options').classList.add('hidden');
        document.getElementById('event-modal').classList.remove('hidden');
    }

    playSound(type) {
        const tones = { click: 400, move: 200, turn: 600, dice: 100 };
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(tones[type], audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    }

    updateHUD() {
        document.getElementById('current-faction').textContent = this.turn;
        document.getElementById('res-forest').textContent = `${this.resources[FACTIONS.FOREST]} Tropas`;
        document.getElementById('res-invaders').textContent = `${this.resources[FACTIONS.INVADERS]} Tropas`;
        document.getElementById('phase-name').textContent = this.phase;
        
        const fActive = document.getElementById('stat-forest');
        const iActive = document.getElementById('stat-invaders');
        fActive.classList.toggle('active', this.turn === FACTIONS.FOREST);
        iActive.classList.toggle('active', this.turn === FACTIONS.INVADERS);
        
        const btn = document.getElementById('btn-next');
        btn.classList.toggle('invaders', this.turn === FACTIONS.INVADERS);
        
        // Progress Fill
        const idx = Object.values(PHASES).indexOf(this.phase) + 1;
        document.getElementById('phase-progress').style.width = `${(idx/4)*100}%`;
        document.querySelectorAll('.step-box').forEach((s, i) => s.classList.toggle('active', i < idx));

        if(this.selectedId) {
            const t = this.territories[this.selectedId];
            document.getElementById('selection-card').classList.remove('hidden');
            document.getElementById('sel-name').textContent = t.name;
            document.getElementById('sel-biome').textContent = `Bioma: ${BIOMES[t.biome].name}`;
            document.getElementById('sel-troops').textContent = t.troops;
            document.getElementById('sel-bonus').textContent = BIOMES[t.biome].bonus;
        } else {
            document.getElementById('selection-card').classList.add('hidden');
        }
    }

    addLog(m) {
        const l = document.getElementById('log-content');
        l.innerHTML = `<div class='log-item'>${m}</div>` + l.innerHTML;
    }

    render() {
        const svg = document.getElementById('svg-map');
        const linksGroup = document.getElementById('layer-links');
        const nodesGroup = document.getElementById('layer-nodes');
        linksGroup.innerHTML = ''; nodesGroup.innerHTML = '';

        Object.values(this.territories).forEach(t => {
            t.neighbors.forEach(nId => {
                const n = this.territories[nId];
                const active = this.selectedId === t.id && t.owner === this.turn;
                linksGroup.insertAdjacentHTML('beforeend', `<line class="link ${active ? 'active' : ''}" x1="${t.x}" y1="${t.y}" x2="${n.x}" y2="${n.y}" />`);
            });
        });

        Object.values(this.territories).forEach(t => {
            const isSel = this.selectedId === t.id;
            const isNeigh = this.selectedId && this.territories[this.selectedId].neighbors.includes(t.id);
            const color = t.owner === FACTIONS.FOREST ? 'var(--forest)' : 'var(--invader)';
            
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', `territory ${isSel ? 'selected' : ''} ${isNeigh ? 'neighbor' : ''}`);
            g.innerHTML = `
                <circle cx="${t.x}" cy="${t.y}" r="30" fill="${color}" stroke="${BIOMES[t.biome].color}" stroke-width="4" />
                <text x="${t.x}" y="${t.y+5}" text-anchor="middle" class="label-node">${t.id}</text>
                <circle cx="${t.x+22}" cy="${t.y-22}" r="12" fill="#020617" />
                <text x="${t.x+22}" y="${t.y-17}" text-anchor="middle" class="label-troops">${t.troops}</text>
            `;
            g.onclick = () => {
                if(this.phase === PHASES.COMBAT) this.handleCombatClick(t.id);
                else if(this.phase === PHASES.MOVE) this.handleMove(t.id);
                else this.selectedId = (this.selectedId === t.id) ? null : t.id;
                this.updateHUD(); this.render();
            };
            nodesGroup.appendChild(g);
        });
    }

    handleCombatClick(id) {
        if(!this.selectedId) {
            if(this.territories[id].owner === this.turn) this.selectedId = id;
            return;
        }
        const from = this.territories[this.selectedId];
        const to = this.territories[id];
        if(from.neighbors.includes(id) && from.owner !== to.owner && from.troops > 1) {
            this.launchBattle(this.selectedId, id);
        } else {
            this.selectedId = id;
        }
    }
}

new Game();
