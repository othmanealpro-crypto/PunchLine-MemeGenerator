const MAX_SIDE = 1200;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const LINE_HEIGHT = 1.12;
const TEXT_WIDTH_RATIO = 0.92;
const NUDGE = 0.01;

function newText(y, content = '') {
  return {
    id: crypto.randomUUID(),
    content,
    x: 0.5,
    y,
    size: 9,
    font: "Impact, Haettenschweiler, 'Arial Narrow Bold', 'Arial Black', sans-serif",
    color: '#ffffff',
    outline: '#000000',
    upper: true,
  };
}

function clamp(value) {
  return Math.min(1, Math.max(0, value));
}

function wrapLines(ctx, text, maxWidth) {
  const lines = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

function layoutText(ctx, text, width, height) {
  const fontSize = (text.size / 100) * width;
  ctx.font = `${fontSize}px ${text.font}`;
  const content = text.upper ? text.content.toLocaleUpperCase('fr') : text.content;
  const lines = wrapLines(ctx, content, width * TEXT_WIDTH_RATIO);
  const lineHeight = fontSize * LINE_HEIGHT;
  const blockHeight = lines.length * lineHeight;
  const blockWidth = Math.max(...lines.map((line) => ctx.measureText(line).width));
  const centerX = text.x * width;
  const margin = fontSize * 0.2;
  const maxTop = Math.max(margin, height - blockHeight - margin);
  const top = Math.min(maxTop, Math.max(margin, text.y * height - blockHeight / 2));
  return { fontSize, lines, lineHeight, blockWidth, blockHeight, centerX, top };
}

function drawText(ctx, text, width, height) {
  if (!text.content.trim()) return;
  const layout = layoutText(ctx, text, width, height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  ctx.lineWidth = layout.fontSize * 0.14;
  ctx.strokeStyle = text.outline;
  ctx.fillStyle = text.color;
  layout.lines.forEach((line, index) => {
    const y = layout.top + index * layout.lineHeight;
    ctx.strokeText(line, layout.centerX, y);
    ctx.fillText(line, layout.centerX, y);
  });
}

function drawSample() {
  const sample = document.createElement('canvas');
  sample.width = 1000;
  sample.height = 800;
  const ctx = sample.getContext('2d');
  ctx.fillStyle = '#4aa8e8';
  ctx.fillRect(0, 0, 1000, 800);
  ctx.fillStyle = '#ffd400';
  ctx.beginPath();
  ctx.arc(760, 220, 110, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2f9e62';
  ctx.beginPath();
  ctx.ellipse(250, 860, 620, 340, 0, 0, Math.PI * 2);
  ctx.ellipse(850, 900, 520, 320, 0, 0, Math.PI * 2);
  ctx.fill();
  return sample;
}

export function createEditor({ onError }) {
  const stage = document.querySelector('#stage');
  const dropzone = document.querySelector('#dropzone');
  const canvas = document.querySelector('#canvas');
  const ctx = canvas.getContext('2d');
  const fileInput = document.querySelector('#file-input');
  const controls = document.querySelector('#controls');
  const textList = document.querySelector('#text-list');
  const sizeInput = document.querySelector('#text-size');
  const sizeValue = document.querySelector('#text-size-value');
  const fontInput = document.querySelector('#text-font');
  const colorInput = document.querySelector('#text-color');
  const outlineInput = document.querySelector('#text-outline');
  const upperInput = document.querySelector('#text-upper');

  let image = null;
  let texts = [newText(0.12), newText(0.88)];
  let selectedId = texts[0].id;
  let drag = null;
  let revision = 0;
  const changeListeners = new Set();

  const selected = () => texts.find((text) => text.id === selectedId);

  function render() {
    if (!image) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    texts.forEach((text) => drawText(ctx, text, canvas.width, canvas.height));

    // Ce repère n'existe que dans l'aperçu : exportBlob() ne le dessine pas.
    const current = selected();
    if (current?.content.trim()) {
      const box = layoutText(ctx, current, canvas.width, canvas.height);
      ctx.save();
      ctx.setLineDash([12, 8]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffd400';
      ctx.strokeRect(
        box.centerX - box.blockWidth / 2 - 8,
        box.top - 8,
        box.blockWidth + 16,
        box.blockHeight + 16,
      );
      ctx.restore();
    }
  }

  function changed() {
    revision += 1;
    render();
    changeListeners.forEach((listener) => listener());
  }

  function syncControls() {
    const text = selected();
    if (!text) return;
    sizeInput.value = text.size;
    sizeValue.textContent = `${text.size} %`;
    fontInput.value = text.font;
    colorInput.value = text.color;
    outlineInput.value = text.outline;
    upperInput.checked = text.upper;
    textList.querySelectorAll('.text-row').forEach((row) => {
      row.classList.toggle('is-selected', row.dataset.id === selectedId);
    });
  }

  function select(id) {
    selectedId = id;
    syncControls();
    render();
  }

  function renderTextList() {
    textList.replaceChildren(...texts.map((text, index) => {
      const row = document.createElement('div');
      row.className = 'text-row';
      row.dataset.id = text.id;

      const area = document.createElement('textarea');
      area.id = `text-${text.id}`;
      area.value = text.content;
      area.rows = 2;
      area.maxLength = 200;
      area.placeholder = 'Votre texte';
      area.setAttribute('aria-label', `Texte ${index + 1}`);
      area.addEventListener('focus', () => select(text.id));
      area.addEventListener('input', () => {
        text.content = area.value;
        changed();
      });
      row.append(area);

      if (texts.length > 1) {
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'btn btn-remove';
        remove.textContent = '×';
        remove.setAttribute('aria-label', `Supprimer le texte ${index + 1}`);
        remove.addEventListener('click', () => {
          texts = texts.filter((item) => item.id !== text.id);
          if (selectedId === text.id) selectedId = texts[0].id;
          renderTextList();
          changed();
        });
        row.append(remove);
      }
      return row;
    }));
    syncControls();
  }

  function useImage(source, width, height) {
    const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    image = source;
    dropzone.hidden = true;
    canvas.hidden = false;
    controls.disabled = false;
    changed();
  }

  function loadFile(file) {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      onError('Choisissez une image JPG, PNG, WebP ou GIF.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      onError('Cette image dépasse 15 Mo. Choisissez un fichier plus léger.');
      return;
    }
    const url = URL.createObjectURL(file);
    const picture = new Image();
    picture.onload = () => {
      useImage(picture, picture.naturalWidth, picture.naturalHeight);
      URL.revokeObjectURL(url);
    };
    picture.onerror = () => {
      URL.revokeObjectURL(url);
      onError('Cette image est illisible. Essayez un autre fichier.');
    };
    picture.src = url;
  }

  function hitTest(x, y) {
    for (const text of [...texts].reverse()) {
      if (!text.content.trim()) continue;
      const box = layoutText(ctx, text, canvas.width, canvas.height);
      const insideX = Math.abs(x - box.centerX) <= box.blockWidth / 2 + 12;
      const insideY = y >= box.top - 12 && y <= box.top + box.blockHeight + 12;
      if (insideX && insideY) return text;
    }
    return null;
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(event);
    const text = hitTest(point.x, point.y);
    if (!text) return;
    select(text.id);
    drag = {
      offsetX: text.x - point.x / canvas.width,
      offsetY: text.y - point.y / canvas.height,
    };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('is-grabbing');
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const point = canvasPoint(event);
    const text = selected();
    text.x = clamp(point.x / canvas.width + drag.offsetX);
    text.y = clamp(point.y / canvas.height + drag.offsetY);
    changed();
  });

  const endDrag = () => {
    drag = null;
    canvas.classList.remove('is-grabbing');
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  canvas.addEventListener('keydown', (event) => {
    const moves = {
      ArrowLeft: ['x', -NUDGE],
      ArrowRight: ['x', NUDGE],
      ArrowUp: ['y', -NUDGE],
      ArrowDown: ['y', NUDGE],
    };
    const move = moves[event.key];
    const text = selected();
    if (!move || !text) return;
    event.preventDefault();
    text[move[0]] = clamp(text[move[0]] + move[1]);
    changed();
  });

  ['dragenter', 'dragover'].forEach((type) => {
    stage.addEventListener(type, (event) => {
      event.preventDefault();
      stage.classList.add('is-dragging');
    });
  });
  ['dragleave', 'drop'].forEach((type) => {
    stage.addEventListener(type, (event) => {
      event.preventDefault();
      stage.classList.remove('is-dragging');
    });
  });
  stage.addEventListener('drop', (event) => loadFile(event.dataTransfer.files[0]));

  fileInput.addEventListener('change', () => {
    loadFile(fileInput.files[0]);
    fileInput.value = '';
  });

  const chooseFile = () => fileInput.click();
  document.querySelector('#choose-image').addEventListener('click', chooseFile);
  document.querySelector('#change-image').addEventListener('click', chooseFile);

  document.querySelector('#use-sample').addEventListener('click', () => {
    texts[0].content = 'Quand le code marche';
    if (texts[1]) texts[1].content = 'du premier coup';
    renderTextList();
    const sample = drawSample();
    useImage(sample, sample.width, sample.height);
  });

  document.querySelector('#add-text').addEventListener('click', () => {
    const text = newText(0.5);
    texts.push(text);
    selectedId = text.id;
    renderTextList();
    document.querySelector(`#text-${text.id}`).focus();
    changed();
  });

  const bindControl = (input, read) => {
    input.addEventListener('input', () => {
      const text = selected();
      if (!text) return;
      read(text);
      syncControls();
      changed();
    });
  };
  bindControl(sizeInput, (text) => { text.size = Number(sizeInput.value); });
  bindControl(fontInput, (text) => { text.font = fontInput.value; });
  bindControl(colorInput, (text) => { text.color = colorInput.value; });
  bindControl(outlineInput, (text) => { text.outline = outlineInput.value; });
  bindControl(upperInput, (text) => { text.upper = upperInput.checked; });

  renderTextList();

  return {
    hasImage: () => Boolean(image),
    getRevision: () => revision,
    getCaption: () => texts.map((text) => text.content.trim()).filter(Boolean).join(' / '),
    onChange: (listener) => changeListeners.add(listener),

    // L'export repart d'un canvas neuf pour exclure le repère de sélection.
    exportBlob() {
      const output = document.createElement('canvas');
      output.width = canvas.width;
      output.height = canvas.height;
      const outputCtx = output.getContext('2d');
      outputCtx.drawImage(image, 0, 0, output.width, output.height);
      texts.forEach((text) => drawText(outputCtx, text, output.width, output.height));
      return new Promise((resolve, reject) => {
        output.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Le mème n\'a pas pu être généré. Réessayez avec une autre image.'));
        }, 'image/png');
      });
    },
  };
}
