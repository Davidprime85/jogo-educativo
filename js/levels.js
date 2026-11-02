// Dados das fases. Coordenadas em pixels; o chão fica em GROUND_Y.
const GROUND_Y = 460;

const LEVELS = [
  {
    id: 1,
    name: 'Beach',
    namePt: 'Praia',
    ready: true,
    width: 5460,
    theme: 'beach',
    startX: 300,
    intro: { en: 'Beep boop! I am Bolt. I must find the treasure. Let\'s go!', pt: 'Bip bop! Eu sou o Bolt. Preciso achar o tesouro. Vamos lá!' },

    // trechos de chão [início, fim]; os buracos entre eles têm água
    ground: [[0, 850], [970, 1650], [1790, 2500], [2640, 3500], [3640, 5460]],

    // plataformas de madeira [x, y, largura] (dá para subir por baixo)
    platforms: [
      [400, 360, 128], [600, 290, 128],
      [1250, 350, 160],
      [1690, 330, 96],
      [2000, 360, 128], [2200, 280, 128], [2400, 200, 128],
      [2800, 350, 128],
      [3150, 340, 192],
      [3540, 360, 96],
      [4000, 350, 128], [4200, 280, 128],
      [4650, 340, 128], [5150, 340, 128]
    ],

    // moedas: {x, y, n (quantidade), dx (espaço)}
    coins: [
      { x: 200, y: 420, n: 4, dx: 40 },
      { x: 430, y: 320, n: 3, dx: 35 },
      { x: 630, y: 250, n: 3, dx: 35 },
      { x: 870, y: 380, n: 3, dx: 40 },
      { x: 1270, y: 310, n: 4, dx: 35 },
      { x: 1700, y: 290, n: 2, dx: 40 },
      { x: 2020, y: 320, n: 3, dx: 35 },
      { x: 2420, y: 160, n: 4, dx: 30 },
      { x: 2540, y: 380, n: 3, dx: 40 },
      { x: 2820, y: 310, n: 3, dx: 35 },
      { x: 3170, y: 300, n: 5, dx: 35 },
      { x: 3530, y: 320, n: 3, dx: 40 },
      { x: 4020, y: 310, n: 3, dx: 35 },
      { x: 4220, y: 240, n: 3, dx: 35 }
    ],

    // inimigos: tipo, posição e área por onde anda
    enemies: [
      { type: 'crab', x: 1150, min: 1000, max: 1400 },
      { type: 'crab', x: 1950, min: 1820, max: 2150 },
      { type: 'crab', x: 2300, min: 2230, max: 2480 },
      { type: 'crab', x: 2800, min: 2660, max: 3250 },
      { type: 'crab', x: 3900, min: 3700, max: 4100 },
      { type: 'crab', x: 4300, min: 4220, max: 4440 }
    ],

    // baús de matemática: o prêmio é munição ou vida
    chests: [
      { x: 1560, reward: 'ammo' },
      { x: 2450, reward: 'life' },
      { x: 4150, reward: 'ammo' }
    ],

    // portas de inglês
    doors: [
      { x: 3380, word: 'fish' }
    ],

    // bandeiras de checkpoint (onde o robô volta se cair)
    checkpoints: [1850, 3700],

    // placas com instruções em inglês
    signs: [
      { x: 260,  en: 'Use the arrows to walk. Press SPACE to jump.', pt: 'Use as setas para andar. Aperte ESPAÇO para pular.' },
      { x: 780,  en: 'Jump over the water!', pt: 'Pule por cima da água!' },
      { x: 1050, en: 'Look, a crab! Jump on it or press X to shoot.', pt: 'Olha, um caranguejo! Pule em cima dele ou aperte X para atirar.' },
      { x: 1480, en: 'Open the chest. Solve the math to win a prize!', pt: 'Abra o baú. Resolva a conta para ganhar um prêmio!' },
      { x: 2350, en: 'Go up! There are coins in the sky.', pt: 'Suba! Tem moedas lá no alto.' },
      { x: 3260, en: 'The magic door speaks English. Choose the right word!', pt: 'A porta mágica fala inglês. Escolha a palavra certa!' },
      { x: 4400, en: 'Be brave! The boss is near. Hit him, then answer the questions!', pt: 'Seja corajoso! O chefão está perto. Acerte ele e depois responda às perguntas!' }
    ],

    boss: {
      type: 'kingCrab',
      arenaX: 4500,
      x: 5200,
      hp: 3,
      name: 'King Crab',
      intro: { en: 'I am King Crab! This beach is MINE! Can you do math, little robot?', pt: 'Eu sou o Rei Caranguejo! Esta praia é MINHA! Você sabe fazer contas, robozinho?' },
      defeat: { en: 'Ouch! You win, little robot. Take this piece of the map!', pt: 'Ai! Você venceu, robozinho. Pegue este pedaço do mapa!' }
    }
  },
  {
    id: 2,
    name: 'Forest',
    namePt: 'Floresta',
    ready: true,
    width: 6200,
    theme: 'forest',
    startX: 300,
    intro: { en: 'A dark forest! The second piece of the map is here. Let\'s go!', pt: 'Uma floresta escura! O segundo pedaço do mapa está aqui. Vamos lá!' },

    ground: [[0, 900], [1040, 1700], [2000, 2800], [2940, 3900], [4150, 4800], [4950, 6200]],

    platforms: [
      [350, 360, 128], [560, 290, 128],
      [1200, 350, 128], [1400, 270, 128],
      [2150, 360, 128], [2350, 280, 128], [2550, 200, 128],
      [3100, 340, 160], [3500, 330, 128],
      [4300, 350, 128], [4550, 280, 128],
      [5390, 340, 128], [5900, 340, 128]
    ],

    // troncos que se movem: x/y = posição inicial, axis = direção, range = distância
    movers: [
      { x: 1710, y: 400, axis: 'x', range: 160, speed: 80 },
      { x: 3290, y: 380, axis: 'y', range: 200, speed: 60 },
      { x: 3910, y: 400, axis: 'x', range: 110, speed: 70 }
    ],

    // cogumelos-trampolim (x no chão)
    mushrooms: [760, 4700],

    coins: [
      { x: 200, y: 420, n: 4, dx: 40 }, { x: 380, y: 320, n: 3, dx: 35 }, { x: 590, y: 250, n: 3, dx: 35 },
      { x: 710, y: 170, n: 4, dx: 32 }, { x: 930, y: 380, n: 3, dx: 40 }, { x: 1220, y: 310, n: 3, dx: 35 },
      { x: 1420, y: 230, n: 3, dx: 35 }, { x: 1730, y: 350, n: 4, dx: 40 }, { x: 2170, y: 320, n: 3, dx: 35 },
      { x: 2370, y: 240, n: 3, dx: 35 }, { x: 2570, y: 160, n: 4, dx: 30 }, { x: 2830, y: 380, n: 3, dx: 40 },
      { x: 3120, y: 300, n: 4, dx: 35 }, { x: 3300, y: 140, n: 3, dx: 35 }, { x: 3520, y: 290, n: 3, dx: 35 },
      { x: 3940, y: 350, n: 4, dx: 40 }, { x: 4320, y: 310, n: 3, dx: 35 }, { x: 4570, y: 240, n: 3, dx: 35 },
      { x: 4660, y: 170, n: 3, dx: 35 }, { x: 4840, y: 380, n: 3, dx: 40 }, { x: 5000, y: 420, n: 4, dx: 40 }
    ],

    // tipos: beetle (anda no chão), bat (voa), spider (desce no fio), monkey (joga cocos)
    enemies: [
      { type: 'beetle', x: 600, min: 420, max: 880 },
      { type: 'bat', x: 1300, y: 260, min: 1100, max: 1550 },
      { type: 'spider', x: 1500, top: 120 },
      { type: 'beetle', x: 2250, min: 2020, max: 2400 },
      { type: 'monkey', x: 2720 },
      { type: 'bat', x: 3150, y: 220, min: 3000, max: 3450 },
      { type: 'spider', x: 3620, top: 100 },
      { type: 'monkey', x: 4450 },
      { type: 'bat', x: 4650, y: 250, min: 4450, max: 4880 },
      { type: 'beetle', x: 5050, min: 4960, max: 5220 }
    ],

    chests: [
      { x: 1600, reward: 'ammo' },
      { x: 3450, reward: 'life' },
      { x: 4280, reward: 'ammo' }
    ],

    // porta com figura (word) e porta com frase para completar (sentence)
    doors: [
      { x: 2440, word: 'tree' },
      { x: 3820, sentence: true }
    ],

    checkpoints: [2060, 4200],

    signs: [
      { x: 220,  en: 'Welcome to the Forest! Watch out for bats and spiders.', pt: 'Bem-vindo à Floresta! Cuidado com os morcegos e as aranhas.' },
      { x: 680,  en: 'Jump on the red mushroom to fly high!', pt: 'Pule no cogumelo vermelho para voar alto!' },
      { x: 1640, en: 'Ride the moving log to cross the swamp.', pt: 'Suba no tronco que se move para atravessar o pântano.' },
      { x: 2330, en: 'Look at the picture and choose the English word.', pt: 'Olhe a figura e escolha a palavra em inglês.' },
      { x: 2560, en: 'The monkey throws coconuts. Shoot them or jump!', pt: 'O macaco joga cocos. Atire neles ou pule!' },
      { x: 3240, en: 'Stand on the log. It goes up!', pt: 'Fique em cima do tronco. Ele sobe!' },
      { x: 3720, en: 'Complete the sentence to open the door.', pt: 'Complete a frase para abrir a porta.' },
      { x: 5120, en: 'The Robo-Gorilla is here! Jump over his shock waves!', pt: 'O Robo-Gorila está aqui! Pule as ondas de choque dele!' }
    ],

    boss: {
      type: 'gorilla',
      arenaX: 5240,
      x: 6000,
      hp: 4,
      name: 'Robo-Gorilla',
      intro: { en: 'ROAR! I am Robo-Gorilla! Nobody passes my forest!', pt: 'ROAR! Eu sou o Robo-Gorila! Ninguém passa pela minha floresta!' },
      defeat: { en: 'Oh no... you are too smart! Take the second piece of the map.', pt: 'Ah não... você é esperto demais! Pegue o segundo pedaço do mapa.' }
    }
  },
  { id: 3, name: 'Cave',        namePt: 'Caverna',       ready: false },
  { id: 4, name: 'Volcano',     namePt: 'Vulcão',        ready: false },
  { id: 5, name: 'Pirate Ship', namePt: 'Navio Pirata',  ready: false }
];
