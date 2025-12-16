const form = document.getElementById('scheduleForm');
const entriesEl = document.getElementById('entries');
const STORAGE_KEY = 'sukoyaka_schedule_entries_v4';

const parseDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  const [hh = 0, mm = 0] = (timeStr || '00:00').split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
};

const cleanupExpired = (list) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const filtered = list.filter((item) => {
    const dt = parseDateTime(item.date, item.time);
    if (!dt) return false; // 無効データは落とす
    return dt >= todayStart;
  });
  if (filtered.length !== list.length) {
    saveEntries(filtered);
  }
  return filtered;
};

const loadEntries = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    // 旧バージョンのデータにも対応し、必要なフィールドだけ拾う
    return Array.isArray(raw)
      ? raw.map((item) => ({
          date: item.date || '',
          time: item.time || '',
          place: item.place || '',
          kind: item.kind || '練習',
          memo: item.memo || '',
          createdAt: item.createdAt || Date.now(),
        }))
      : [];
  } catch (e) {
    console.warn('Failed to parse saved entries', e);
    return [];
  }
};

const saveEntries = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

const render = () => {
  const list = cleanupExpired(loadEntries());
  entriesEl.innerHTML = '';
  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 'meta';
    empty.textContent = 'まだ入力がありません。';
    entriesEl.appendChild(empty);
    return;
  }
  list.forEach((item, index) => {
    const box = document.createElement('div');
    box.className = 'entry';

    const header = document.createElement('header');
    const title = document.createElement('h4');
    title.textContent = item.place || '予定';

    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = item.kind || '練習';

    const del = document.createElement('button');
    del.className = 'delete';
    del.textContent = '×';
    del.title = '削除';
    del.onclick = () => {
      const next = loadEntries();
      next.splice(index, 1);
      saveEntries(next);
      render();
    };

    const meta = document.createElement('div');
    meta.className = 'meta';
    const timeStr = item.time ? ` ${item.time}` : '';
    meta.textContent = `${item.date || '日付未設定'}${timeStr}`;

    const memo = document.createElement('div');
    memo.className = 'meta';
    memo.textContent = item.memo || '';

    header.appendChild(title);
    header.appendChild(chip);
    header.appendChild(del);
    box.appendChild(header);
    box.appendChild(meta);
    if (item.memo) box.appendChild(memo);
    entriesEl.appendChild(box);
  });
};

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const place = document.getElementById('place').value.trim();
  const kind = document.getElementById('kind').value;
  const memo = document.getElementById('memo').value.trim();
  if (!date) return;
  const list = loadEntries();
  list.unshift({ date, time, place, kind, memo, createdAt: Date.now() });
  saveEntries(list);
  form.reset();
  document.getElementById('time').value = '19:00';
  document.getElementById('kind').value = '練習';
  render();
});

render();


