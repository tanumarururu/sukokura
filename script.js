const form = document.getElementById('scheduleForm');
const entriesEl = document.getElementById('entries');
const SCHEDULE_PATH = 'schedules';

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
  return list.filter((item) => {
    const dt = parseDateTime(item.date, item.time);
    if (!dt) return false;
    return dt >= todayStart;
  });
};

// Firebaseからデータを読み込み
const loadEntries = (callback) => {
  const database = window.database;
  if (!database) {
    console.error('Firebaseが初期化されていません。firebase-config.jsを設定してください。');
    callback([]);
    return;
  }
  
  database.ref(SCHEDULE_PATH).once('value', (snapshot) => {
    const data = snapshot.val();
    const list = data ? Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    })) : [];
    const filtered = cleanupExpired(list);
    callback(filtered);
  });
};

// Firebaseにデータを保存
const saveEntry = (entry) => {
  const database = window.database;
  if (!database) {
    console.error('Firebaseが初期化されていません。');
    return;
  }
  const newEntryRef = database.ref(SCHEDULE_PATH).push();
  newEntryRef.set({
    date: entry.date,
    time: entry.time,
    place: entry.place,
    kind: entry.kind || '練習',
    memo: entry.memo || '',
    createdAt: Date.now()
  });
};

// Firebaseからデータを削除
const deleteEntry = (id) => {
  const database = window.database;
  if (!database) {
    console.error('Firebaseが初期化されていません。');
    return;
  }
  database.ref(`${SCHEDULE_PATH}/${id}`).remove();
};

const render = (list) => {
  entriesEl.innerHTML = '';
  if (!list || !list.length) {
    const empty = document.createElement('div');
    empty.className = 'meta';
    empty.textContent = 'まだ入力がありません。';
    entriesEl.appendChild(empty);
    return;
  }
  
  // 日付順にソート（新しい順）
  const sorted = [...list].sort((a, b) => {
    const dtA = parseDateTime(a.date, a.time);
    const dtB = parseDateTime(b.date, b.time);
    if (!dtA || !dtB) return 0;
    return dtA - dtB;
  });
  
  sorted.forEach((item) => {
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
      if (confirm('この予定を削除しますか？')) {
        deleteEntry(item.id);
      }
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

// フォーム送信処理
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const place = document.getElementById('place').value.trim();
  const kind = document.getElementById('kind').value;
  const memo = document.getElementById('memo').value.trim();
  if (!date) return;
  
  saveEntry({ date, time, place, kind, memo });
  form.reset();
  document.getElementById('time').value = '19:00';
  document.getElementById('kind').value = '練習';
});

// 初期読み込み
if (typeof window.database !== 'undefined') {
  loadEntries(render);
  
  // リアルタイム更新を監視
  window.database.ref(SCHEDULE_PATH).on('value', (snapshot) => {
    const data = snapshot.val();
    const list = data ? Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    })) : [];
    const filtered = cleanupExpired(list);
    render(filtered);
  });
} else {
  console.warn('Firebaseが初期化されていません。firebase-config.jsを確認してください。');
  entriesEl.innerHTML = '<div class="meta">Firebaseの設定が必要です。firebase-config.jsを設定してください。</div>';
}
