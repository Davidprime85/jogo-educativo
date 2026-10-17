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
    startX: 90,
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
  { id: 2, name: 'Forest',      namePt: 'Floresta',      ready: false },
  { id: 3, name: 'Cave',        namePt: 'Caverna',       ready: false },
  { id: 4, name: 'Volcano',     namePt: 'Vulcão',        ready: false },
  { id: 5, name: 'Pirate Ship', namePt: 'Navio Pirata',  ready: false }
];
