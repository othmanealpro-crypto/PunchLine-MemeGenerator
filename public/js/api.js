const API_URL = '/api/memes';

async function readError(response, fallback) {
  try {
    return (await response.json()).error || fallback;
  } catch {
    return fallback;
  }
}

export async function fetchMemes() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error(await readError(response, 'La galerie n\'a pas pu être chargée.'));
  return response.json();
}

export async function saveMeme(blob, caption) {
  const body = new FormData();
  body.append('caption', caption);
  body.append('image', blob, 'meme.png');

  const response = await fetch(API_URL, { method: 'POST', body });
  if (!response.ok) throw new Error(await readError(response, 'Le mème n\'a pas pu être enregistré.'));
  return response.json();
}

export async function removeMeme(id, deleteToken) {
  const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'x-delete-token': deleteToken },
  });
  if (!response.ok) throw new Error(await readError(response, 'Le mème n\'a pas pu être supprimé.'));
}
