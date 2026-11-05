import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import multer from 'multer';
import { MEMES_DIR } from './db.js';
import memesRouter from './routes/memes.js';

const app = express();
const port = process.env.PORT || 3000;
const serverDir = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(serverDir, '..', 'public')));
app.use('/memes', express.static(MEMES_DIR));
app.use('/api/memes', memesRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Cette adresse de l\'API n\'existe pas.' });
});

// Express reconnaît un gestionnaire d'erreurs à ses quatre paramètres.
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    return res.status(tooLarge ? 413 : 400).json({
      error: tooLarge ? 'Le mème dépasse la taille maximale de 10 Mo.' : 'L\'envoi du mème a échoué.',
    });
  }
  console.error(err);
  res.status(500).json({ error: 'Le serveur a rencontré une erreur. Réessayez dans un instant.' });
});

app.listen(port, () => {
  console.log(`Punchline est prêt sur http://localhost:${port}`);
});
