# 🚀 Vercelデプロイ手順（超簡単版）

## 前提条件
- ✅ GitHubアカウントを持っている
- ✅ コードをGitHubにプッシュ済み（まだの場合は先にプッシュしてください）

---

## ステップ1️⃣: Vercelにログイン

1. [Vercel](https://vercel.com/) にアクセス
2. **「Sign Up」** または **「Login」** をクリック
3. **「Continue with GitHub」** を選択
4. GitHubで認証

---

## ステップ2️⃣: 新しいプロジェクトを作成

1. Vercelのダッシュボードで **「Add New...」** → **「Project」** をクリック
2. **「Import Git Repository」** セクションで、GitHubリポジトリを検索
3. `goshinkai_v1` リポジトリを見つけて **「Import」** をクリック

---

## ステップ3️⃣: 環境変数を設定

「Configure Project」画面で:

1. **「Environment Variables」** セクションまでスクロール
2. 以下の変数を**1つずつ追加**:

```
変数名: NEXT_PUBLIC_FIREBASE_API_KEY
値: [あなたの.env.localから]

変数名: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
値: [あなたの.env.localから]

変数名: NEXT_PUBLIC_FIREBASE_PROJECT_ID
値: [あなたの.env.localから]

変数名: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
値: [あなたの.env.localから]

変数名: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
値: [あなたの.env.localから]

変数名: NEXT_PUBLIC_FIREBASE_APP_ID
値: [あなたの.env.localから]
```

💡 **コピペの仕方:**
- VSCodeで `.env.local` を開く
- 各行の `=` の**右側の値だけ**をコピー
- Vercelの「Value」フィールドに貼り付け

---

## ステップ4️⃣: デプロイ開始

1. すべての環境変数を入力したら、下にスクロール
2. **「Deploy」** ボタンをクリック
3. 数分待つ（ビルドログが表示されます）

---

## ステップ5️⃣: デプロイ完了

1. **「Congratulations!」** 画面が表示されたら成功です 🎉
2. **「Visit」** ボタンをクリックして本番URLにアクセス
3. ログインページが表示されればOK！

---

## 🔒 最後の設定: Firebase Authorized Domains

1. Vercelから本番URLをコピー（例: `https://goshinkai-v1.vercel.app`）
2. [Firebase Console](https://console.firebase.google.com/) → プロジェクト選択
3. **「Authentication」** → **「Settings」** → **「Authorized domains」**
4. **「Add domain」** をクリック
5. Vercelのドメイン（`goshinkai-v1.vercel.app`）を追加
6. **「Save」** をクリック

---

## ✅ 完了チェックリスト

- [ ] Vercelにログイン
- [ ] リポジトリをインポート
- [ ] 環境変数を6個すべて設定
- [ ] デプロイボタンをクリック
- [ ] デプロイ完了を確認
- [ ] Firebase Authorized Domainsに本番URLを追加

---

## 💡 困ったときは

**「GitHubリポジトリが見つからない」**
→ まずGitHubにコードをプッシュしてください

**「ビルドエラーが出る」**
→ エラーログをコピーして教えてください

**「ログインできない」**
→ Firebase Authorized Domainsの設定を確認してください
