// Firebase設定情報
// 以下の手順で取得してください：
// 1. https://console.firebase.google.com/ にアクセス
// 2. プロジェクトを作成（または既存プロジェクトを選択）
// 3. 「プロジェクトの設定」→「全般」タブ
// 4. 「アプリを追加」→「ウェブ」を選択
// 5. 表示された設定情報を以下の形式で入力

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase初期化
firebase.initializeApp(firebaseConfig);
// グローバルスコープで使用できるようにする
window.database = firebase.database();

