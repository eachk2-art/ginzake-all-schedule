# ギンザケ水揚げ予定管理アプリ

## 構成
- フロントエンド：React + Vite → GitHub Pages
- バックエンド：Google Apps Script（スプレッドシートAPI）

---

## セットアップ手順

### 1. Googleスプレッドシートを準備する

1. Google スプレッドシートを新規作成
2. URLから**スプレッドシートID**をコピーする  
   例：`https://docs.google.com/spreadsheets/d/【ここがID】/edit`

---

### 2. GAS（Google Apps Script）をセットアップする

1. スプレッドシートのメニューから  
   「拡張機能」→「Apps Script」を開く

2. `gas/Code.gs` の内容を全コピーして貼り付ける

3. **1行目のスプレッドシートIDを書き換える**
   ```js
   const SPREADSHEET_ID = '【コピーしたID】';
   ```

4. 関数 `setupSheets` を実行する（初回のみ）  
   → シートと初期データが自動で作成されます

5. 「デプロイ」→「新しいデプロイ」を選択
   - 種類：ウェブアプリ
   - 実行ユーザー：自分
   - アクセス：**全員**（認証不要にするため）
   - → デプロイ後に表示される **WebアプリURL** をコピー

---

### 3. Reactアプリをセットアップする

```bash
# 依存パッケージをインストール
npm install

# 環境変数ファイルを作成
cp .env.example .env

# .env を開いてGAS URLを入力
# VITE_GAS_URL=https://script.google.com/macros/s/【デプロイID】/exec
```

`vite.config.js` の `base` をGitHubリポジトリ名に合わせる：
```js
base: '/【リポジトリ名】/',
```

`package.json` の `homepage` を追加：
```json
"homepage": "https://【GitHubユーザー名】.github.io/【リポジトリ名】"
```

---

### 4. ローカルで動作確認

```bash
npm run dev
```
→ http://localhost:5173 で確認

---

### 5. GitHub Pagesにデプロイ

```bash
# 初回のみ：GitHubリポジトリを作成してpush
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/【ユーザー名】/【リポジトリ名】.git
git push -u origin main

# デプロイ
npm run deploy
```
→ `https://【ユーザー名】.github.io/【リポジトリ名】/` でアクセス可能になります

---

## 操作者名の設定

アプリ内「設定」タブで操作者名を入力・保存してください。  
変更ログに「誰が変更したか」が記録されます。

---

## ファイル構成

```
ginzake-app/
├── gas/
│   └── Code.gs          # GAS APIコード
├── src/
│   ├── lib/
│   │   ├── api.js        # GAS通信層
│   │   ├── constants.js  # マスターデータ・定数
│   │   └── dateUtils.js  # 日付ユーティリティ
│   ├── hooks/
│   │   └── useSchedules.js  # データ取得フック
│   ├── components/
│   │   ├── UI.jsx        # 共通UIコンポーネント
│   │   └── ScheduleForm.jsx  # 予定入力フォーム
│   ├── pages/
│   │   ├── DayView.jsx      # 当日ビュー
│   │   ├── WeekView.jsx     # 週ビュー
│   │   ├── CalendarView.jsx # 暦ビュー
│   │   ├── RegisterView.jsx # 登録・編集画面
│   │   └── SettingsView.jsx # 設定画面
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```
