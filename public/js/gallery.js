import { fetchMemes, removeMeme } from './api.js';
import { downloadUrl } from './share.js';

const TOKENS_KEY = 'punchline-delete-tokens';

function readTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY)) || {};
  } catch {
    return {};
  }
}

function writeTokens(tokens) {
  try {
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  } catch {
    // Sans stockage local, le mème reste dans la galerie mais ne pourra pas être supprimé.
  }
}

export function rememberDeleteToken(id, token) {
  writeTokens({ ...readTokens(), [id]: token });
}

function button(label, className, onClick) {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = className;
  element.textContent = label;
  element.addEventListener('click', onClick);
  return element;
}

export function createGallery({ notify, onShare }) {
  const list = document.querySelector('#gallery');
  const message = document.querySelector('#gallery-message');

  function showMessage(text) {
    message.textContent = text;
    message.hidden = !text;
  }

  async function remove(meme, token) {
    try {
      await removeMeme(meme.id, token);
      const tokens = readTokens();
      delete tokens[meme.id];
      writeTokens(tokens);
      notify('Mème supprimé');
      await refresh();
    } catch (error) {
      notify(error.message);
    }
  }

  function card(meme, tokens) {
    const item = document.createElement('li');
    item.className = 'card';

    const image = document.createElement('img');
    image.src = meme.url;
    image.alt = meme.caption ? `Mème : ${meme.caption}` : 'Mème sans texte';
    image.loading = 'lazy';

    const time = document.createElement('time');
    time.dateTime = meme.createdAt;
    time.textContent = new Date(meme.createdAt).toLocaleString('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const actions = document.createElement('div');
    actions.className = 'row';
    actions.append(
      button('Télécharger', 'btn', () => downloadUrl(meme.url, `meme-${meme.id.slice(0, 8)}.png`)),
      button('Partager', 'btn', () => onShare(meme)),
    );

    const token = tokens[meme.id];
    if (token) {
      const removeButton = button('Supprimer', 'btn btn-danger', () => {
        // Premier clic : demande de confirmation. Second clic : suppression.
        if (removeButton.dataset.armed) {
          remove(meme, token);
          return;
        }
        removeButton.dataset.armed = 'true';
        removeButton.textContent = 'Confirmer la suppression';
      });
      actions.append(removeButton);
    }

    item.append(image, time, actions);
    return item;
  }

  async function refresh() {
    try {
      const memes = await fetchMemes();
      const tokens = readTokens();
      list.replaceChildren(...memes.map((meme) => card(meme, tokens)));
      showMessage(memes.length ? '' : 'La galerie est vide. Créez un mème et enregistrez-le pour le retrouver ici.');
    } catch (error) {
      list.replaceChildren();
      showMessage(error.message);
    }
  }

  return { refresh };
}
