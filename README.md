# Goshinkai V1 (伍心会)

伍心会（Goshinkai）のマッチングプラットフォームアプリケーションです。

## 機能概要

*   **ユーザー認証**: 招待制サインアップ、ログイン
*   **プロフィール管理**: ユーザー情報、ランク、拠点、タグ管理
*   **イベント管理**: イベント作成、参加登録、チェックイン（QRコード/位置情報想定）
*   **メンバー検索**: 興味・関心に基づくメンバーフィルタリング
*   **メッセージング**: リアルタイムチャット機能
*   **管理者機能**: ユーザー管理、イベント管理、ダッシュボード

## 技術スタック

*   **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS
*   **Backend**: Firebase (Authentication, Firestore)
*   **Deployment**: Vercel (推奨)

## ローカル開発環境のセットアップ

1.  **リポジトリのクローン**
    ```bash
    git clone <repository-url>
    cd goshinkai_v1
    ```

2.  **依存関係のインストール**
    ```bash
    npm install
    ```

3.  **環境変数の設定**
    `.env.local` ファイルを作成し、Firebaseの設定情報を記述します。
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```

4.  **開発サーバーの起動**
    ```bash
    npm run dev
    ```
    http://localhost:3000 にアクセスします。

5.  **初期セットアップ**
    http://localhost:3000/setup にアクセスし、招待コードを作成します（開発用）。

## デプロイ手順 (Vercel)

1.  GitHubにコードをプッシュします。
2.  Vercelにログインし、"Add New Project" を選択します。
3.  GitHubリポジトリをインポートします。
4.  **Environment Variables** に、`.env.local` と同じFirebase設定変数を追加します。
5.  "Deploy" をクリックします。

## Firestore セキュリティルール

`firestore.rules` ファイルを参照してください。本番環境にデプロイする際は、Firebaseコンソールでこれらのルールを適用してください。

## 管理者権限の設定

1.  アプリにログインします。
2.  `/admin-setup` ページにアクセスします。
3.  「管理者になる」ボタンをクリックします（`info@sandudm.com` のみ許可）。
4.  `/admin` ダッシュボードにアクセスできるようになります。
