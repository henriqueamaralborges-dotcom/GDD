import { gameState, BIOMES, FACTIONS } from './gameState.js';

export function drawMap() {
    const svgMap = document.getElementById('game-map');
    const territoriesLayer = document.getElementById('territories-layer');
    const connectionsLayer = document.getElementById('territory-connections');
    const statsLayer = document.getElementById('stats-layer');

    territoriesLayer.innerHTML = '';
    connectionsLayer.innerHTML = '';
    statsLayer.innerHTML = '';

    const nodes = Object.values(gameState.territories);
    const nodesPositions = calculatePositions(nodes);

    // Draw connections
    nodes.forEach(node => {
        const startPos = nodesPositions[node.id];
        node.neighbors.forEach(neighborId => {
            const endPos = nodesPositions[neighborId];
            if (endPos) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', startPos.x);
                line.setAttribute('y1', startPos.y);
                line.setAttribute('x2', endPos.x);
                line.setAttribute('y2', endPos.y);
                line.setAttribute('class', 'connection-line');
                connectionsLayer.appendChild(line);
            }
        });
    });

    // Draw territories
    nodes.forEach(node => {
        const pos = nodesPositions[node.id];
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', `territory ${node.owner === FACTIONS.FOREST ? 'forest' : 'invader'}`);
        g.dataset.id = node.id;

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', pos.x);
        circle.setAttribute('cy', pos.y);
        circle.setAttribute('r', 35);
        circle.setAttribute('class', `biome-${node.biome.toLowerCase()}`);
        circle.style.fill = node.owner === FACTIONS.FOREST ? '#27ae60' : '#c0392b';
        circle.style.stroke = BIOMES[node.biome].color;
        circle.style.strokeWidth = '4';

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', pos.x);
        label.setAttribute('y', pos.y + 5);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('class', 'territory-label');
        label.textContent = node.id;

        const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        countText.setAttribute('x', pos.x);
        countText.setAttribute('y', pos.y + 25);
        countText.setAttribute('text-anchor', 'middle');
        countText.setAttribute('class', 'territory-count');
        countText.textContent = node.troops;

        g.appendChild(circle);
        g.appendChild(label);
        g.appendChild(countText);

        g.addEventListener('click', () => handleTerritoryClick(node.id));
        territoriesLayer.appendChild(g);
    });
}

function calculatePositions(nodes) {
    const centers = {
        'AMAZON': { x: 250, y: 200 },
        'ATLANTIC': { x: 700, y: 250 },
        'CERRADO': { x: 500, y: 400 },
        'CAATINGA': { x: 750, y: 550 },
        'PANTANAL': { x: 250, y: 600 },
        'ROCKY': { x: 500, y: 700 }
    };

    const positions = {};
    const biomeCounts = {};

    nodes.forEach((node, i) => {
        const center = centers[node.biome];
        if (!biomeCounts[node.biome]) biomeCounts[node.biome] = 0;
        
        const count = biomeCounts[node.biome]++;
        const angle = (count / 8) * (2 * Math.PI);
        const distance = 80;
        
        positions[node.id] = {
            x: center.x + Math.cos(angle) * distance + (Math.random() * 20 - 10),
            y: center.y + Math.sin(angle) * distance + (Math.random() * 20 - 10)
        };
    });

    return positions;
}

function handleTerritoryClick(id) {
    const territory = gameState.territories[id];
    console.log(`Territory ${id} clicked`, territory);
    gameState.selectedTerritory = id;
    gameState.addLog(`Selecionado: ${territory.name} (${territory.owner})`);
    gameState.notify();
}

export function updateMapUI() {
    const nodes = Object.values(gameState.territories);
    nodes.forEach(node => {
        const g = document.querySelector(`.territory[data-id="${node.id}"]`);
        if (g) {
            const circle = g.querySelector('circle');
            const countText = g.querySelector('.territory-count');
            
            circle.style.fill = node.owner === FACTIONS.FOREST ? '#27ae60' : '#c0392b';
            circle.style.stroke = BIOMES[node.biome].color;
            if (gameState.selectedTerritory === node.id) {
                circle.style.stroke = '#fff';
                circle.style.strokeWidth = '8';
            } else {
                circle.style.strokeWidth = '4';
            }
            
            countText.textContent = node.troops;
        }
    });
}
