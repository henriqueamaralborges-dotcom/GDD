import { gameState, FACTIONS } from './gameState.js';

export const CARD_TYPES = {
    FOREST: [
        { name: 'Cipó Expansivo', description: 'Move 3 peças para vizinho ignorando bloqueios.' },
        { name: 'Névoa Profunda', description: 'Bloqueia ataques a um território por 1 rodada.' },
        { name: 'Revoada de Araras', description: '+2 peças extras no início da jogada.' },
        { name: 'Frutos Fortificantes', description: 'Rerrolagem automática se tirar 1 no dado de combate.' }
    ],
    INVADERS: [
        { name: 'Buff - Motosserra Industrial', description: '+2 no valor total dos dados de ataque nesta rodada.' },
        { name: 'Buff - Drone de Vigilância', description: 'Revela as 3 próximas cartas da Floresta.' },
        { name: 'Risco - Lamaçal', description: 'Perde a Fase 4 (Combate) neste turno.' },
        { name: 'Risco - Protesto Ambiental', description: 'Remove 2 peças de 3 territórios diferentes.' }
    ],
    CHANCE: [
        { name: 'Sorte', description: 'Encontrou uma trilha secreta. Avance 3 casas.', type: 'luck' },
        { name: 'Revés', description: 'Fiscalização do IBAMA. O Invasor perde 2 rodadas e 3 máquinas.', type: 'setback' },
        { name: 'Reverse', description: 'Vento a favor. Troque de posição com o jogador mais próximo.', type: 'reverse' }
    ]
};

export function showEventModal(type = 'CHANCE') {
    const modal = document.getElementById('modal-container');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    modal.classList.remove('hidden');

    let deck = [];
    if (type === 'FOREST') deck = CARD_TYPES.FOREST;
    else if (type === 'INVADERS') deck = CARD_TYPES.INVADERS;
    else deck = CARD_TYPES.CHANCE;

    const card = deck[Math.floor(Math.random() * deck.length)];

    title.textContent = card.name;
    body.innerHTML = `<p>${card.description}</p>`;

    gameState.addLog(`Evento disparado: ${card.name}`);
    gameState.notify();
}

export function showQuizModal() {
    const modal = document.getElementById('modal-container');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    modal.classList.remove('hidden');
    title.textContent = 'Santuário: Perguntas do Guardião';

    const question = {
        q: 'Qual o principal bioma do Brasil?',
        options: ['Pantanal', 'Amazônia', 'Cerrado', 'Mata Atlântica'],
        correct: 1
    };

    body.innerHTML = `
        <p>${question.q}</p>
        <div id="quiz-options">
            ${question.options.map((opt, i) => `<button class="quiz-btn" style="display:block;width:100%;margin:5px 0;padding:10px;background:#34495e;color:white;border:none;border-radius:5px;" onclick="window.checkQuiz(${i}, ${question.correct})">${opt}</button>`).join('')}
        </div>
    `;

    window.checkQuiz = (selected, correct) => {
        if (selected === correct) {
            gameState.addLog('Acertou o Quiz! +2 peças extras.');
            gameState.resources[gameState.turn] += 2;
            body.innerHTML = `<p style="color:var(--forest-primary);font-weight:bold;">Correto! O Guardião te recompensou.</p>`;
        } else {
            gameState.addLog('Errou o Quiz! Pula o turno de ataque.');
            body.innerHTML = `<p style="color:var(--invader-primary);font-weight:bold;">Incorreto! O Guardião está descontente.</p>`;
        }
        gameState.notify();
    };
}
