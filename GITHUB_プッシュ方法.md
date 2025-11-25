# 🚀 GitHubにコードをプッシュする（超簡単・VSCode版）

## 🎯 ゴール
VSCodeのボタンだけでGitHubにコードをアップロードします！

---

## ステップ1️⃣: GitHubで新しいリポジトリを作成

1. [GitHub.com](https://github.com/) にアクセスしてログイン
2. 右上の **「+」** → **「New repository」** をクリック
3. 以下を入力:
   - **Repository name**: `goshinkai-v1`
   - **Description**: （空欄でOK）
   - **Public** または **Private** を選択（どちらでもOK）
   - ✅ **「Add a README file」のチェックは外す**（重要！）
4. **「Create repository」** をクリック
5. 画面に表示される **リポジトリURL** をコピー
   - 例: `https://github.com/あなたのユーザー名/goshinkai-v1.git`

---

## ステップ2️⃣: VSCodeでGitを初期化

1. VSCodeで `goshinkai_v1` フォルダを開いている状態で
2. 左サイドバーの **「ソース管理」アイコン** をクリック（ブランチのようなアイコン）
3. **「リポジトリを初期化する」** ボタンをクリック

---

## ステップ3️⃣: .gitignoreを確認

`.gitignore` ファイルが存在するか確認:
- VSCodeのエクスプローラーで `.gitignore` が見える → OK
- 見えない → 新規作成して以下を貼り付け:

```
# .gitignore
.next
node_modules
.env.local
.vercel
```

---

## ステップ4️⃣: すべてのファイルをステージング

1. サイドバーの「ソース管理」画面で
2. **「変更」** の横にある **「+」ボタン** をクリック
   - → すべてのファイルが「ステージされた変更」に移動します

---

## ステップ5️⃣: コミット

1. 上部のテキストボックス（「メッセージ」と書かれている）に入力:
   ```
   Initial commit
   ```
2. **「✓ コミット」** ボタンをクリック

---

## ステップ6️⃣: GitHubリモートを追加

1. VSCodeの上部メニュー → **「表示」** → **「コマンドパレット」** (または `Ctrl+Shift+P`)
2. 「Git: Add Remote」と入力して選択
3. **Remote name**: `origin` と入力してEnter
4. **Remote URL**: ステップ1でコピーしたGitHubのURL（`https://github.com/...`）を貼り付けてEnter

---

## ステップ7️⃣: プッシュ

1. サイドバーの「ソース管理」で
2. 右上の **「...」** (三点リーダー) → **「プッシュ」** をクリック
3. 「このブランチのアップストリームがありません」と表示されたら:
   - **「main」** を選択してEnter
4. GitHubのユーザー名とパスワード（またはPersonal Access Token）を入力
   - 初回のみ

---

## ✅ 確認方法

1. GitHubのリポジトリページをブラウザで開く
2. ファイルが表示されていればOK！🎉

---

## 🐛 トラブルシューティング

**「リポジトリを初期化する」ボタンが見えない**
→ すでに初期化済みです。ステップ4に進んでください

**「認証に失敗しました」**
→ GitHubのPersonal Access Tokenが必要です
1. GitHub → Settings → Developer settings → Personal access tokens → Generate new token
2. `repo` にチェックを入れて生成
3. トークンをコピーしてVSCodeのパスワード欄に貼り付け

**「.env.local」がコミットに含まれている**
→ `.gitignore` に `.env.local` を追加してください（ステップ3参照）

---

## 📝 まとめ

```
1. GitHubで新しいリポジトリを作成
2. VSCodeで「リポジトリを初期化する」
3. .gitignore を確認
4. すべてのファイルをステージング（+ボタン）
5. 「Initial commit」と入力してコミット
6. GitHubリモートを追加（コマンドパレット）
7. プッシュ（...メニュー）
```

これが完了したら、Vercelデプロイに進めます！
