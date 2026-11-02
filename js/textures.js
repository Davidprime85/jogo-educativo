// Todas as imagens do jogo são desenhadas aqui com formas e cores (sem arquivos externos).
const Textures = {
  make(scene, key, w, h, draw) {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  },

  createAll(scene) {
    this.robot(scene);
    this.enemies(scene);
    this.items(scene);
    this.world(scene);
    this.weapons(scene);
    this.forest(scene);
  },

  // ---------- Robô Bolt (48x56) ----------
  robot(scene) {
    const OUT = 0x263238;
    const drawRobot = (g, legs, armUp) => {
      // pernas
      g.fillStyle(0x1e88e5);
      legs.forEach(([x, y, h]) => g.fillRoundedRect(x, y, 8, h, 3));
      g.fillStyle(0x0d47a1);
      legs.forEach(([x, y, h]) => g.fillRoundedRect(x - 1, y + h - 4, 10, 5, 2));
      // braços
      g.fillStyle(0x1e88e5);
      g.fillCircle(10, armUp ? 33 : 38, 4.5);
      g.fillCircle(38, 38, 4.5);
      // corpo
      g.lineStyle(2, OUT, 0.6);
      g.fillStyle(0xffffff);
      g.fillRoundedRect(13, 31, 22, 16, 7);
      g.strokeRoundedRect(13, 31, 22, 16, 7);
      g.fillStyle(0x29b6f6);
      g.fillCircle(24, 39, 3.5);
      // antena
      g.fillStyle(0x90a4ae);
      g.fillRect(23, 3, 2, 8);
      g.fillStyle(0xff5252);
      g.fillCircle(24, 4, 3.5);
      // cabeça
      g.fillStyle(0xffffff);
      g.fillRoundedRect(7, 8, 34, 25, 11);
      g.strokeRoundedRect(7, 8, 34, 25, 11);
      // visor
      g.fillStyle(0x102a43);
      g.fillRoundedRect(10, 12, 28, 17, 8);
      // olhos (olhando para a direita)
      g.fillStyle(0x4dd0e1);
      g.fillEllipse(21, 20, 6, 9);
      g.fillEllipse(31, 20, 6, 9);
      g.fillStyle(0xffffff);
      g.fillCircle(22, 18, 1.4);
      g.fillCircle(32, 18, 1.4);
      // brilho do visor
      g.fillStyle(0xffffff, 0.25);
      g.fillRoundedRect(12, 13, 10, 3, 1.5);
      // orelhas
      g.fillStyle(0x1e88e5);
      g.fillRoundedRect(4, 16, 4, 10, 2);
      g.fillRoundedRect(40, 16, 4, 10, 2);
    };
    this.make(scene, 'robot_idle', 48, 56, g => drawRobot(g, [[16, 45, 10], [25, 45, 10]]));
    this.make(scene, 'robot_walk1', 48, 56, g => drawRobot(g, [[13, 44, 11], [27, 46, 9]]));
    this.make(scene, 'robot_walk2', 48, 56, g => drawRobot(g, [[18, 46, 9], [23, 44, 11]]));
    this.make(scene, 'robot_jump', 48, 56, g => drawRobot(g, [[15, 44, 7], [26, 44, 7]], true));

    // tiro de energia
    this.make(scene, 'bullet', 18, 18, g => {
      g.fillStyle(0x00e5ff, 0.35); g.fillCircle(9, 9, 9);
      g.fillStyle(0x80deea); g.fillCircle(9, 9, 6);
      g.fillStyle(0xffffff); g.fillCircle(9, 9, 3);
    });
  },

  // ---------- Inimigos ----------
  enemies(scene) {
    const crab = (g, phase, s, crown) => {
      // s = escala (1 para o caranguejo normal, maior para o chefão)
      const S = v => v * s;
      g.fillStyle(0xbf360c);
      // pernas
      for (let i = 0; i < 3; i++) {
        const off = (i + phase) % 2 === 0 ? 0 : 2;
        g.fillRect(S(8 + i * 5), S(24 + off), S(3), S(8));
        g.fillRect(S(33 - i * 5), S(24 + (2 - off)), S(3), S(8));
      }
      // garras
      g.fillStyle(0xe64a19);
      g.fillCircle(S(5), S(14), S(6));
      g.fillCircle(S(39), S(14), S(6));
      g.fillStyle(0xfff3e0);
      g.fillTriangle(S(1), S(10), S(5), S(14), S(1), S(15));
      g.fillTriangle(S(43), S(10), S(39), S(14), S(43), S(15));
      // corpo
      g.fillStyle(0xf4511e);
      g.fillEllipse(S(22), S(22), S(30), S(18));
      g.fillStyle(0xff8a65);
      g.fillEllipse(S(22), S(19), S(18), S(6));
      // olhos
      g.fillStyle(0xbf360c);
      g.fillRect(S(16), S(7), S(2), S(8));
      g.fillRect(S(26), S(7), S(2), S(8));
      g.fillStyle(0xffffff);
      g.fillCircle(S(17), S(7), S(4));
      g.fillCircle(S(27), S(7), S(4));
      g.fillStyle(0x000000);
      g.fillCircle(S(16), S(7.5), S(2));
      g.fillCircle(S(26), S(7.5), S(2));
      if (crown) {
        g.fillStyle(0xffd600);
        g.fillTriangle(S(13), S(1.5), S(16), S(-3), S(19), S(1.5));
        g.fillTriangle(S(18), S(1.5), S(22), S(-4.5), S(26), S(1.5));
        g.fillTriangle(S(25), S(1.5), S(28), S(-3), S(31), S(1.5));
        g.fillRect(S(13), S(0.5), S(18), S(2.5));
        // sobrancelhas bravas
        g.fillStyle(0x3e2723);
        g.fillTriangle(S(12), S(2.5), S(20), S(4.5), S(12), S(4.5));
        g.fillTriangle(S(32), S(2.5), S(24), S(4.5), S(32), S(4.5));
      }
    };
    this.make(scene, 'crab1', 44, 34, g => crab(g, 0, 1));
    this.make(scene, 'crab2', 44, 34, g => crab(g, 1, 1));

    // Chefão: Rei Caranguejo (escala 3.4, com coroa) — desenhado deslocado para caber a coroa
    const BS = 3.4;
    this.make(scene, 'kingcrab1', Math.ceil(44 * BS), Math.ceil(38 * BS), g => { g.translateCanvas(0, 5 * BS); crab(g, 0, BS, true); });
    this.make(scene, 'kingcrab2', Math.ceil(44 * BS), Math.ceil(38 * BS), g => { g.translateCanvas(0, 5 * BS); crab(g, 1, BS, true); });

    // bolha que o chefão cospe
    this.make(scene, 'bubble', 26, 26, g => {
      g.fillStyle(0x81d4fa, 0.55); g.fillCircle(13, 13, 12);
      g.lineStyle(2, 0xe1f5fe, 1); g.strokeCircle(13, 13, 12);
      g.fillStyle(0xffffff, 0.9); g.fillCircle(9, 8, 3);
    });
  },

  // ---------- Itens ----------
  items(scene) {
    this.make(scene, 'coin', 22, 22, g => {
      g.fillStyle(0xc79100); g.fillCircle(11, 11, 11);
      g.fillStyle(0xffd600); g.fillCircle(11, 11, 9);
      g.fillStyle(0xffecb3); g.fillRect(9, 5, 4, 12);
    });

    const chest = (g, open) => {
      g.fillStyle(0x6d4c41); g.fillRoundedRect(2, 16, 44, 26, 4);
      g.fillStyle(0x8d6e63); g.fillRect(6, 20, 36, 18);
      g.fillStyle(0xffb300); g.fillRect(2, 24, 44, 4); g.fillRect(20, 16, 8, 26);
      if (open) {
        g.fillStyle(0xffd600); g.fillCircle(16, 16, 5); g.fillCircle(26, 14, 5); g.fillCircle(34, 17, 4);
        g.fillStyle(0x4e342e); g.fillRoundedRect(2, 0, 44, 10, 4);
      } else {
        g.fillStyle(0x795548); g.fillRoundedRect(2, 6, 44, 14, { tl: 10, tr: 10, bl: 0, br: 0 });
        g.fillStyle(0xffb300); g.fillRect(2, 16, 44, 3); g.fillRect(20, 6, 8, 14);
        g.fillStyle(0xfff8e1); g.fillRoundedRect(21, 17, 6, 9, 2);
        g.fillStyle(0x3e2723); g.fillRect(23, 20, 2, 4);
      }
    };
    this.make(scene, 'chest', 48, 42, g => chest(g, false));
    this.make(scene, 'chest_open', 48, 42, g => chest(g, true));

    // pedaço do mapa (prêmio do chefão)
    this.make(scene, 'mappiece', 44, 40, g => {
      g.fillStyle(0xd7b98e); g.fillRoundedRect(2, 2, 40, 36, 4);
      g.fillStyle(0xf1deb6); g.fillRoundedRect(5, 5, 34, 30, 3);
      g.lineStyle(2, 0x8d6e63, 1);
      g.beginPath(); g.moveTo(9, 28); g.lineTo(16, 20); g.lineTo(24, 24); g.lineTo(28, 14); g.strokePath();
      g.lineStyle(3, 0xe53935, 1);
      g.lineBetween(27, 9, 35, 17); g.lineBetween(35, 9, 27, 17);
    });

    this.make(scene, 'spark', 10, 10, g => { g.fillStyle(0xffffff); g.fillCircle(5, 5, 5); });
    this.make(scene, 'heart', 22, 20, g => {
      g.fillStyle(0xe53935);
      g.fillCircle(6, 7, 6); g.fillCircle(16, 7, 6);
      g.fillTriangle(0.5, 9, 21.5, 9, 11, 20);
    });
  },

  // ---------- Cenário ----------
  world(scene) {
    // chão de areia (64x80)
    this.make(scene, 'ground_beach', 64, 80, g => {
      g.fillStyle(0xe8b96a); g.fillRect(0, 0, 64, 80);
      g.fillStyle(0xd9a457);
      [[8, 30], [30, 45], [50, 28], [18, 62], [44, 66], [58, 50]].forEach(([x, y]) => g.fillCircle(x, y, 3));
      g.fillStyle(0xffe0a3); g.fillRect(0, 0, 64, 14);
      g.fillStyle(0xfff3d1);
      g.fillEllipse(16, 4, 18, 5); g.fillEllipse(48, 6, 14, 4);
      g.fillStyle(0xc9934a); g.fillRect(0, 14, 64, 3);
    });

    // tábua de madeira (64x20)
    this.make(scene, 'plank', 64, 20, g => {
      g.fillStyle(0x8d5a2b); g.fillRect(0, 0, 64, 20);
      g.fillStyle(0xa86d36); g.fillRect(0, 0, 64, 6);
      g.fillStyle(0x6b4220); g.fillRect(31, 0, 2, 20); g.fillRect(0, 17, 64, 3);
      g.fillStyle(0x4e2f15); g.fillCircle(6, 10, 1.8); g.fillCircle(58, 10, 1.8);
    });

    // água (64x60)
    this.make(scene, 'water', 64, 60, g => {
      g.fillStyle(0x01579b); g.fillRect(0, 8, 64, 52);
      g.fillStyle(0x0288d1); g.fillRect(0, 8, 64, 8);
      g.fillStyle(0xe1f5fe);
      g.fillEllipse(12, 8, 22, 8); g.fillEllipse(44, 8, 22, 8);
    });

    // placa de madeira
    this.make(scene, 'sign', 52, 60, g => {
      g.fillStyle(0x6d4c41); g.fillRect(23, 26, 6, 34);
      g.fillStyle(0x8d6e63); g.fillRoundedRect(2, 2, 48, 30, 5);
      g.fillStyle(0xbcaaa4); g.fillRoundedRect(6, 6, 40, 22, 3);
      g.fillStyle(0x4e342e);
      g.fillRect(11, 11, 22, 3); g.fillRect(11, 17, 30, 3);
      g.fillTriangle(36, 9, 42, 13, 36, 17);
    });

    // porta mágica de inglês (60x130)
    this.make(scene, 'door', 60, 130, g => {
      g.fillStyle(0x4a148c); g.fillRoundedRect(0, 0, 60, 130, { tl: 30, tr: 30, bl: 0, br: 0 });
      g.fillStyle(0x7b1fa2); g.fillRoundedRect(6, 6, 48, 124, { tl: 24, tr: 24, bl: 0, br: 0 });
      g.fillStyle(0x9c27b0); g.fillRect(14, 40, 32, 80);
      g.fillStyle(0xffd600);
      g.fillCircle(30, 26, 9);
      g.fillStyle(0x4a148c); g.fillRect(28, 21, 4, 10);
      g.fillStyle(0xffffff);
      [[18, 55], [42, 70], [22, 95], [40, 108]].forEach(([x, y]) => g.fillCircle(x, y, 2));
      g.fillStyle(0xffd600); g.fillCircle(44, 85, 4);
    });

    // bandeira de checkpoint
    const flag = (g, color) => {
      g.fillStyle(0x9e9e9e); g.fillRect(4, 0, 4, 70);
      g.fillStyle(color); g.fillTriangle(8, 2, 40, 14, 8, 26);
      g.fillStyle(0x616161); g.fillRect(0, 66, 12, 4);
    };
    this.make(scene, 'flag_off', 42, 70, g => flag(g, 0xbdbdbd));
    this.make(scene, 'flag_on', 42, 70, g => flag(g, 0x43a047));

    // coqueiro (decoração)
    this.make(scene, 'palm', 150, 220, g => {
      g.fillStyle(0x8d6e63);
      for (let i = 0; i < 9; i++) {
        const x = 70 + Math.sin(i / 3) * 8;
        g.fillRoundedRect(x - 8, 200 - i * 20, 16, 22, 6);
      }
      g.fillStyle(0x2e7d32);
      const leaf = (ang) => {
        const cx = 75, cy = 40;
        for (let k = 0; k < 6; k++) {
          const r = 10 + k * 9;
          g.fillCircle(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r + k * k * 0.9, 11 - k);
        }
      };
      [-2.8, -2.2, -1.5, -0.9, -0.3, 0.3, 2.9].forEach(leaf);
      g.fillStyle(0x6d4c41); g.fillCircle(68, 46, 6); g.fillCircle(80, 47, 6);
    });

    // nuvem
    this.make(scene, 'cloud', 140, 60, g => {
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(35, 38, 20); g.fillCircle(65, 28, 26); g.fillCircle(98, 36, 22); g.fillCircle(118, 44, 14);
      g.fillRect(30, 40, 92, 18);
    });

    // ilha distante
    this.make(scene, 'island', 260, 80, g => {
      g.fillStyle(0x7cb342, 0.8); g.fillEllipse(130, 70, 240, 60);
      g.fillStyle(0x558b2f, 0.8); g.fillEllipse(110, 52, 120, 50); g.fillEllipse(170, 58, 90, 36);
    });

    // concha e pedra (decoração)
    this.make(scene, 'shell', 26, 20, g => {
      g.fillStyle(0xf8bbd0); g.fillEllipse(13, 12, 24, 16);
      g.fillStyle(0xf48fb1); g.fillRect(12, 4, 2, 15); g.fillRect(6, 7, 2, 10); g.fillRect(18, 7, 2, 10);
    });
    this.make(scene, 'rock', 50, 30, g => {
      g.fillStyle(0x90a4ae); g.fillEllipse(25, 18, 48, 26);
      g.fillStyle(0xb0bec5); g.fillEllipse(20, 12, 24, 10);
    });
  },

  // ---------- Tiros das armas ----------
  weapons(scene) {
    this.make(scene, 'bullet_tri', 16, 16, g => {
      g.fillStyle(0xffab00, 0.4); g.fillCircle(8, 8, 8);
      g.fillStyle(0xffd54f); g.fillCircle(8, 8, 5);
      g.fillStyle(0xffffff); g.fillCircle(8, 8, 2.5);
    });
  },

  // ---------- Fase 2: Floresta ----------
  forest(scene) {
    // chão de terra com grama (64x80)
    this.make(scene, 'ground_forest', 64, 80, g => {
      g.fillStyle(0x6d4c41); g.fillRect(0, 0, 64, 80);
      g.fillStyle(0x5d4037);
      [[10, 30], [34, 44], [54, 30], [20, 62], [46, 68], [60, 54]].forEach(([x, y]) => g.fillCircle(x, y, 4));
      g.fillStyle(0x8d6e63); g.fillCircle(28, 26, 2); g.fillCircle(8, 50, 2);
      g.fillStyle(0x2e7d32); g.fillRect(0, 10, 64, 6);
      g.fillStyle(0x66bb6a); g.fillRect(0, 0, 64, 12);
      g.fillStyle(0x81c784);
      for (let x = 2; x < 64; x += 8) g.fillTriangle(x, 2, x + 3, -4, x + 6, 2);
      g.fillStyle(0x4caf50); g.fillRect(0, 9, 64, 3);
    });

    // galho (plataforma fixa, 64x20)
    this.make(scene, 'branch', 64, 20, g => {
      g.fillStyle(0x6d4c41); g.fillRect(0, 2, 64, 18);
      g.fillStyle(0x8d6e63); g.fillRect(0, 6, 64, 4);
      g.fillStyle(0x7cb342); g.fillRect(0, 0, 64, 5);
      g.fillStyle(0x558b2f); g.fillEllipse(14, 3, 14, 6); g.fillEllipse(46, 2, 12, 6);
      g.fillStyle(0x4e342e); g.fillCircle(30, 14, 2);
    });

    // tronco que se move (128x24)
    this.make(scene, 'log', 128, 24, g => {
      g.fillStyle(0x795548); g.fillRoundedRect(0, 2, 128, 22, 10);
      g.fillStyle(0x8d6e63); g.fillRect(8, 8, 112, 4);
      g.fillStyle(0xd7ccc8); g.fillCircle(6, 13, 8); g.fillCircle(122, 13, 8);
      g.fillStyle(0xa1887f); g.fillCircle(6, 13, 4); g.fillCircle(122, 13, 4);
      g.fillStyle(0x7cb342); g.fillRoundedRect(14, 0, 100, 5, 2);
    });

    // pântano (64x60)
    this.make(scene, 'swamp', 64, 60, g => {
      g.fillStyle(0x33691e); g.fillRect(0, 8, 64, 52);
      g.fillStyle(0x558b2f); g.fillRect(0, 8, 64, 7);
      g.fillStyle(0x9ccc65);
      g.fillCircle(12, 22, 3); g.fillCircle(40, 30, 2); g.fillCircle(52, 18, 2.5);
      g.fillStyle(0x7cb342); g.fillEllipse(18, 9, 22, 6); g.fillEllipse(48, 9, 18, 6);
    });

    // cogumelo-trampolim (72x52)
    this.make(scene, 'mushroom', 72, 52, g => {
      g.fillStyle(0xfff3e0); g.fillRoundedRect(26, 28, 20, 24, 6);
      g.fillStyle(0xffe0b2); g.fillRect(30, 34, 4, 14);
      g.fillStyle(0xe53935);
      g.slice(36, 32, 35, Math.PI, 0, false); g.fillPath();
      g.fillStyle(0xc62828); g.fillRect(1, 29, 70, 4);
      g.fillStyle(0xffffff);
      g.fillCircle(20, 18, 5); g.fillCircle(40, 10, 6); g.fillCircle(55, 22, 4); g.fillCircle(30, 26, 3);
    });

    // árvores, arbustos e cogumelos (decoração)
    this.make(scene, 'tree_big', 200, 330, g => {
      g.fillStyle(0x5d4037);
      g.fillRect(84, 130, 32, 200);
      g.fillTriangle(60, 330, 84, 280, 84, 330); g.fillTriangle(140, 330, 116, 280, 116, 330);
      g.fillStyle(0x4e342e); g.fillRect(96, 170, 4, 60); g.fillRect(104, 240, 4, 50);
      g.fillStyle(0x2e7d32);
      g.fillCircle(100, 90, 70); g.fillCircle(45, 120, 45); g.fillCircle(155, 120, 45);
      g.fillStyle(0x388e3c); g.fillCircle(80, 70, 40); g.fillCircle(135, 85, 35);
      g.fillStyle(0x43a047); g.fillCircle(70, 55, 18); g.fillCircle(120, 60, 15);
    });
    this.make(scene, 'tree_far', 160, 260, g => {
      g.fillStyle(0xffffff);
      g.fillRect(70, 110, 20, 150);
      g.fillCircle(80, 80, 60); g.fillCircle(40, 110, 38); g.fillCircle(120, 110, 38);
    });
    this.make(scene, 'bush', 90, 46, g => {
      g.fillStyle(0x2e7d32); g.fillCircle(24, 28, 20); g.fillCircle(66, 28, 20); g.fillCircle(45, 20, 22);
      g.fillStyle(0x43a047); g.fillCircle(38, 16, 9); g.fillCircle(60, 20, 7);
      g.fillStyle(0xe53935); g.fillCircle(30, 30, 3); g.fillCircle(56, 34, 3); g.fillCircle(46, 22, 3);
    });
    this.make(scene, 'shroom', 26, 22, g => {
      g.fillStyle(0xfff3e0); g.fillRect(10, 10, 6, 12);
      g.fillStyle(0xff7043); g.slice(13, 12, 12, Math.PI, 0, false); g.fillPath();
      g.fillStyle(0xffffff); g.fillCircle(8, 7, 2); g.fillCircle(17, 5, 2);
    });

    // ----- vilões da floresta -----
    // besouro (anda no chão)
    const beetle = (g, phase) => {
      g.fillStyle(0x263238);
      for (let i = 0; i < 3; i++) {
        const off = (i + phase) % 2 ? 2 : 0;
        g.fillRect(8 + i * 10, 20 + off, 3, 7);
      }
      g.fillStyle(0xe53935); g.fillEllipse(22, 15, 34, 20);
      g.fillStyle(0xff8a80); g.fillEllipse(18, 10, 14, 6);
      g.fillStyle(0x212121); g.fillRect(21, 6, 2, 18);
      g.fillCircle(14, 16, 3); g.fillCircle(30, 17, 3); g.fillCircle(25, 10, 2);
      g.fillStyle(0x37474f); g.fillCircle(5, 16, 7);
      g.fillStyle(0xffeb3b); g.fillCircle(3, 14, 2.2);
      g.fillStyle(0x37474f); g.fillRect(0, 7, 2, 6);
    };
    this.make(scene, 'beetle1', 40, 28, g => beetle(g, 0));
    this.make(scene, 'beetle2', 40, 28, g => beetle(g, 1));

    // morcego
    const bat = (g, up) => {
      g.fillStyle(0x4a148c);
      if (up) { g.fillTriangle(24, 16, 2, 2, 10, 20); g.fillTriangle(24, 16, 46, 2, 38, 20); }
      else { g.fillTriangle(24, 14, 0, 24, 12, 10); g.fillTriangle(24, 14, 48, 24, 36, 10); }
      g.fillStyle(0x6a1b9a); g.fillCircle(24, 16, 10);
      g.fillTriangle(17, 9, 19, 1, 22, 8); g.fillTriangle(31, 9, 29, 1, 26, 8);
      g.fillStyle(0xff1744); g.fillCircle(20, 15, 2.5); g.fillCircle(28, 15, 2.5);
      g.fillStyle(0xffffff); g.fillTriangle(21, 21, 23, 21, 22, 24); g.fillTriangle(25, 21, 27, 21, 26, 24);
    };
    this.make(scene, 'bat1', 48, 30, g => bat(g, true));
    this.make(scene, 'bat2', 48, 30, g => bat(g, false));

    // aranha-robô
    this.make(scene, 'spider', 44, 36, g => {
      g.lineStyle(3, 0x212121, 1);
      for (let i = 0; i < 4; i++) {
        const y = 14 + i * 5;
        g.lineBetween(22, 18, 4, y - 6); g.lineBetween(4, y - 6, 1, y + 6);
        g.lineBetween(22, 18, 40, y - 6); g.lineBetween(40, y - 6, 43, y + 6);
      }
      g.fillStyle(0x424242); g.fillCircle(22, 18, 12);
      g.fillStyle(0x7b1fa2); g.fillCircle(22, 14, 6);
      g.fillStyle(0xffeb3b); g.fillCircle(18, 21, 2.5); g.fillCircle(26, 21, 2.5);
      g.fillStyle(0xff1744); g.fillCircle(22, 25, 2);
    });

    // macaco-robô (joga cocos)
    const monkey = (g, armUp) => {
      g.fillStyle(0x6d4c41);
      g.lineStyle(4, 0x6d4c41, 1);
      g.beginPath(); g.arc(36, 36, 10, Math.PI * 0.2, Math.PI * 1.4, true); g.strokePath();
      g.fillRoundedRect(12, 26, 20, 20, 8);
      g.fillCircle(22, 16, 12);
      g.fillStyle(0x90a4ae); g.fillCircle(9, 14, 5); g.fillCircle(35, 14, 5);
      g.fillStyle(0xffcc80); g.fillEllipse(22, 19, 16, 12); g.fillEllipse(22, 34, 12, 10);
      g.fillStyle(0x000000); g.fillCircle(18, 15, 2); g.fillCircle(26, 15, 2);
      g.fillStyle(0x80deea); g.fillRect(15, 11, 14, 2);
      g.fillStyle(0x6d4c41);
      if (armUp) g.fillRoundedRect(28, 4, 7, 22, 3); else g.fillRoundedRect(29, 26, 7, 16, 3);
      g.fillRoundedRect(8, 28, 7, 14, 3);
      g.fillRoundedRect(14, 42, 7, 6, 2); g.fillRoundedRect(23, 42, 7, 6, 2);
    };
    this.make(scene, 'monkey1', 46, 48, g => monkey(g, false));
    this.make(scene, 'monkey2', 46, 48, g => monkey(g, true));

    this.make(scene, 'coconut', 20, 20, g => {
      g.fillStyle(0x5d4037); g.fillCircle(10, 10, 9);
      g.fillStyle(0x3e2723); g.fillCircle(7, 7, 1.6); g.fillCircle(12, 6, 1.6); g.fillCircle(9, 11, 1.6);
      g.fillStyle(0x8d6e63); g.fillCircle(13, 13, 3);
    });

    this.make(scene, 'shockwave', 44, 28, g => {
      g.fillStyle(0xff6f00, 0.5); g.fillEllipse(22, 20, 44, 18);
      g.fillStyle(0xffca28); g.fillEllipse(22, 20, 32, 12);
      g.fillStyle(0xfff8e1); g.fillEllipse(22, 20, 16, 6);
      g.fillStyle(0xffca28); g.fillTriangle(10, 16, 14, 2, 18, 16); g.fillTriangle(26, 16, 30, 4, 34, 16);
    });

    // Chefão: Robo-Gorila (150x140)
    const gorilla = (g, step) => {
      const a = step ? -6 : 0;
      g.fillStyle(0x37474f);
      g.fillRoundedRect(42, 108, 26, 30, 8); g.fillRoundedRect(82, 108, 26, 30, 8);
      g.fillStyle(0x455a64);
      g.fillRoundedRect(4, 50 + a, 30, 78, 14); g.fillRoundedRect(116, 50 - a, 30, 78, 14);
      g.fillStyle(0x90a4ae); g.fillCircle(19, 126 + a, 15); g.fillCircle(131, 126 - a, 15);
      g.fillStyle(0x546e7a); g.fillRoundedRect(22, 40, 106, 80, 30);
      g.fillStyle(0x90a4ae); g.fillRoundedRect(46, 62, 58, 40, 12);
      g.fillStyle(0xff1744); g.fillCircle(75, 82, 8);
      g.fillStyle(0xffcdd2); g.fillCircle(73, 80, 3);
      g.fillStyle(0x37474f); g.fillRoundedRect(45, 4, 60, 48, 18);
      g.fillStyle(0xb0bec5); g.fillRoundedRect(52, 20, 46, 28, 12);
      g.fillStyle(0xff1744); g.fillRect(58, 26, 12, 6); g.fillRect(80, 26, 12, 6);
      g.fillStyle(0x263238);
      g.fillTriangle(56, 18, 72, 24, 56, 24); g.fillTriangle(94, 18, 78, 24, 94, 24);
      g.fillRect(62, 39, 26, 3); g.fillRect(62, 43, 26, 2);
      g.fillStyle(0xffd600); g.fillRect(73, 0, 4, 8); g.fillCircle(75, 2, 4);
    };
    this.make(scene, 'gorilla1', 150, 140, g => gorilla(g, false));
    this.make(scene, 'gorilla2', 150, 140, g => gorilla(g, true));
  }
};
