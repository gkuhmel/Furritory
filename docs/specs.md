# Furritory — Spécifications du prototype

> Nom : **Furritory** (*fur* + *territory* : ton territoire est en fourrure).
> Objectif du proto : vérifier que **tracer des boucles au pouce sur un globe et voir des pays basculer** est agréable, lisible et donne envie de rejouer.

---

## 1. Vision

Un animal-figurine court sur un globe-plateau de jeu. Il sort de son territoire en laissant des empreintes, fait une boucle, rentre chez lui : tout ce qu'il a entouré devient à lui. Dès qu'il possède plus de la moitié d'un pays, **le pays entier bascule**. Objectif : conquérir le monde.

**Pilier unique : on ne peint pas des pixels, on fait basculer des pays.**

Ce qui distingue le jeu du genre « boucle de territoire » :
- le terrain est la vraie carte du monde, sur un globe sans bords ;
- l'unité de score est le pays, pas le pourcentage de surface ;
- les océans sont la zone de risque : on les traverse, on n'y capture rien.

---

## 2. Périmètre du proto

### Inclus
- Globe 3D style plateau de jeu, monde entier, pays et frontières réels (simplifiés).
- Un pion contrôlé à un pouce, qui avance en continu (cf. §4).
- Traînée d'empreintes, fermeture de boucle, capture de zone (cf. §5).
- Bascule d'un pays à 50 % (cf. §6).
- Océan : traversable en barque, non capturable (cf. §7).
- 5 rivaux contrôlés par l'ordinateur (cf. §8).
- Capitales : passer dessus avec sa traînée fait basculer le pays (cf. §6).
- Partie chronométrée de 4 min ; score = nombre de pays ; meilleur score sauvegardé localement.
- 6 animaux jouables, tous disponibles d'emblée (cf. §9).
- Mini-carte, panneau de debug.

### Exclus (pour plus tard)
- Bonus à ramasser, monuments, bonus de continent.
- Atlas persistant, déblocage des animaux par pays, défi du jour.
- Multijoueur réel, comptes, classements.
- Relief qui influe sur la vitesse, météo, jour/nuit.
- Menus complets, réglages, langues, tutoriel, PWA, sons élaborés.

---

## 3. Stack et contraintes techniques

- **Vite + TypeScript strict**, sans framework UI, rendu **Three.js** (WebGL).
- Cibles : **Safari iPhone et iPad**, en portrait comme en paysage, 60 fps.
- Tout s'adapte à la taille d'écran, sans mise en page figée :
  - la portion de globe visible en partie est calée sur la plus petite dimension de l'écran, pour que le jeu ait la même difficulté sur téléphone et sur tablette ;
  - le HUD et la mini-carte se placent dans les coins en respectant les marges de sécurité (encoche, barre d'accueil) ;
  - le contrôle ne dépend que de la direction du glissé, jamais de sa longueur en pixels.
- Entrées : Pointer Events, `touch-action: none`, pas de zoom, de scroll ni de sélection.
- Boucle à **pas de temps fixe** avec rendu interpolé ; la simulation ne dépend pas du framerate.
- Tous les paramètres de gameplay dans `src/config.ts`.
- `localStorage` toujours dans un `try/catch`.
- Déploiement : Cloudflare Workers (assets statiques), comme Traverser.

### Monde et unités
- Le globe a un rayon de 1. Les positions sont des vecteurs unitaires, les distances des angles (degrés), les vitesses des degrés par seconde.
- **Grille de territoire** : sphère découpée en cube projeté (6 faces × N × N cases, N = 256, soit des cases d'environ 0,35°). Pas de déformation aux pôles, voisinage simple pour le remplissage.
- Chaque case porte : terre ou mer, identifiant du pays, propriétaire, traînée éventuelle.
- La table « case → pays » est **précalculée au build** à partir de Natural Earth (domaine public) et livrée comme fichier binaire.
- Les très petits pays sont grossis à un minimum de cases (`minCountryCells`) ou fusionnés avec un voisin, pour rester jouables au doigt.

### Arborescence suggérée
```
scripts/
  build-world.ts   // Natural Earth -> grille pays + capitales (au build)
src/
  main.ts          // bootstrap, resize, boucle
  config.ts        // tous les paramètres
  world.ts         // grille, pays, capitales, terre/mer
  territory.ts     // traînées, fermeture de boucle, capture, bascule
  pawn.ts          // déplacement d'un pion sur la sphère
  input.ts         // glisser du pouce -> cap
  bots.ts          // rivaux
  game.ts          // état de partie, chrono, score, fin
  camera.ts        // caméra suiveuse
  render/          // globe, zones, pions, mini-carte, HUD
  debug.ts         // panneau de debug (?debug=1)
```

---

## 4. Le pion et le contrôle (point à valider en premier)

- Le pion avance **en continu** à `pawnSpeed`. Il ne s'arrête jamais.
- **Glisser le pouce n'importe où donne un cap** : la direction du glissé à l'écran devient la direction visée du pion. Le pion tourne vers ce cap à `turnRate` (virage fluide, pas de demi-tour instantané).
- Le doigt ne fait jamais tourner le globe. Pas de caméra libre en partie.
- **Caméra** : verrouillée sur le pion, qui reste au centre de l'écran, vue plongeante inclinée. Elle ne pivote pas avec le pion : « droite à l'écran » garde le même sens pendant tout un virage. Son orientation est transportée le long du trajet, sans nord imposé, pour passer les pôles sans à-coup.
- **Mini-carte** dans un coin : planisphère avec les zones de chacun et la position des pions.

### Valeurs de départ
| Paramètre | Valeur | Rôle |
|---|---|---|
| `pawnSpeed` | 4 °/s | Traversée de la France en 2 s, tour du monde en 90 s |
| `turnRate` | 900 °/s | Virage net : angle droit en 0,1 s |
| `viewSpanDeg` | 12° | Arc de globe visible sur la plus petite dimension de l'écran |
| `cameraTiltDeg` | 30° | Inclinaison de la vue |
| `stickRadiusPx` | 14 px | Rayon du joystick invisible : au-delà, l'ancre suit le doigt |

Ces valeurs fixent l'échelle ressentie du monde : ce sont les premières à régler.

---

## 5. Traînée, boucle et capture

- Chaque joueur démarre avec son **pays de départ entier**.
- Hors de son territoire, le pion laisse une **traînée d'empreintes de pattes** sur les cases traversées.
- En rentrant sur son territoire, la boucle se ferme : la traînée et toutes les cases de terre qu'elle enferme deviennent à lui. Calcul par remplissage depuis l'extérieur.
- Les empreintes se remplissent alors avec le motif de pelage de l'animal (animation courte).
- Les cases de mer enfermées ne sont pas capturées et ne comptent pas.
- Du territoire rival enfermé est pris.
- **Mort** : un pion meurt si un rival touche sa traînée, ou s'il touche la sienne.
- À la mort : la traînée disparaît, **ses pays redeviennent neutres**, il réapparaît après `respawnDelay` dans un pays neutre avec ce pays entier.

---

## 6. Bascule des pays et capitales

- Après chaque capture, pour chaque pays touché : si un joueur possède au moins `flipThreshold` (50 %) des cases du pays, **toutes les cases du pays passent à lui**. Effet visuel et sonore marqué : c'est la récompense centrale du jeu.
- Un pays compte au score seulement quand il est possédé en entier.
- **Capitale** : chaque pays a sa capitale, marquée par un petit pion-ville. Si la traînée d'un joueur passe sur la capitale, le pays bascule chez lui à la fermeture de la boucle, quel que soit le pourcentage.
- HUD : nombre de pays possédés, chrono, nom du pays survolé.

---

## 7. L'océan

- Le pion peut aller en mer : la figurine monte dans une petite barque en bois.
- En mer, vitesse multipliée par `seaSpeedFactor` (0,8) et la traînée continue : elle reste exposée jusqu'au retour sur son territoire.
- On ne capture pas de mer. Une boucle peut passer par la mer pour entourer une île ou une côte.
- Conséquence voulue : changer de continent est un pari.

---

## 8. Les rivaux

- 5 rivaux, chacun un animal différent, pays de départ répartis sur des continents différents.
- Comportement de base : sortir, faire une boucle de taille tirée au hasard, rentrer. Rentrer plus vite si un pion ennemi approche de sa traînée.
- Trois tempéraments par réglage de paramètres : prudent (petites boucles), expansionniste (grandes boucles), chasseur (vise les traînées proches).
- Ils doivent être battables par un débutant : leur rôle est de rendre la carte vivante.

---

## 9. Thème et rendu

- **Plateau de jeu** : globe mat aux couleurs douces, terres légèrement en relief sur une mer unie, frontières gravées, ombres douces. Pays neutres en teinte bois clair ou carton.
- **Pions** : figurines d'animaux en bois peint, low-poly, générées par le code (formes simples, pas de fichiers de modèles).
- **Zones** : le motif de pelage de l'animal, peint sur le plateau par un shader.

| Pion | Zone | Traînée |
|---|---|---|
| Tigre | Rayures orange et noires | Empreintes de félin |
| Panda | Taches noir et blanc | Empreintes rondes |
| Girafe | Puzzle de taches brunes | Sabots |
| Zèbre | Rayures noir et blanc | Sabots |
| Abeille | Alvéoles de miel | Pointillés de pollen |
| Toucan | Aplats jaune, rouge et noir | Pattes d'oiseau |

- La lisibilité prime : deux zones voisines doivent se distinguer d'un coup d'œil, et le pion du joueur doit toujours ressortir.

---

## 10. Étapes de développement

Chaque étape se termine par une validation sur iPhone avant de passer à la suivante.

1. **Fondations et globe** — Vite + TS + Three.js, globe plateau avec pays et frontières, rotation libre au doigt (vue menu), boucle à pas fixe, entrée tactile propre. *Validation : le globe s'affiche à 60 fps, aucun geste parasite de Safari.*
2. **Pion, contrôle, caméra** — pion qui avance, cap au pouce, caméra suiveuse, passage des pôles. *Validation : on trace des boucles et des huit sans jamais être désorienté. Si ce n'est pas le cas, on règle ici avant d'aller plus loin.*
3. **Traînée et capture** — script de build de la grille « case → pays », empreintes, fermeture de boucle, remplissage, mort sur sa propre traînée. *Validation : fermer une boucle est net et satisfaisant.*
4. **Bascule des pays** — seuil de 50 %, effet de bascule, compteur de pays. *Validation : on comprend seul pourquoi un pays a basculé.*
5. **Océan** — barque, vitesse en mer, îles. *Validation : traverser une mer fait hésiter.*
6. **Rivaux et partie complète** — bots, coupure de traînée, réapparition, chrono, écran de fin, meilleur score, mini-carte. *Validation : une partie de 4 min est jouable de bout en bout.*
7. **Capitales** — pions-villes, bascule par capitale. *Validation : on se surprend à viser une capitale.*
8. **Habillage** — figurines des 6 animaux, motifs de pelage, empreintes par animal, sons courts.

---

## 11. Critères de réussite du proto

Après 10 parties :
- Le contrôle au pouce sur le globe est naturel, sans tutoriel.
- La bascule d'un pays procure un vrai plaisir, et on la provoque exprès.
- Les morts paraissent méritées.
- On regarde la mini-carte pour choisir sa prochaine cible.
- On a envie de relancer une partie.
