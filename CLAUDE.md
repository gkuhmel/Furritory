# Furritory — instructions pour Claude Code

Jeu web mobile (Safari iPhone et iPad, portrait et paysage) : un animal-figurine conquiert le monde sur un globe-plateau en traçant des boucles d'empreintes ; un pays possédé à plus de 50 % bascule en entier.

## Référence
- La spécification complète est dans `docs/specs.md`. La lire avant toute tâche.
- Pilier du proto : on ne peint pas des pixels, on fait basculer des pays. Le contrôle au pouce sur le globe (§4) est le premier risque à lever.

## Méthode
- Avancer **étape par étape** selon le §10 de la spec. À la fin de chaque étape : résumer ce qui a été fait, indiquer comment tester sur iPhone, puis **s'arrêter et attendre la validation** avant l'étape suivante.
- Ne rien ajouter qui soit dans « Exclus » (§2) sans demande explicite.
- Tous les paramètres de gameplay vont dans `src/config.ts`, jamais en dur dans le code.

## Conventions techniques
- Vite + TypeScript strict, aucun framework UI, rendu Three.js.
- Boucle à pas de temps fixe ; la simulation ne doit pas dépendre du framerate.
- Globe de rayon 1 ; positions en vecteurs unitaires, distances en degrés, temps en secondes.
- Rien ne dépend d'une taille ou d'une orientation d'écran fixe : cadrage calé sur la plus petite dimension, HUD dans les marges de sécurité.
- Pointer Events avec `touch-action: none` ; pas de zoom, de scroll ni de sélection.
- `localStorage` toujours entouré d'un `try/catch`.
- Le panneau de debug s'active avec `?debug=1` et ne doit rien coûter quand il est désactivé.
- Modèles 3D générés par le code (low-poly procédural), pas de fichiers de modèles.

## Commandes et déploiement (tout en ligne, rien en local chez l'utilisateur)
- `npm run build` doit passer sans erreur TypeScript avant chaque fin d'étape.
- Déploiement automatique par Cloudflare Workers Builds, branché sur le dépôt GitHub :
  - commande de build : `npm run build` ;
  - commande de déploiement (branche de production) : `npx wrangler deploy` ;
  - branches de travail : `npx wrangler versions upload`.
- Le travail validé par `npm run build` est poussé sur `main` : chaque push déploie en production.
- Config Worker (assets statiques de `dist/`) dans `wrangler.jsonc` ; le `name` doit correspondre au nom du Worker côté Cloudflare.

## Langue
- Code et noms de variables en anglais ; commentaires, messages de commit et échanges en français.
