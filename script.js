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

const renderNextSukokura = (list) => {
  const container = document.getElementById('next-sukokura-container');
  if (!container) return;

  const now = new Date();
  // 今日の00:00:00を基準（Today）
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Todayより前の過去の日は完全に除外
  const upcomingList = (list || [])
    .filter((item) => {
      const dt = parseDateTime(item.date, item.time);
      return dt && dt >= todayStart;
    })
    .sort((a, b) => {
      const dtA = parseDateTime(a.date, a.time);
      const dtB = parseDateTime(b.date, b.time);
      return dtA - dtB;
    });

  if (!upcomingList.length) {
    container.innerHTML = '<div style="color:#64748b; font-size: 14px;">予定されている「すこくら」はありません</div>';
    return;
  }

  // 直近の1件を取得
  const item = upcomingList[0];

  container.innerHTML = '';
  
  // スケジュール一覧の「entry」タイルと同じクラス・構造で作成
  const box = document.createElement('div');
  box.className = 'entry';
  box.style.margin = '0';
  box.style.background = '#f8fafc';
  box.style.border = '1px solid #e2e8f0';
  box.style.boxShadow = 'none';

  const header = document.createElement('header');
  
  // 日時を大きめの黒字で表示
  const title = document.createElement('h4');
  const timeStr = item.time ? ` ${item.time}` : '';
  title.textContent = `${item.date || '日付未設定'}${timeStr}`;
  title.style.color = '#0f172a';
  title.style.fontSize = '18px';
  title.style.fontWeight = '800';

  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.textContent = item.kind || '練習';
  if (item.kind === '本番') {
    chip.style.background = '#e11d48';
    chip.style.color = '#ffffff';
  }

  header.appendChild(title);
  header.appendChild(chip);
  box.appendChild(header);

  if (item.memo) {
    const memo = document.createElement('div');
    memo.className = 'meta';
    memo.style.color = '#475569';
    memo.style.marginTop = '8px';
    memo.style.fontSize = '14px';
    memo.textContent = item.memo;
    box.appendChild(memo);
  }

  container.appendChild(box);
};

const render = (list) => {
  renderNextSukokura(list);
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
    
    // 日付・時間をメインの大きな黒字で見やすく表示
    const title = document.createElement('h4');
    const timeStr = item.time ? ` ${item.time}` : '';
    title.textContent = `${item.date || '日付未設定'}${timeStr}`;
    title.style.color = '#0f172a';
    title.style.fontSize = '17px';
    title.style.fontWeight = '700';

    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = item.kind || '練習';
    if (item.kind === '本番') {
      chip.style.background = '#e11d48';
      chip.style.color = '#ffffff';
    }

    const del = document.createElement('button');
    del.className = 'delete';
    del.textContent = '×';
    del.title = '削除';
    del.onclick = () => {
      if (confirm('この予定を削除しますか？')) {
        deleteEntry(item.id);
      }
    };

    header.appendChild(title);
    header.appendChild(chip);
    header.appendChild(del);
    box.appendChild(header);

    if (item.memo) {
      const memo = document.createElement('div');
      memo.className = 'meta';
      memo.style.color = '#475569';
      memo.style.marginTop = '6px';
      memo.style.fontSize = '14px';
      memo.textContent = item.memo;
      box.appendChild(memo);
    }
    entriesEl.appendChild(box);
  });
};

// フォーム送信処理
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const kind = document.getElementById('kind').value;
  const memo = document.getElementById('memo').value.trim();
  if (!date) return;
  
  saveEntry({ date, time, kind, memo });
  form.reset();
  document.getElementById('time').value = '19:00';
  document.getElementById('kind').value = '練習';
});

// 初期読み込み
fetchSchedules();
