# GDD - Desafio da Floresta vs. Invasores

Este é um jogo de tabuleiro digital assimétrico que opõe dois times: o **Grupo Floresta** (Protetores) e o **Grupo Invasor** (Escavadeiras).

## Como Jogar

O jogo é dividido em 4 fases por turno:
1. **Recrutamento**: Clique nos seus territórios para adicionar tropas (o Cerrado e a Caatinga têm custos e bônus específicos).
2. **Movimento**: Selecione um de seus territórios e depois clique em um vizinho para mover tropas. Biomas como Amazônia e Pantanal afetam sua mobilidade.
3. **Ação/Evento**: O sistema pode disparar eventos aleatórios (Cartas de Buff ou Risco) ou o Quiz do Guardião.
4. **Combate**: Selecione um território com pelo menos 2 tropas e clique em um inimigo vizinho para iniciar a batalha.

### Biomas e Regras
- **Amazônia**: Movimento reduzido pela metade. Invasores precisam de tempo para construir.
- **Cerrado**: Defesa tem -1 no dado.
- **Caatinga**: Custo dobrado para novos recrutas.
- **Pantanal**: Movimento limitado se o dado for baixo.
- **Terra Arrasada**: Invasores podem usar a "Extração de Madeira" para ganhar tropas, mas o território fica inativo por 3 rodadas.

## Como fazer o Deploy no GitHub Pages

1. Crie um repositório no GitHub (ex: `GDD`).
2. Utilize o **GitHub Desktop** para clonar o repositório na pasta `C:\Users\26012144\Documents\GitHub\GDD`.
3. Copie todos os arquivos deste projeto para essa pasta.
4. Faça o **Commit** e o **Push** no GitHub Desktop.
5. No GitHub (site), vá em **Settings** > **Pages**.
6. Em **Build and deployment**, selecione o branch `main` e a pasta `/(root)`.
7. Clique em **Save**. Após alguns minutos, seu jogo estará online!

## Tecnologia
- HTML5 / CSS3 (Glassmorphism design)
- SVG para o mapa interativo
- JavaScript (Vanilla ES6 Modular)
