# Révisions DS (ECAM)

Appli de révision pour téléphone, publiée avec GitHub Pages. Une page par DS, listées sur l'accueil (`index.html`).

## DS disponibles

| DS | Page | Fonctionnement |
|---|---|---|
| Procédés de fabrication | `procedes-fabrication.html` | Quiz (moteur commun `quiz.js`, questions dans `data/procedes-fabrication.js`) |
| Green Belt Lean Six Sigma | `green-belt.html` | DS blancs chronométrés avec points négatifs + entraînement par chapitre (`green-belt-app.js`, questions dans `data/green-belt.js`) |

## Structure

- `index.html` : accueil, matières à travailler, indicateur de maîtrise (rouge < 40 %, orange 40–74 %, vert ≥ 75 %), option « Matière passée ».
- `ds.js` : registre des DS (une entrée par DS).
- `quiz.js` + `style.css` : moteur commun des quiz classiques.
- `data/<ds>.js` : questions d'un DS.
- `green-belt.html`, `green-belt-app.js`, `green-belt.css` : moteur de DS blanc (barème pondéré, malus, chrono, bilan).

## Ajouter un DS

1. Créer `data/<ds>.js` avec les questions et une page `<ds>.html`.
2. Ajouter une entrée dans `ds.js`.
3. Charger le script de données dans `index.html` pour l'indicateur de maîtrise.

## Règles de révision

- Une question est maîtrisée après 2 bonnes réponses d'affilée ; une erreur la remet à zéro.
- Tirage pondéré : questions ratées (×4), jamais vues (×3), en cours (×2), maîtrisées (×1).
- DS blanc Green Belt : bonne réponse = + points de la question (1 à 3), mauvaise = − une fraction (⅓ par défaut, réglable), question passée = 0, note ramenée sur 20.
- La progression est enregistrée dans le navigateur du téléphone (localStorage).
