import { saveMeme } from './api.js';
import { createEditor } from './editor.js';
import { createGallery, rememberDeleteToken } from './gallery.js';
import { createShareDialog, downloadBlob } from './share.js';

const toast = document.querySelector('#toast');
const saveButton = document.querySelector('#save');
const downloadButton = document.querySelector('#download');
const shareButton = document.querySelector('#share');
const changeImageButton = document.querySelector('#change-image');

let toastTimer;
function notify(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3500);
}

const editor = createEditor({ onError: notify });
const shareDialog = createShareDialog({ notify });
const gallery = createGallery({ notify, onShare: (meme) => shareDialog.open(meme) });

// Évite un doublon quand on enregistre puis partage le même mème sans le modifier.
let saved = null;

async function saveCurrentMeme() {
  const revision = editor.getRevision();
  if (saved?.revision === revision) return saved.meme;

  const blob = await editor.exportBlob();
  const meme = await saveMeme(blob, editor.getCaption());
  rememberDeleteToken(meme.id, meme.deleteToken);
  saved = { revision, meme };
  await gallery.refresh();
  return meme;
}

async function withBusyActions(task) {
  const buttons = [saveButton, downloadButton, shareButton];
  buttons.forEach((button) => { button.disabled = true; });
  try {
    await task();
  } catch (error) {
    notify(error.message);
  } finally {
    buttons.forEach((button) => { button.disabled = false; });
  }
}

editor.onChange(() => {
  const ready = editor.hasImage();
  [saveButton, downloadButton, shareButton, changeImageButton].forEach((button) => {
    button.disabled = !ready;
  });
});

saveButton.addEventListener('click', () => withBusyActions(async () => {
  const alreadySaved = saved?.revision === editor.getRevision();
  await saveCurrentMeme();
  notify(alreadySaved ? 'Ce mème est déjà dans la galerie' : 'Mème enregistré dans la galerie');
}));

downloadButton.addEventListener('click', () => withBusyActions(async () => {
  downloadBlob(await editor.exportBlob(), 'mon-meme.png');
  notify('Téléchargement lancé');
}));

shareButton.addEventListener('click', () => withBusyActions(async () => {
  shareDialog.open(await saveCurrentMeme());
}));

function showView() {
  const view = location.hash === '#galerie' ? 'galerie' : 'creer';
  document.querySelector('#view-creer').hidden = view !== 'creer';
  document.querySelector('#view-galerie').hidden = view !== 'galerie';
  document.querySelectorAll('.tab').forEach((tab) => {
    if (tab.dataset.view === view) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  if (view === 'galerie') gallery.refresh();
}

window.addEventListener('hashchange', showView);
showView();
