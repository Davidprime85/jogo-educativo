// O jogo "fala" em inglês usando a voz do próprio aparelho (Web Speech API).
const Speech = {
  voice: null,
  supported: 'speechSynthesis' in window,

  init() {
    if (!this.supported) return;
    const pickVoice = () => {
      const voices = speechSynthesis.getVoices();
      this.voice = voices.find(v => /en[-_]US/i.test(v.lang) && /Google|Samantha|Aria|Jenny|Female/i.test(v.name))
        || voices.find(v => /en[-_]US/i.test(v.lang))
        || voices.find(v => /^en/i.test(v.lang))
        || null;
    };
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  },

  // Transforma o texto da tela em algo que a voz lê bem
  clean(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    div.querySelectorAll('.frac').forEach(f => {
      const n = f.querySelector('.num').textContent, d = f.querySelector('.den').textContent;
      f.textContent = n === '?' ? ` what over ${d} ` : ` ${n}/${d} `;
    });
    return div.textContent
      .replace(/^\s*\?\s*×/, 'What number times')
      .replace(/×/g, ' times ')
      .replace(/=/g, ' equals ')
      .replace(/_{2,}/g, ' blank ')
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  say(html) {
    if (!this.supported || Sound.muted) return;
    const text = this.clean(html);
    if (!text) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      if (this.voice) u.voice = this.voice;
      u.rate = 0.9;
      u.pitch = 1.1;
      speechSynthesis.speak(u);
    } catch (e) { /* navegador sem voz */ }
  },

  stop() {
    if (this.supported) speechSynthesis.cancel();
  }
};
