// Desenhos simples (feitos com formas) para as perguntas de inglês.
// Cada palavra tem: tradução em português e uma função que desenha no canvas 220x160.
const PICTURES = {
  tree: {
    pt: 'árvore',
    draw(c) {
      c.fillStyle = '#8d6e63'; c.fillRect(98, 90, 24, 55);
      c.fillStyle = '#43a047';
      circle(c, 110, 60, 38); circle(c, 80, 78, 26); circle(c, 140, 78, 26);
      c.fillStyle = '#66bb6a'; circle(c, 100, 50, 14);
      grass(c);
    }
  },
  house: {
    pt: 'casa',
    draw(c) {
      grass(c);
      c.fillStyle = '#ffcc80'; c.fillRect(60, 70, 100, 75);
      c.fillStyle = '#e53935';
      c.beginPath(); c.moveTo(50, 72); c.lineTo(110, 22); c.lineTo(170, 72); c.closePath(); c.fill();
      c.fillStyle = '#6d4c41'; c.fillRect(98, 105, 26, 40);
      c.fillStyle = '#81d4fa'; c.fillRect(70, 85, 22, 20); c.fillRect(132, 85, 22, 20);
    }
  },
  fish: {
    pt: 'peixe',
    draw(c) {
      c.fillStyle = '#4fc3f7'; c.fillRect(0, 0, 220, 160);
      c.fillStyle = '#ff9800';
      c.beginPath(); c.ellipse(100, 80, 55, 32, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(150, 80); c.lineTo(190, 50); c.lineTo(190, 110); c.closePath(); c.fill();
      c.fillStyle = '#fff'; circle(c, 70, 72, 9);
      c.fillStyle = '#000'; circle(c, 68, 72, 5);
      c.strokeStyle = '#e65100'; c.lineWidth = 3;
      c.beginPath(); c.arc(105, 80, 18, -1.2, 1.2); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.7)'; circle(c, 40, 40, 6); circle(c, 30, 22, 4);
    }
  },
  sun: {
    pt: 'sol',
    draw(c) {
      c.fillStyle = '#81d4fa'; c.fillRect(0, 0, 220, 160);
      c.strokeStyle = '#ffb300'; c.lineWidth = 6;
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        c.beginPath();
        c.moveTo(110 + Math.cos(a) * 45, 80 + Math.sin(a) * 45);
        c.lineTo(110 + Math.cos(a) * 65, 80 + Math.sin(a) * 65);
        c.stroke();
      }
      c.fillStyle = '#ffd600'; circle(c, 110, 80, 38);
      c.fillStyle = '#5d4037'; circle(c, 98, 72, 4); circle(c, 122, 72, 4);
      c.strokeStyle = '#5d4037'; c.lineWidth = 3;
      c.beginPath(); c.arc(110, 84, 14, 0.3, Math.PI - 0.3); c.stroke();
    }
  },
  boat: {
    pt: 'barco',
    draw(c) {
      c.fillStyle = '#4fc3f7'; c.fillRect(0, 110, 220, 50);
      c.fillStyle = '#795548';
      c.beginPath(); c.moveTo(40, 105); c.lineTo(180, 105); c.lineTo(155, 135); c.lineTo(65, 135); c.closePath(); c.fill();
      c.fillStyle = '#5d4037'; c.fillRect(107, 25, 6, 82);
      c.fillStyle = '#fff';
      c.beginPath(); c.moveTo(115, 30); c.lineTo(115, 95); c.lineTo(165, 95); c.closePath(); c.fill();
      c.fillStyle = '#e53935';
      c.beginPath(); c.moveTo(105, 40); c.lineTo(105, 95); c.lineTo(65, 95); c.closePath(); c.fill();
    }
  },
  star: {
    pt: 'estrela',
    draw(c) {
      c.fillStyle = '#1a237e'; c.fillRect(0, 0, 220, 160);
      c.fillStyle = '#ffeb3b';
      starShape(c, 110, 82, 60, 26, 5);
      c.fillStyle = '#fff'; circle(c, 30, 30, 2); circle(c, 190, 40, 2); circle(c, 40, 130, 2); circle(c, 180, 130, 2);
    }
  },
  apple: {
    pt: 'maçã',
    draw(c) {
      c.fillStyle = '#e53935'; circle(c, 95, 90, 40); circle(c, 125, 90, 40);
      c.fillStyle = '#6d4c41'; c.fillRect(107, 30, 6, 28);
      c.fillStyle = '#43a047';
      c.beginPath(); c.ellipse(130, 40, 18, 9, -0.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,.5)'; circle(c, 85, 75, 9);
    }
  },
  ball: {
    pt: 'bola',
    draw(c) {
      grass(c);
      c.fillStyle = '#fff'; circle(c, 110, 80, 50);
      c.fillStyle = '#e53935';
      c.beginPath(); c.arc(110, 80, 50, Math.PI * 1.1, Math.PI * 1.9); c.lineTo(110, 80); c.fill();
      c.fillStyle = '#1e88e5';
      c.beginPath(); c.arc(110, 80, 50, Math.PI * 0.1, Math.PI * 0.9); c.lineTo(110, 80); c.fill();
      c.strokeStyle = '#333'; c.lineWidth = 3; c.beginPath(); c.arc(110, 80, 50, 0, Math.PI * 2); c.stroke();
    }
  },
  flower: {
    pt: 'flor',
    draw(c) {
      grass(c);
      c.fillStyle = '#388e3c'; c.fillRect(107, 75, 6, 70);
      c.fillStyle = '#ec407a';
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        circle(c, 110 + Math.cos(a) * 24, 62 + Math.sin(a) * 24, 17);
      }
      c.fillStyle = '#ffd600'; circle(c, 110, 62, 15);
    }
  },
  moon: {
    pt: 'lua',
    draw(c) {
      c.fillStyle = '#1a237e'; c.fillRect(0, 0, 220, 160);
      c.fillStyle = '#fff59d'; circle(c, 110, 80, 50);
      c.fillStyle = '#1a237e'; circle(c, 135, 65, 45);
      c.fillStyle = '#fff'; circle(c, 40, 30, 2); circle(c, 180, 120, 2); circle(c, 170, 30, 3);
    }
  },
  key: {
    pt: 'chave',
    draw(c) {
      c.fillStyle = '#ffc107';
      circle(c, 65, 80, 32);
      c.fillRect(90, 72, 95, 16);
      c.fillRect(150, 88, 12, 22); c.fillRect(172, 88, 12, 16);
      c.fillStyle = '#e3f2fd'; circle(c, 65, 80, 14);
    }
  },
  cat: {
    pt: 'gato',
    draw(c) {
      c.fillStyle = '#ffa726';
      circle(c, 110, 85, 48);
      c.beginPath(); c.moveTo(70, 60); c.lineTo(78, 18); c.lineTo(105, 45); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(150, 60); c.lineTo(142, 18); c.lineTo(115, 45); c.closePath(); c.fill();
      c.fillStyle = '#2e7d32'; circle(c, 92, 78, 8); circle(c, 128, 78, 8);
      c.fillStyle = '#000'; circle(c, 92, 78, 3); circle(c, 128, 78, 3);
      c.fillStyle = '#e91e63'; circle(c, 110, 95, 5);
      c.strokeStyle = '#5d4037'; c.lineWidth = 2;
      [[-1, -4], [-1, 4], [1, -4], [1, 4]].forEach(([s, dy]) => {
        c.beginPath(); c.moveTo(110 + s * 12, 98); c.lineTo(110 + s * 50, 98 + dy); c.stroke();
      });
    }
  }
};

function circle(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }

function grass(c) {
  c.fillStyle = '#b3e5fc'; c.fillRect(0, 0, 220, 160);
  c.fillStyle = '#8bc34a'; c.fillRect(0, 140, 220, 20);
}

function starShape(c, cx, cy, outer, inner, points) {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + i * Math.PI / points;
    c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  c.closePath(); c.fill();
}

function drawPicture(canvas, word) {
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.save();
  c.scale(canvas.width / 220, canvas.height / 160);
  PICTURES[word].draw(c);
  c.restore();
}
