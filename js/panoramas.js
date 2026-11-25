export function createPanoramaManager({
  sceneEl,
  assetsEl,
  selectEl,
  uploadInputEl,
  reloadBtnEl,
  statusMsgEl
}) {
  let uploadCounter = 0;

  function setStatus(message) {
    if (statusMsgEl) {
      statusMsgEl.textContent = message;
    }
  }

  async function applyPanorama(selector) {
    if (!selector || !sceneEl) return;

    const targetId = selector.replace('#', '');
    const imgEl = document.getElementById(targetId);
    if (!imgEl) return;

    setStatus(`Decoding ${targetId}...`);

    try {
      if (!imgEl.complete) {
        await new Promise((resolve, reject) => {
          imgEl.addEventListener('load', resolve, { once: true });
          imgEl.addEventListener('error', reject, { once: true });
        });
      }
      if (typeof imgEl.decode === 'function') {
        await imgEl.decode();
      }
    } catch (err) {
      console.warn('Image load/decode issue:', err);
      setStatus(`Failed to load ${targetId}`);
      return;
    }

    const oldSky = document.querySelector('#sky');
    if (oldSky && oldSky.parentNode) {
      oldSky.parentNode.removeChild(oldSky);
    }

    const newSky = document.createElement('a-sky');
    newSky.setAttribute('id', 'sky');
    newSky.setAttribute('src', selector);
    newSky.setAttribute('rotation', '0 -90 0');
    sceneEl.appendChild(newSky);

    sceneEl.components?.raycaster?.refreshObjects();
    const cursorEl = sceneEl.querySelector('a-cursor');
    cursorEl?.components?.raycaster?.refreshObjects();

    setStatus(`Loaded ${targetId}`);
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file || !assetsEl || !selectEl) return;

    uploadCounter++;
    const id = `uploaded-pano-${uploadCounter}`;
    const blobUrl = URL.createObjectURL(file);

    const imgEl = document.createElement('img');
    imgEl.id = id;
    imgEl.src = blobUrl;
    assetsEl.appendChild(imgEl);

    const option = document.createElement('option');
    option.value = `#${id}`;
    option.dataset.dynamic = 'true';
    option.textContent = `Upload: ${file.name.slice(0, 32)}`;
    selectEl.appendChild(option);
    selectEl.value = `#${id}`;

    await applyPanorama(`#${id}`);
    uploadInputEl.value = '';
  }

  async function fetchWikimedia() {
    if (!selectEl || !assetsEl) return;

    setStatus('Fetching from Wikimedia...');
    if (reloadBtnEl) reloadBtnEl.disabled = true;

    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      generator: 'categorymembers',
      gcmtitle: 'Category:360° panoramas with equirectangular projection',
      gcmtype: 'file',
      gcmlimit: '50',
      prop: 'imageinfo',
      iiprop: 'url|size',
      iiurlwidth: '2048'
    });

    try {
      const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
      const data = await res.json();
      const pages = Object.values(data.query?.pages || {});

      [...selectEl.options].forEach((opt) => {
        if (opt.dataset.dynamic === 'true') opt.remove();
      });

      let addedCount = 0;

      for (const page of pages) {
        const info = page.imageinfo?.[0];
        const imgUrl = info?.thumburl || info?.url;
        const w = info?.thumbwidth || info?.width;
        const h = info?.thumbheight || info?.height;

        if (!imgUrl || !/\.jpe?g$/i.test(page.title)) continue;

        if (w && h) {
          const ratio = w / h;
          if (ratio < 1.6 || ratio > 2.4) continue;
        }

        const id = `wiki-pano-${page.pageid}`;
        let imgEl = document.getElementById(id);

        if (!imgEl) {
          imgEl = document.createElement('img');
          imgEl.id = id;
          imgEl.crossOrigin = 'anonymous';
          imgEl.src = imgUrl;
          assetsEl.appendChild(imgEl);
        }

        const option = document.createElement('option');
        option.value = `#${id}`;
        option.dataset.dynamic = 'true';
        option.textContent = `Wiki: ${page.title.replace(/^File:/i, '').slice(0, 40)}`;
        selectEl.appendChild(option);
        addedCount++;
      }

      setStatus(`Added ${addedCount} 360° Wiki scenes`);
    } catch (err) {
      console.error(err);
      setStatus('Wikimedia fetch error');
    } finally {
      if (reloadBtnEl) reloadBtnEl.disabled = false;
    }
  }

  function init() {
    selectEl?.addEventListener('change', (event) => {
      applyPanorama(event.target.value);
    });
    uploadInputEl?.addEventListener('change', handleUpload);
    reloadBtnEl?.addEventListener('click', fetchWikimedia);
    fetchWikimedia();
  }

  return {
    init,
    applyPanorama,
    fetchWikimedia
  };
}