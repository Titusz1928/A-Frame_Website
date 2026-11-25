export function createInventoryManager({ listEl, onSelectionChange } = {}) {
  let selectedItemId = null;
  const items = [];

  function getSelectedItem() {
    return items.find((entry) => entry.id === selectedItemId) || null;
  }

  function hasItem(id) {
    return items.some((entry) => entry.id === id);
  }

  function clearSelection() {
    selectedItemId = null;
    render();
    if (typeof onSelectionChange === 'function') {
      onSelectionChange(null);
    }
  }

  function selectItem(itemId) {
    selectedItemId = selectedItemId === itemId ? null : itemId;
    render();
    if (typeof onSelectionChange === 'function') {
      onSelectionChange(getSelectedItem());
    }
  }

  function render() {
    if (!listEl) return;
    listEl.innerHTML = '';

    if (items.length === 0) {
      const emptyEl = document.createElement('span');
      emptyEl.className = 'inventory-empty';
      emptyEl.textContent = 'Empty — click items in the room';
      listEl.appendChild(emptyEl);
      return;
    }

    items.forEach((item) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'inventory-item';
      chip.classList.toggle('selected', item.id === selectedItemId);
      chip.setAttribute('aria-pressed', String(item.id === selectedItemId));

      if (item.iconSrc) {
        const icon = document.createElement('img');
        icon.src = item.iconSrc;
        icon.alt = item.label;
        chip.appendChild(icon);
      }

      const text = document.createElement('span');
      text.textContent = item.label;
      chip.appendChild(text);

      chip.addEventListener('click', () => selectItem(item.id));
      listEl.appendChild(chip);
    });
  }

  function addItem(item) {
    if (!item || hasItem(item.id)) return;
    items.push({
      id: item.id,
      label: item.label,
      iconSrc: item.iconSrc || '',
      clueText: item.clueText || ''
    });
    if (!selectedItemId) {
      selectedItemId = item.id;
    }
    render();
    if (typeof onSelectionChange === 'function') {
      onSelectionChange(getSelectedItem());
    }
  }

  render();

  return {
    addItem,
    selectItem,
    clearSelection,
    getSelectedItem,
    hasItem,
    render
  };
}