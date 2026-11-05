# Punchline

Générateur de mèmes en ligne réalisé pour le mini-projet d'admission SUPINFO.

## Fonctionnalités

- Import d'une image depuis l'ordinateur, par bouton ou glisser-déposer
- Ajout de plusieurs textes, avec taille, police, couleurs et position réglables
- Aperçu en temps réel sur un canvas
- Téléchargement du mème en PNG
- Partage par lien public, X, Facebook ou WhatsApp
- Galerie des mèmes enregistrés

## Outils

| Outil | Rôle |
|---|---|
| HTML, CSS, JavaScript | Interface, sans framework |
| API Canvas | Dessin du mème, aperçu en temps réel et export PNG |
| Node.js 20 ou plus | Exécution du serveur |
| Express 5 | Serveur web et API REST |
| Multer | Réception des images envoyées au serveur |
| SQLite (better-sqlite3) | Données de la galerie |
| Git et GitHub | Versionnement et hébergement du code |
| Claude (IA) | Assistance à la conception et au développement |

## Installation

```bash
git clone https://github.com/VOTRE_COMPTE/generateur-memes.git
cd generateur-memes
npm install
npm run dev
```

Ouvrez ensuite http://localhost:3000. Si ce port est occupé, lancez `PORT=3001 npm run dev`.

## Structure

```text
generateur-memes/
├── public/
│   ├── index.html          # Page de l'application
│   ├── css/
│   │   └── style.css       # Styles
│   └── js/
│       ├── app.js          # Initialisation et navigation
│       ├── editor.js       # Image, texte et aperçu Canvas
│       ├── gallery.js      # Affichage de la galerie
│       ├── share.js        # Téléchargement et partage
│       └── api.js          # Appels au backend
├── server/
│   ├── index.js            # Démarrage du serveur Express
│   ├── db.js               # Connexion SQLite et table memes
│   └── routes/
│       └── memes.js        # Routes de l'API
├── storage/                # Images et base, créés au lancement (non versionné)
├── .gitignore
├── package.json
└── README.md
```

## Fonctionnement

1. L'image choisie reste dans le navigateur.
2. `editor.js` redessine le canvas à chaque modification.
3. Le téléchargement exporte directement le canvas en PNG.
4. L'enregistrement envoie ce PNG au serveur, qui le stocke dans `storage/memes/` et le référence dans SQLite.
5. Chaque mème enregistré apparaît dans la galerie et reçoit un lien public.

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
