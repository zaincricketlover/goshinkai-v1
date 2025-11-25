# 📋 VSCode操作手順（今からやること）

## ✅ GitHubリポジトリ作成完了
**リポジトリURL:** `https://github.com/zaincricketlover/goshinkai-v1`

---

## 🔧 次: VSCodeでの操作

### ステップ1: .gitignoreファイルを作成

1. VSCodeで `goshinkai_v1` フォルダを開いている状態で
2. エクスプローラー（左サイドバー）でプロジェクトのルートを右クリック
3. **「新しいファイル」** を選択
4. ファイル名に `.gitignore` と正確に入力（ドットを忘れずに！）
5. 作成した `.gitignore` ファイルに以下を貼り付けて保存:

```
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

---

### ステップ2: ソース管理を開く

1. 左サイドバーの **「ソース管理」アイコン** をクリック（ブランチのアイコン）
2. **「リポジトリを初期化する」** ボタンが見えたらクリック
   - ボタンが見えない場合は、すでに初期化済みなのでステップ3へ

---

### ステップ3: ファイルをステージング

1. 「ソース管理」画面で、**「変更」** セクションを確認
2. **「変更」の横にある「+」ボタン** をクリック
   - → すべてのファイルが「ステージされた変更」に移動します
3. ⚠️ 確認: `.env.local` が含まれていないことを確認
   - もし含まれていたら、その行の「−」ボタンでアンステージ

---

### ステップ4: コミット

1. 上部のテキストボックス（「メッセージ」と書かれている場所）に以下を入力:
   ```
   Initial commit - Goshinkai V1
   ```
2. **「✓ コミット」** ボタンをクリック

---

### ステップ5: リモートリポジトリを追加

1. **Ctrl+Shift+P** （コマンドパレット）を開く
2. 「Git: Add Remote」と入力して選択
3. **Remote name**: `origin` と入力してEnter
4. **Remote URL**: 以下をコピペしてEnter
   ```
   https://github.com/zaincricketlover/goshinkai-v1.git
   ```

---

### ステップ6: プッシュ

1. 「ソース管理」画面の右上 **「...」（三点リーダー）** をクリック
2. **「プッシュ」** を選択
3. 「このブランチのアップストリームがありません」と表示されたら:
   - **「OK」** または **「main」** を選択
4. GitHubの認証画面が表示される場合:
   - ブラウザが開くのでGitHubで認証
   - または、ユーザー名とパスワード（Personal Access Token）を入力

---

## ✅ 完了確認

プッシュが成功したら、ブラウザでGitHubリポジトリを開いて確認します。
ファイルが表示されていれば成功です！🎉

---

## 🚨 困ったら

- 「.env.local が含まれている」 → `.gitignore` を確認
- 「認証エラー」 → GitHub Personal Access Token を使用
- その他のエラー → エラーメッセージをコピーして教えてください

準備ができたら、ステップ1から始めてください！
進捗を教えていただければ、次の指示を出します。
