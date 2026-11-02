// Armas do Bolt e itens da oficina (comprados com moedas, sempre com uma conta).

// Atributos por nível de potência (1 a 3)
const WEAPONS = {
  blaster: {
    name: 'Blaster', namePt: 'Blaster', icon: '⚡', texture: 'bullet', ammo: 1, cooldown: 250,
    levels: [
      { dmg: 1, speed: 560, scale: 1, pierce: 0 },
      { dmg: 2, speed: 640, scale: 1.35, pierce: 0 },
      { dmg: 3, speed: 700, scale: 1.7, pierce: 1 }
    ],
    angles: [0]
  },
  triple: {
    name: 'Triple Shot', namePt: 'Tiro Triplo', icon: '🔱', texture: 'bullet_tri', ammo: 2, cooldown: 380,
    levels: [
      { dmg: 1, speed: 540, scale: 1, pierce: 0 },
      { dmg: 2, speed: 600, scale: 1.3, pierce: 0 },
      { dmg: 3, speed: 660, scale: 1.6, pierce: 1 }
    ],
    angles: [-14, 0, 14]
  }
};

// Vida dos inimigos (quantos pontos de dano aguentam)
const ENEMY_HP = { crab: 1, beetle: 1, bat: 1, spider: 2, monkey: 2 };

// Itens da oficina. "unlock" = a fase que precisa estar liberada para aparecer.
const SHOP_ITEMS = [
  {
    id: 'blaster', icon: '⚡', name: 'Blaster power', namePt: 'Potência do Blaster',
    desc: 'Bigger and stronger shots.', descPt: 'Tiros maiores e mais fortes.',
    unlock: 1, prices: { 2: 20, 3: 40 },
    level: s => s.weapons.power.blaster,
    apply: s => { s.weapons.power.blaster++; }
  },
  {
    id: 'triple', icon: '🔱', name: 'Triple Shot', namePt: 'Tiro Triplo',
    desc: '3 shots at once! Great against bats.', descPt: '3 tiros de uma vez! Ótimo contra morcegos.',
    unlock: 2, prices: { 1: 30, 2: 35, 3: 55 },
    level: s => s.weapons.owned.includes('triple') ? s.weapons.power.triple : 0,
    apply: s => {
      if (!s.weapons.owned.includes('triple')) { s.weapons.owned.push('triple'); s.weapons.equipped = 'triple'; }
      else s.weapons.power.triple++;
    }
  },
  {
    id: 'tank', icon: '🔋', name: 'Energy tank', namePt: 'Tanque de energia',
    desc: 'Start each level with +5 energy.', descPt: 'Comece cada fase com +5 de energia.',
    unlock: 1, prices: { 2: 25, 3: 45 },
    level: s => s.weapons.tank,
    apply: s => { s.weapons.tank++; }
  },
  { id: 'bomb', icon: '💣', name: 'Bouncing Bomb', namePt: 'Bomba quicante', unlock: 3, soon: true },
  { id: 'laser', icon: '🔦', name: 'Laser', namePt: 'Laser', unlock: 4, soon: true }
];

// Próximo nível que pode ser comprado (ou null se já está no máximo)
function shopNextLevel(item, save) {
  if (item.soon) return null;
  const next = item.level(save) + 1;
  return item.prices[next] ? next : null;
}

function startingAmmo(save) { return 10 + (save.weapons.tank - 1) * 5; }
