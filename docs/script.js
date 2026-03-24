const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const healthFill = document.getElementById('health-fill');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const title = document.getElementById('title');
const message = document.getElementById('message');

let score = 0;
let health = 100;
let gameActive = false;
let projectiles = [];
let enemies = [];
let mouse = { x: 0, y: 0 };

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('click', () => {
    if (gameActive) spawnProjectile();
});

function spawnProjectile() {
    const angle = Math.atan2(mouse.y - canvas.height / 2, mouse.x - canvas.width / 2);
    projectiles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        velocity: {
            x: Math.cos(angle) * 8,
            y: Math.sin(angle) * 8
        },
        radius: 6,
        color: '#2ecc71'
    });
}

function spawnEnemy() {
    if (!gameActive) return;
    
    let x, y;
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 - 30 : canvas.width + 30;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? 0 - 30 : canvas.height + 30;
    }
    
    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
    enemies.push({
        x: x,
        y: y,
        velocity: {
            x: Math.cos(angle) * (1.5 + score / 500),
            y: Math.sin(angle) * (1.5 + score / 500)
        },
        radius: 15,
        color: '#e74c3c'
    });
}

setInterval(spawnEnemy, 1000);

function resetGame() {
    score = 0;
    health = 100;
    projectiles = [];
    enemies = [];
    scoreElement.textContent = `Pontos: ${score}`;
    healthFill.style.width = '100%';
    gameActive = true;
    overlay.classList.add('hidden');
    overlay.style.display = 'none';
}

startBtn.addEventListener('click', resetGame);

function draw() {
    ctx.fillStyle = 'rgba(26, 26, 26, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Sacred Tree (Center)
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 40, 0, Math.PI * 2);
    ctx.fillStyle = '#27ae60';
    ctx.fill();
    ctx.closePath();

    // Sacred Tree Glow
    const glow = 15 + Math.sin(Date.now() / 200) * 5;
    ctx.shadowBlur = glow;
    ctx.shadowColor = '#2ecc71';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Guardian (Player cursor relative)
    const angle = Math.atan2(mouse.y - canvas.height / 2, mouse.x - canvas.width / 2);
    const guardX = canvas.width / 2 + Math.cos(angle) * 60;
    const guardY = canvas.height / 2 + Math.sin(angle) * 60;
    
    ctx.beginPath();
    ctx.arc(guardX, guardY, 12, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();

    // Update & Draw Projectiles
    projectiles.forEach((p, i) => {
        p.x += p.velocity.x;
        p.y += p.velocity.y;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.closePath();
        
        // Remove offscreen
        if (p.x < -p.radius || p.x > canvas.width + p.radius || p.y < -p.radius || p.y > canvas.height + p.radius) {
            projectiles.splice(i, 1);
        }
    });

    // Update & Draw Enemies
    enemies.forEach((e, i) => {
        e.x += e.velocity.x;
        e.y += e.velocity.y;
        
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fillStyle = e.color;
        ctx.fill();
        ctx.closePath();
        
        // Collision with center (The Tree)
        const distToCenter = Math.hypot(canvas.width / 2 - e.x, canvas.height / 2 - e.y);
        if (distToCenter < 55) {
            enemies.splice(i, 1);
            health -= 10;
            healthFill.style.width = `${health}%`;
            if (health <= 0) gameOver();
        }

        // Collision with projectiles
        projectiles.forEach((p, pi) => {
            const dist = Math.hypot(e.x - p.x, e.y - p.y);
            if (dist < e.radius + p.radius) {
                enemies.splice(i, 1);
                projectiles.splice(pi, 1);
                score += 10;
                scoreElement.textContent = `Pontos: ${score}`;
            }
        });
    });

    requestAnimationFrame(draw);
}

function gameOver() {
    gameActive = false;
    overlay.style.display = 'block';
    overlay.classList.remove('hidden');
    title.textContent = 'FIM DE JOGO';
    message.textContent = `Você protegeu a floresta e fez ${score} pontos!`;
    startBtn.textContent = 'RECOMEÇAR';
}

draw();
