# Consignes pour Claude Code

## Projet
Panda Roux Volant : jeu mobile web type Flappy Bird (panda roux, forêt chinoise, bonus, missions, saisons, dragon, boutique de tenues).

- La spécification est dans `docs/specs.md`. Lis-la avant toute tâche.
- Le prototype de référence est `prototype/index.html`. Il fait foi pour les sensations et les valeurs de réglage. Ne le modifie pas : c'est l'étalon.

## Stack
- Vite + TypeScript, Canvas 2D, sans framework ni moteur de jeu.
- Audio synthétisé avec la Web Audio API.
- Site statique, déploiement Cloudflare.
- Cible prioritaire : Safari sur iPhone.

## Règles
- Écris en français : interface, commentaires, messages de commit.
- Toutes les constantes de réglage vont dans `src/config.ts`.
- Garde la logique (mise à jour) séparée du dessin.
- Protège chaque accès à `localStorage` par try/catch.
- Après une modification, vérifie que `npm run build` passe.
- Git : commite et pousse directement sur `main`, sans branche ni pull request.

## Première tâche
Porter le prototype vers Vite + TypeScript à l'identique (étape 1 de la feuille de route), en suivant le découpage proposé dans la spec.
