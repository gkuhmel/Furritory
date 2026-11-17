# Flying Choco

Jeu mobile web type Flappy Bird : Choco, un panda roux, traverse 5 mondes de 10 niveaux (forêt de bambous, rizières, ville des lanternes, montagnes enneigées, palais céleste), ramasse les lettres C·H·O·C·O pour gagner ses étoiles, chevauche un dragon et s'habille à la boutique. Un mode infini est aussi disponible.

- `docs/specs.md` : la spécification complète.
- `prototype/index.html` : le prototype jouable de référence (un seul fichier, à ouvrir dans un navigateur).
- `CLAUDE.md` : consignes pour Claude Code.

## Développement

```sh
npm install
npm run dev      # serveur de développement
npm run build    # vérification TypeScript + build dans dist/
```

Le code est dans `src/` (découpage décrit dans la section 2 de la spec) ; toutes les constantes de réglage sont dans `src/config.ts`.
