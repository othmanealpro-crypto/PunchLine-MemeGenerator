export function downloadUrl(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  downloadUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function createShareDialog({ notify }) {
  const dialog = document.querySelector('#share-dialog');
  const image = document.querySelector('#share-image');
  const linkInput = document.querySelector('#share-link');
  const warning = document.querySelector('#share-warning');
  const nativeButton = document.querySelector('#share-native');
  const links = {
    x: document.querySelector('#share-x'),
    facebook: document.querySelector('#share-facebook'),
    whatsapp: document.querySelector('#share-whatsapp'),
  };
  let currentUrl = '';

  document.querySelector('#share-close').addEventListener('click', () => dialog.close());

  document.querySelector('#share-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      notify('Lien copié');
    } catch {
      linkInput.select();
      notify('Copiez le lien sélectionné');
    }
  });

  nativeButton.addEventListener('click', async () => {
    try {
      await navigator.share({ title: 'Mon mème', url: currentUrl });
    } catch (error) {
      if (error.name !== 'AbortError') notify('Le partage a échoué. Copiez plutôt le lien.');
    }
  });

  return {
    open(meme) {
      currentUrl = new URL(meme.url, location.origin).href;
      const encoded = encodeURIComponent(currentUrl);
      const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);

      image.src = meme.url;
      image.alt = meme.caption ? `Mème : ${meme.caption}` : 'Mème à partager';
      linkInput.value = currentUrl;
      warning.hidden = !isLocal;
      nativeButton.hidden = !navigator.share;
      links.x.href = `https://twitter.com/intent/tweet?url=${encoded}`;
      links.facebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
      links.whatsapp.href = `https://wa.me/?text=${encoded}`;
      dialog.showModal();
    },
  };
}
