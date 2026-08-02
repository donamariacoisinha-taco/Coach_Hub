(() => {
  const base = '/academia-sem-medo/assets/';
  const read = async (name, count) => {
    const responses = await Promise.all(Array.from({length: count}, (_, index) => fetch(`${base}${name}.${index}.b64`, {cache: 'force-cache'})));
    if (responses.some((response) => !response.ok)) throw new Error(`Falha ao carregar ${name}`);
    return (await Promise.all(responses.map((response) => response.text()))).join('').replace(/\s/g, '');
  };
  Promise.all([read('cover', 3), read('atlas', 5)])
    .then(([cover, atlas]) => {
      document.querySelectorAll('[data-cover]').forEach((image) => { image.src = `data:image/webp;base64,${cover}`; });
      document.documentElement.style.setProperty('--atlas-image', `url("data:image/webp;base64,${atlas}")`);
      document.documentElement.classList.add('assets-loaded');
    })
    .catch((error) => {
      console.error('[Academia sem Medo] Falha ao carregar artes oficiais', error);
      document.documentElement.classList.add('assets-error');
    });
})();
