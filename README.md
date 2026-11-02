# 🤖 Robot Treasure Island

Jogo educativo de plataforma 2D para navegador (crianças de ~10 anos).
Matemática (multiplicação e frações) + inglês (frases simples).

## Jogar online (computador, celular e tablet)
👉 https://davidprime85.github.io/jogo-educativo/

No celular/tablet: deite o aparelho. Aparecem botões ◀ ▶ (andar), ⬆ (pular) e ⚡ (atirar).
Dica: use "Adicionar à tela inicial" para abrir como app, em tela cheia.

## Como jogar no computador sem internet
1. Baixe/clone a pasta.
2. Dê **duplo clique em `index.html`** — abre no navegador (Chrome, Edge ou Firefox).
   - Com internet, o Phaser vem do CDN. Sem internet, usa a cópia em `lib/phaser.min.js`.

| Tecla | Ação |
|---|---|
| ← → | Andar |
| Espaço (ou ↑) | Pular (segurar = pulo mais alto) |
| X | Atirar energia |
| C | Trocar de arma |
| T | Translate (mostrar português) |
| P / Esc | Pausar |
| 1–4 / Enter | Responder perguntas |
| M | Som liga/desliga |

## O que tem na Fase 1 (Beach)
- Moedas, caranguejos (pule em cima ou atire), buracos com água, checkpoints.
- 3 baús de matemática (acertou = +5 energia ou +1 vida; errou = resposta certa + explicação).
- 1 porta mágica de inglês (escolher a palavra certa pela figura).
- Placas com instruções em inglês + botão **Translate**.
- Chefão **King Crab**: acerte ele (tiro ou pulo) → aparece uma conta → só perde vida se você acertar.
- Progresso salvo no navegador (fases liberadas, melhor pontuação, pedaços do mapa).

## O que tem na Fase 2 (Forest)
- Troncos que se movem, elevador de tronco e cogumelos-trampolim.
- Vilões novos: joaninha-robô, morcego, aranha (aguenta 2 tiros) e macaco que joga cocos.
- Porta de inglês com figura e porta com **frase para completar** (in / on / under, números, cores).
- Chefão **Robo-Gorila**: soco no chão (ondas de choque: pule!), chuva de cocos e corrida.

## Novidades gerais
- 🔧 **Oficina do Bolt**: moedas das fases viram dinheiro para comprar/melhorar armas.
  Toda compra pede a conta do troco (ex.: 100 − 30). Errou? Responde outra conta para comprar.
- Armas: ⚡ Blaster (melhora até ★★★) e 🔱 Tiro Triplo. Trocar arma: tecla **C** ou botão 🔄.
- 🔊 O jogo **fala em inglês** (placas, falas e perguntas) com a voz do aparelho. Botão 🔊 repete.
- 🔁 **Revisão**: contas e palavras erradas voltam depois, marcadas com "Review".

## Estrutura
```
index.html          telas e placar (HTML)
css/style.css       visual das telas
js/levels.js        dados das fases (plataformas, inimigos, baús, placas...)
js/weapons.js       armas e itens da oficina
js/backgrounds.js   cenários de fundo e temas (praia, floresta)
js/speech.js        voz em inglês
js/questions.js     gerador de perguntas (dificuldade 1 a 5)
js/pictures.js      desenhos das palavras em inglês
js/textures.js      todos os gráficos, desenhados com formas
js/sound.js         sons gerados (Web Audio)
js/save.js          salvar progresso (localStorage)
js/ui.js            placar, falas, janela de perguntas
js/scenes/          cenas do Phaser (tela inicial e fase)
js/main.js          inicialização e navegação entre telas
```

Fases 3–5 (Cave, Volcano, Pirate Ship): em breve.
