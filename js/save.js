// Salva o progresso no navegador (localStorage).
const Save = {
  KEY: 'robotTreasureIsland_v1',

  defaults() {
    return {
      unlocked: 1,        // maior fase liberada
      best: {},           // melhor pontuação por fase
      totalScore: 0,      // pontos acumulados ao concluir fases
      mapPieces: 0,       // pedaços do mapa do tesouro
      muted: false,
      translate: false,
      wallet: 0,          // moedas guardadas para gastar na oficina
      weapons: { owned: ['blaster'], equipped: 'blaster', power: { blaster: 1, triple: 1 }, tank: 1 },
      review: []          // perguntas erradas que vão voltar para revisão
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return this.defaults();
      const data = Object.assign(this.defaults(), JSON.parse(raw));
      data.weapons = Object.assign(this.defaults().weapons, data.weapons);
      return data;
    } catch (e) {
      return this.defaults();
    }
  },

  write(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch (e) { /* modo privado */ }
  },

  update(fn) {
    const data = this.load();
    fn(data);
    this.write(data);
    return data;
  },

  completeLevel(level, score, coins) {
    return this.update(d => {
      d.wallet += coins || 0;
      const prevBest = d.best[level] || 0;
      if (score > prevBest) {
        d.totalScore += score - prevBest;
        d.best[level] = score;
      }
      d.unlocked = Math.max(d.unlocked, Math.min(level + 1, LEVELS.length));
      d.mapPieces = Math.max(d.mapPieces, level);
    });
  },

  reset() { this.write(this.defaults()); }
};
