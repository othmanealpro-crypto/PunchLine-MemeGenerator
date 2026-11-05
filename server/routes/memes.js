import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { db, MEMES_DIR } from '../db.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_CAPTION_LENGTH = 300;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

const listMemes = db.prepare('SELECT * FROM memes ORDER BY created_at DESC LIMIT 200');
const findMeme = db.prepare('SELECT * FROM memes WHERE id = ?');
const insertMeme = db.prepare(`
  INSERT INTO memes (id, filename, caption, delete_token, created_at)
  VALUES (?, ?, ?, ?, ?)
`);
const deleteMeme = db.prepare('DELETE FROM memes WHERE id = ?');

// Le jeton de suppression n'est jamais renvoyé par la liste publique.
function toPublicMeme(row) {
  return {
    id: row.id,
    url: `/memes/${row.filename}`,
    caption: row.caption,
    createdAt: row.created_at,
  };
}

function isPng(buffer) {
  return buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
}

router.get('/', (_req, res) => {
  res.json(listMemes.all().map(toPublicMeme));
});

router.post('/', upload.single('image'), (req, res) => {
  if (!req.file || !isPng(req.file.buffer)) {
    return res.status(400).json({ error: 'Envoyez une image au format PNG.' });
  }

  const id = randomUUID();
  const filename = `${id}.png`;
  const deleteToken = randomUUID();
  const caption = String(req.body?.caption ?? '').slice(0, MAX_CAPTION_LENGTH);

  fs.writeFileSync(path.join(MEMES_DIR, filename), req.file.buffer);
  insertMeme.run(id, filename, caption, deleteToken, new Date().toISOString());

  res.status(201).json({ ...toPublicMeme(findMeme.get(id)), deleteToken });
});

router.delete('/:id', (req, res) => {
  const meme = findMeme.get(req.params.id);
  if (!meme) {
    return res.status(404).json({ error: 'Ce mème n\'existe plus.' });
  }
  if (req.get('x-delete-token') !== meme.delete_token) {
    return res.status(403).json({ error: 'Seul le créateur de ce mème peut le supprimer.' });
  }

  deleteMeme.run(meme.id);
  fs.rmSync(path.join(MEMES_DIR, meme.filename), { force: true });
  res.status(204).end();
});

export default router;
