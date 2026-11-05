# Punchline

Générateur de mèmes en ligne réalisé pour le mini-projet d'admission SUPINFO.

## Fonctionnalités

- Import d'une image depuis l'ordinateur, par bouton ou glisser-déposer
- Ajout de plusieurs textes, avec taille, police, couleurs et position réglables
- Aperçu en temps réel sur un canvas
- Téléchargement du mème en PNG
- Partage par lien public, X, Facebook ou WhatsApp
- Galerie des mèmes enregistrés

## Technologies

- Frontend : HTML, CSS, JavaScript et API Canvas
- Backend : Node.js, Express et Multer
- Base de données : SQLite avec better-sqlite3

## Installation

Node.js 20 ou plus récent est requis.

```bash
npm install
npm run dev
```

Ouvrez ensuite http://localhost:3000.

## Organisation

- `public/` : interface
- `public/js/editor.js` : image, textes et rendu canvas
- `server/routes/memes.js` : API
- `server/db.js` : base SQLite et dossiers de stockage
- `storage/` : images et base, créés au premier lancement

## API

| Méthode | Route | Action |
|---|---|---|
| GET | `/api/memes` | Lister les mèmes |
| POST | `/api/memes` | Enregistrer un PNG (champs `image` et `caption`) |
| DELETE | `/api/memes/:id` | Supprimer un mème (en-tête `x-delete-token`) |
| GET | `/memes/:fichier` | Afficher l'image publique |

## Sécurité

- Le serveur vérifie la signature PNG et limite les envois à 10 Mo.
- Les noms de fichiers sont générés par le serveur.
- Seul le navigateur qui a créé un mème peut le supprimer, grâce à un jeton gardé en local.

## Déploiement

Les variables `PORT` et `STORAGE_DIR` sont prises en charge. `STORAGE_DIR` doit pointer vers un disque persistant, sinon les mèmes seront perdus au redémarrage du serveur.
