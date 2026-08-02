(() => {
  const base = '/academia-sem-medo/assets/';

  const readChunks = async (name, count) => {
    const responses = await Promise.all(
      Array.from({ length: count }, (_, index) =>
        fetch(`${base}${name}.${index}.b64`, {
          cache: 'no-store',
          credentials: 'same-origin',
        })
      )
    );

    const failed = responses.find((response) => !response.ok);
    if (failed) {
      throw new Error(`Falha ao carregar ${name}: HTTP ${failed.status}`);
    }

    const chunks = await Promise.all(responses.map((response) => response.text()));
    const value = chunks.join('').replace(/\s/g, '');

    if (!value.startsWith('UklG')) {
      throw new Error(`Conteúdo inválido recebido para ${name}`);
    }

    return value;
  };

  const base64ToObjectUrl = (base64Value, mimeType) => {
    const binary = atob(base64Value);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  };

  const preloadImage = (source) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(source);
      image.onerror = () => reject(new Error('Falha ao decodificar a imagem WebP'));
      image.src = source;
    });

  Promise.all([readChunks('cover', 3), readChunks('atlas', 5)])
    .then(([coverBase64, atlasBase64]) => {
      const coverUrl = base64ToObjectUrl(coverBase64, 'image/webp');
      const atlasUrl = base64ToObjectUrl(atlasBase64, 'image/webp');

      return Promise.all([preloadImage(coverUrl), preloadImage(atlasUrl)]).then(() => ({
        coverUrl,
        atlasUrl,
      }));
    })
    .then(({ coverUrl, atlasUrl }) => {
      document.querySelectorAll('[data-cover]').forEach((image) => {
        image.src = coverUrl;
      });

      document.documentElement.style.setProperty('--atlas-image', `url("${atlasUrl}")`);
      document.documentElement.classList.add('assets-loaded');
    })
    .catch((error) => {
      console.error('[Academia sem Medo] Falha ao carregar artes oficiais', error);
      document.documentElement.classList.add('assets-error');
    });
})();
