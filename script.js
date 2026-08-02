const form = document.getElementById('scheduleForm');
const entriesEl = document.getElementById('entries');

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

// APIからデータを取得
const fetchSchedules = async () => {
  try {
    const res = await fetch('/api/schedules');
    if (!res.ok) throw new Error('データ取得に失敗しました');
    const data = await res.json();
    const filtered = cleanupExpired(data);
    render(filtered);
  } catch (err) {
    console.error(err);
    entriesEl.innerHTML = `<div class="meta">予定の読み込みに失敗しました (${err.message})</div>`;
  }
};

// APIにデータ保存
const saveEntry = async (entry) => {
  try {
    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error('保存に失敗しました');
    await fetchSchedules();
  } catch (err) {
    alert(`エラー: ${err.message}`);
  }
};

// APIからデータ削除
const deleteEntry = async (id) => {
  try {
    const res = await fetch(`/api/schedules?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('削除に失敗しました');
    await fetchSchedules();
  } catch (err) {
    alert(`エラー: ${err.message}`);
  }
};

const renderNextPractice = (list) => {
  const nextPracticeEl = document.getElementById('next-practice-info');
  if (!nextPracticeEl) return;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const upcomingPractices = (list || [])
    .filter((item) => (item.kind === '練習' || !item.kind))
    .filter((item) => {
      const dt = parseDateTime(item.date, item.time);
      return dt && dt >= todayStart;
    })
    .sort((a, b) => parseDateTime(a.date, a.time) - parseDateTime(b.date, b.time));

  if (!upcomingPractices.length) {
    nextPracticeEl.innerHTML = '<div style="color:#94a3b8; font-size: 14px;">直近の練習予定はありません</div>';
    return;
  }

  const next = upcomingPractices[0];
  const timeStr = next.time ? ` ${next.time}` : '';
  nextPracticeEl.innerHTML = `
    <div style="font-weight: 700; font-size: 16px; color: #fff;">🗓️ ${next.date}${timeStr}</div>
    <div style="margin-top: 4px; font-size: 14px; color: #cbd5e1;">📍 ${next.place || '場所未定'}</div>
    ${next.memo ? `<div style="margin-top: 4px; font-size: 13px; color: #94a3b8;">💬 ${next.memo}</div>` : ''}
  `;
};

const render = (list) => {
  renderNextPractice(list);
  entriesEl.innerHTML = '';
  if (!list || !list.length) {
    const empty = document.createElement('div');
    empty.className = 'meta';
    empty.textContent = 'まだ入力がありません。';
    entriesEl.appendChild(empty);
    return;
  }
  
  // 日付順にソート（昇順）
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
  if (!date || !place) return;
  
  saveEntry({ date, time, place, kind, memo });
  form.reset();
  document.getElementById('time').value = '19:00';
  document.getElementById('kind').value = '練習';
});

// 初期読み込み
fetchSchedules();
