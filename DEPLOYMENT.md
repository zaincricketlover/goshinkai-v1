# Goshinkai V1 デプロイ手順書

## 📋 デプロイ前チェックリスト

- [ ] GitHubリポジトリにコードをプッシュ
- [ ] Firebaseプロジェクトが作成済み
- [ ] `.env.local` のFirebase設定が正しい

## 🔥 Step 1: Firestore セキュリティルールのデプロイ

### 方法1: Firebaseコンソール（推奨・簡単）

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択
3. 左メニューから **「Firestore Database」** → **「ルール」** タブを選択
4. `firestore.rules` ファイルの内容をコピー&ペースト
5. **「公開」** ボタンをクリック

### 方法2: Firebase CLI（任意）

```bash
# Firebase CLIのインストール（初回のみ）
npm install -g firebase-tools

# Firebaseにログイン
firebase login

# プロジェクトを初期化（初回のみ）
firebase init firestore

# ルールをデプロイ
firebase deploy --only firestore:rules
```

---

## 🚀 Step 2: Vercelへのデプロイ

### 方法1: Vercel Web UI（推奨・簡単）

1. [Vercel](https://vercel.com/) にアクセスしてログイン（GitHubアカウント推奨）
2. **「Add New Project」** をクリック
3. **「Import Git Repository」** でGitHubリポジトリを選択
4. **「Import」** をクリック
5. **「Environment Variables」** セクションで以下を追加:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
   ※ `.env.local` からコピー
6. **「Deploy」** をクリック
7. 数分待つと、デプロイ完了！

### 方法2: Vercel CLI（任意）

```bash
# Vercel CLIのインストール（初回のみ）
npm install -g vercel

# ログイン
vercel login

# デプロイ
vercel

# 本番環境にデプロイ
vercel --prod
```

---

## ✅ Step 3: デプロイ後の確認

1. **Vercelのデプロイ完了画面からURLをクリック**
2. **ログインページが表示されることを確認**
3. **既存のアカウントでログイン**
4. **主要機能のテスト:**
   - [ ] ログイン/ログアウト
   - [ ] プロフィール表示・編集
   - [ ] メンバー一覧
   - [ ] イベント一覧
   - [ ] メッセージ
   - [ ] 管理者ダッシュボード（管理者の場合）

---

## 🔒 セキュリティ設定（重要）

### Firebase Authentication の設定

1. Firebase Console → **Authentication** → **Sign-in method**
2. **「Email/Password」** が有効になっていることを確認
3. **「Authorized domains」** にVercelのドメインを追加:
   - 例: `your-app.vercel.app`

### Firestore のセキュリティルール確認

1. Firebase Console → **Firestore Database** → **ルール**
2. 以下のルールが適用されていることを確認:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       function isAuthenticated() {
         return request.auth != null;
       }
       
       function isAdmin() {
         return get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true;
       }

       match /profiles/{userId} {
         allow read: if isAuthenticated();
         allow create: if isAuthenticated() && request.auth.uid == userId;
         allow update: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
       }

       match /invites/{inviteId} {
         allow read: if true;
         allow update: if isAuthenticated();
       }

       match /events/{eventId} {
         allow read: if isAuthenticated();
         allow create, update, delete: if isAdmin();
       }

       match /threads/{threadId} {
         allow read: if isAuthenticated() && request.auth.uid in resource.data.participantIds;
         allow create: if isAuthenticated();
         allow update: if isAuthenticated() && request.auth.uid in resource.data.participantIds;
         
         match /messages/{messageId} {
           allow read, create: if isAuthenticated() && request.auth.uid in get(/databases/$(database)/documents/threads/$(threadId)).data.participantIds;
         }
       }
     }
   }
   ```

---

## 🐛 トラブルシューティング

### デプロイエラー

**Q: "Build failed" エラーが出る**  
A: Vercelのログを確認し、TypeScriptエラーやlintエラーがないか確認してください。

**Q: "Environment variables not found"**  
A: Vercelの設定画面で環境変数が正しく設定されているか確認してください。

### Firebase接続エラー

**Q: ログインできない**  
A: Firebase Consoleで「Authorized domains」にVercelドメインが追加されているか確認してください。

**Q: Firestoreデータが読めない**  
A: セキュリティルールが正しくデプロイされているか確認してください。

---

## 📞 サポート

問題が発生した場合は、以下を確認してください:
1. Vercelのデプロイログ
2. ブラウザのコンソールログ
3. Firebaseのセキュリティルールログ

---

## 🎉 デプロイ完了！

おめでとうございます！Goshinkai V1が本番環境で稼働しています。

**本番URL:** https://your-app.vercel.app

次のステップ:
- ユーザーに招待コードを配布
- 管理者権限の設定（`/admin-setup`）
- イベントの作成と管理
