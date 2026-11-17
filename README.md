# Panda Roux Volant

Jeu mobile web type Flappy Bird : un panda roux plane entre les bambous d'une forêt chinoise colorée, ramasse des bao, enchaîne les combos, chevauche un dragon et s'habille à la boutique.

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
