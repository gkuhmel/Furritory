# Flying Choco — spécification

> Jeu mobile web (iPhone en priorité) de type Flappy Bird : Choco, un panda roux, plane entre des bambous dans une forêt chinoise colorée, ramasse des bao, enchaîne les combos et habille son panda.
>
> Le prototype jouable de référence est `prototype/index.html` (un seul fichier, Canvas 2D, aucune dépendance). **Il fait foi pour les sensations et les valeurs de réglage** : la version Claude Code doit le reproduire fidèlement avant d'aller plus loin.

---

## 0. Aventure (mode principal)

Ajouté après le portage. Le mode infini décrit dans les sections suivantes reste disponible dès le menu (« Mode infini ») et garde exactement les réglages du prototype.

### Mondes et niveaux
- **5 mondes × 10 niveaux**, débloqués dans l'ordre (réussir un niveau ouvre le suivant). Essais illimités, pas de vies.
- Un niveau = un nombre fixe de passages puis une **arche d'arrivée**. Aucun score affiché : barre de progression et lettres dans la bande du sol.
- Chaque monde a sa palette, son décor lointain, ses particules et **son habillage d'obstacles** (même mécanique, autre dessin) :

| # | Monde | Piliers | Volant (dès niv. 3) | Colonne qui pousse (dès niv. 5) | Barre mortelle (dès niv. 7) |
|---|---|---|---|---|---|
| 1 | Forêt de bambous | bambous | grues | cascades | ponts de corde |
| 2 | Rizières au crépuscule | poteaux de bois | cerfs-volants | canaux d'irrigation | cordes à épouvantails |
| 3 | Ville des lanternes | piliers de temple | fusées de fête | fumée d'encens | guirlandes de lanternes |
| 4 | Montagnes enneigées | pics de glace | boules de neige | avalanches | rideaux de stalactites |
| 5 | Palais céleste | colonnes de jade | nuages d'orage | souffles célestes | éclairs |

- Le **singe farceur** arrive à mi-parcours du **niveau 10** de chaque monde.
- Les événements (vent, fête, brume) apparaissent à partir du monde 2, niveau 4.

### Difficulté
Courbe en dents de scie (`levelDef` dans `src/config.ts`) : elle monte dans un monde et redescend un peu au début du suivant. Avec k de 0 à 1 :
passages 12 → 36, trou 180 → 130 px, espacement 250 → 205 px, vitesse 165 → 260 px/s, part de piliers qui oscillent de 0 (monde 1, niveaux 1-3) jusqu'à 70 %, amplitude et vitesse d'oscillation croissantes.

### Lettres CHOCO et étoiles
- 5 lettres **C·H·O·C·O** par niveau, placées dans des trous de passages (de plus en plus près des bords).
- 1★ = arrivée, 2★ = au moins 3 lettres, 3★ = les 5 lettres, qui doublent aussi les bao gagnés dans le niveau.
- On garde la meilleure note de chaque niveau.

### Carte
Écran « Aventure » : carte verticale qui défile, un tronçon par monde (dégradé, décor, titre et étoiles du monde), chemin pointillé entre des médaillons numérotés, étoiles sous les niveaux réussis, cadenas sur les niveaux fermés, Choco qui plane au-dessus du niveau en cours. Après une victoire : étoiles, lettres, bao, « Niveau suivant », « Rejouer », « Carte ».

### Sauvegarde
Version 2 : ajoute `levels` (étoiles par niveau, index = monde × 10 + niveau). Les sauvegardes v1 et du prototype sont migrées.

## 1. Intention

- **Une touche, une partie de 30 s à 3 min**, et l'envie immédiate de relancer.
- Trois moteurs de rejouabilité, validés :
  1. **Missions** qui font monter un multiplicateur de bao pour toujours.
  2. **Saisons** qui défilent avec la distance (curiosité : « je veux voir l'hiver »).
  3. **Fantôme du record** qui vole à côté de toi.
- Une **boutique de tenues** purement esthétique, payée en bao, pour donner un but à long terme.
- Ton : coloré, doux, kawaii ; jamais punitif ni agressif.

## 2. Plateforme et technique (cible)

| Sujet | Choix |
|---|---|
| Plateforme | Navigateur mobile (Safari iOS d'abord), jouable aussi sur ordinateur |
| Stack | Vite + TypeScript, Canvas 2D, **sans framework ni moteur** |
| Audio | Web Audio API, sons et musique **synthétisés** (pas de fichiers audio au départ) |
| Graphismes | Dessinés en code (formes vectorielles Canvas) comme dans le proto ; sprites possibles plus tard |
| Sauvegarde | `localStorage`, clé versionnée, lecture/écriture protégées par try/catch |
| Déploiement | Site statique (Cloudflare, comme les autres projets) |
| Plus tard | PWA (plein écran depuis l'écran d'accueil), langues FR/EN |

### Repères techniques à conserver du proto
- Monde logique de **640 px de haut** ; la largeur s'adapte au ratio d'écran (bornée entre 320 et 1000).
- Rendu à la densité de l'écran (`devicePixelRatio` plafonné à 2).
- Boucle `requestAnimationFrame`, `dt` plafonné à 33 ms.
- Un **facteur de temps** global (ralenti pêche ×0,55, ralenti « au pixel » ×0,3) appliqué à la physique et au défilement, pas à l'interface.
- `touch-action: none`, pas de zoom, pas de sélection de texte.

### Découpage proposé (src/)
```
main.ts          démarrage, redimensionnement, boucle
config.ts        toutes les constantes de réglage (section 10)
state.ts         état de la partie, reset
save.ts          sauvegarde versionnée
input.ts         toucher / clic / espace
audio/sfx.ts     effets sonores
audio/music.ts   musique pentatonique réactive
world/           pipes.ts, items.ts, cranes.ts, cascades.ts, bridges.ts, monkey.ts, events.ts, seasons.ts, dragon.ts, ghost.ts
render/          sky.ts, scenery.ts, panda.ts (+ tenues), obstacles.ts, items.ts, fx.ts, hud.ts
meta/            missions.ts, shop.ts
ui/              menu.ts, gameover.ts, shop.ts (écrans en HTML/CSS par-dessus le canvas)
```

## 3. Boucle de jeu

- **Contrôle** : toucher l'écran (ou espace / flèche haut) = battement d'ailes, vitesse verticale fixée à −430 px/s.
- **Gravité** 1500 px/s². Inclinaison du panda proportionnelle à sa vitesse verticale.
- Le monde défile de droite à gauche. Vitesse : 170 px/s, +2,2 par point, plafond 300.
- **Paires de bambous** espacées de 240 px, largeur 64 px. Trou de 175 px qui rétrécit de 1,1 px par point jusqu'à 128 px.
- À partir de quelques points, une part croissante des bambous **oscille** verticalement (jusqu'à 45 % des paires, amplitude 18–40 px).
- **Mort** : toucher un bambou, un obstacle mortel ou la rivière en bas, sauf invincibilité ou bouclier.
- **Score** : +1 par paire franchie, +2 par bao, bonus de combo, +10 si on survit au singe.

### Frôler (combo)
- Franchir une paire à moins de **34 px** d'un bord = « Frôlé ! » : le combo augmente et le passage rapporte 1 + combo.
- Le combo retombe à 0 après **2,5 s** sans nouveau frôlement.
- À moins de **20 px** = « AU PIXEL ! » : **ralenti dramatique** (×0,3 pendant 0,45 s) et bords de l'écran assombris.

## 4. Bonus

| Bonus | Visuel | Effet |
|---|---|---|
| Bao | Brioche vapeur | +2 points, +1 bao, remplit la jauge du dragon |
| Lanterne | Lanterne rouge « 福 » | Bouclier qui encaisse un choc, puis 1,2 s d'invulnérabilité clignotante |
| Nuage-éclair | Petit nuage | 2,6 s de sprint ×2,2 : le panda se recentre et casse les obstacles |
| Pêche d'immortalité | Pêche | 4 s de ralenti ×0,55 et 6 s d'aimant à bao (rayon 240 px) |

Apparition : un bao dans 55 % des trous de bambous ; entre deux paires, 12 % lanterne, 10 % nuage, 9 % pêche (s'il n'y a pas d'obstacle à cet endroit).

## 5. Dragon céleste

- **12 bao** remplissent la jauge (affichée en haut à gauche).
- Le dragon porte le panda **5,5 s** : invincible, vitesse ×1,8, gravité réduite (900), le corps du dragon suit la trajectoire du panda.
- Pluie de bao (un toutes les 0,13 s) attirés automatiquement.
- Gong au départ, la musique passe à son niveau maximal.
- À la fin, 1 s d'invulnérabilité.

## 6. Variété : obstacles, singe, événements

### Obstacles (placés entre deux paires de bambous)
| Obstacle | Dès | Probabilité | Comportement |
|---|---|---|---|
| Grue | 8 pts | 20 % | Vole vers le panda en ondulant, mortelle |
| Cascade | 14 pts | 14 % | Colonne d'eau qui pousse vers le bas (+1400 px/s²), pas mortelle |
| Pont de corde | 20 pts | 12 % | Planches suspendues, mortelles ; la paire suivante est forcée du même côté que le trou précédent pour rester franchissable |

Pendant le nuage ou le dragon, ces obstacles sont **cassés** (compte pour la mission « casse »).

### Singe farceur (mini-boss)
- Arrive à **30 points**, puis tous les **45 points** de plus (pas pendant le dragon).
- Plus de nouveaux bambous pendant sa présence.
- Assis sur un nuage à droite, il monte et descend et lance toutes les 0,9–1,3 s un projectile visé sur le panda (trajectoire en cloche) : **pomme de pin** mortelle (80 %) ou **pêche** à attraper (20 %).
- Repart après **12 s** : +10 points, mission « singe » validée.

### Événements au hasard (7 s, toutes les 18–28 s, dès 5 points, jamais pendant le singe ou le dragon)
- **Vent** ascendant ou plongeant : force verticale ±520 px/s², traits de vent à l'écran.
- **Fête des lanternes** : ciel assombri, nombreuses lanternes, bao dans chaque trou et lignes de bao en plus.
- **Brume** : le côté droit de l'écran devient laiteux, il faut réagir tard.

Chaque événement est annoncé par une bannière.

## 7. Saisons

Changement tous les **25 points**, en boucle, avec un fondu des couleurs (ciel, montagnes, bambous, sol, rivière, soleil) :

| # | Saison | Particules d'ambiance | Particularités |
|---|---|---|---|
| 0 | 🌸 Printemps | Pétales roses et dorés | Ciel pêche |
| 1 | 🌙 Soir d'été | Lucioles | Ciel crépuscule, pagode éclairée |
| 2 | 🍁 Automne | Feuilles d'érable | Bambous dorés, feuilles orange |
| 3 | ❄️ Hiver | Neige | Neige sur les sommets et les bambous |

Décor fixe : soleil, trois plans de montagnes karstiques en défilement différentiel, pagode, forêt de bambous lointaine, lanternes flottantes, sol herbeux et rivière.

## 8. Rejouabilité

### Missions
- Toujours **3 missions actives**, conservées d'une partie à l'autre jusqu'à réussite.
- Une mission se valide **pendant** la partie (bannière + son). Elle est remplacée au lancement de la partie suivante par une nouvelle, un peu plus dure (la difficulté suit le nombre total de missions réussies).
- Chaque mission réussie : **multiplicateur de bao +0,25** (plafond ×5). Le multiplicateur s'applique aux bao versés dans la tirelire en fin de partie, pas au score (le record reste comparable).

| Clé | Intitulé | Objectif (n = missions déjà réussies) |
|---|---|---|
| near | Frôle N bambous | 3 + n |
| bao | Attrape N bao | 6 + 2n |
| score | Fais N points | 15 + 5n |
| maxCombo | Fais un combo ×N | 2 + n/2 |
| dragon | Chevauche le dragon N fois | 1 + n/5 |
| peach | Mange N pêches | 1 + n/5 |
| season | Atteins telle saison | 1 + n/3 (max 5) |
| monkey | Survis au singe | 1 |
| shieldBreak | Brise N boucliers | 1 + n/6 |
| smash | Casse N obstacles | 3 + n |

### Fantôme du record
- On enregistre la hauteur du panda tous les 6 px de distance.
- Si la partie bat le record, cette trace remplace le fantôme sauvegardé (plafond 9000 points).
- Pendant la partie, le fantôme (panda translucide, écharpe sombre) vole à la même abscisse ; une bannière s'affiche quand on dépasse le point où il était tombé.

## 9. Économie et boutique

- Les bao ramassés × multiplicateur s'ajoutent à la tirelire à la mort.
- Boutique **100 % esthétique**, cinq catégories, un objet équipé par catégorie, aperçu animé avant achat :

| Catégorie | Objets (prix en bao) |
|---|---|
| Chapeaux | Aucun (0), Chapeau de riz (30), Bandeau kung-fu (45), Couronne de fleurs (70), Chapeau de mandarin (140), Cornes de dragon (220) |
| Écharpes | Or (0), Rouge (20), Jade (20), Nuit (35), Arc-en-ciel (120) |
| Lunettes | Aucune (0), Rondes (35), De soleil (60), Monocle (90) |
| Ailes | Feuilles (0), Lotus (70), Éventail (110), Cerf-volant (150), Phénix (260) |
| Traînées | Aucune (0), Pétales (40), Étincelles (80), Encre (100), Arc-en-ciel (160) |

- À équilibrer après des tests réels (gain moyen par partie, nombre de parties pour le premier achat : viser 2–3).

## 10. Audio

- **Effets** synthétisés : battement, point, bao, bonus, frôlement, choc, bouclier, gong, lancer.
- **Musique** pentatonique (ré, mi, fa#, la, si) façon guzheng, générée en continu, qui s'intensifie :
  - menu : mélodie douce ;
  - partie : + basse ;
  - combo ≥ 2 ou singe : + claquements de bois ;
  - combo ≥ 4 : + tambours et arpèges ;
  - dragon : tout, tempo +34.
- Tempo de base 88, +6 par niveau de combo (jusqu'à 8).
- Bouton son/silence mémorisé.

## 11. Écrans et interface

- **Menu** : titre, record, tirelire, multiplicateur, missions, Jouer, Boutique, son, légende des bonus. Le panda plane derrière.
- **Partie (HUD canvas)** : score au centre, bao de la partie, jauge du dragon, barres des bonus et événements actifs, combo, multiplicateur, bannières.
- **Fin de partie** (après 0,95 s de chute) : cause de la mort (« Aïe, le bambou ! », « Plouf dans la rivière ! », « Percuté par une grue ! », « Pomme de pin en pleine tête ! », « Coincé dans le pont ! »), score, record / nouveau record, bao gagnés (×multiplicateur), tirelire, missions, Rejouer, Boutique, Menu.
- **Boutique** : tirelire, aperçu animé, onglets, grille d'objets (Équipé / Possédé / prix), bouton Acheter ou « Il manque N bao ».

## 12. Sauvegarde

Clé `pandaRoux2` : `best`, `bao`, `owned` (liste `catégorie:id`), `eq` (objet équipé par catégorie), `done` (missions réussies), `missions` (3 × `{k, goal, done}`), `ghost` (tableau d'entiers), `sound`.

Prévoir un numéro de version et une migration dès la version Claude Code.

## 13. Feuille de route

1. ~~**Portage** du prototype vers Vite + TypeScript, à l'identique (sensations, valeurs, écrans).~~ Fait.
1 bis. ~~**Aventure** : 5 mondes × 10 niveaux, carte, lettres CHOCO, obstacles par monde (section 0).~~ Fait.
2. **Finition** : pause, PWA, FR/EN, réglages, tutoriel de première partie (skill `/finition`).
3. **Équilibrage** : courbe de difficulté, prix, fréquence des bonus et des obstacles, après tests sur iPhone.
4. **Contenu** : plus de saisons/biomes, nouvelles tenues, nouveaux événements.
5. **Idées non retenues pour l'instant** : défi du jour, feux d'artifice tous les 25 points, tenues à pouvoir, coffre au hasard, panoplies.

## 14. Points ouverts

- Nom du jeu : **Flying Choco** (le dépôt s'appelle Furritory).
- Le fantôme doit-il aussi enregistrer les tenues portées ce jour-là ?
- Faut-il un petit délai d'invulnérabilité au tout début de partie ?
