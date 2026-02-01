# IFC MEP Design Tool

建築設備設計のためのIFC活用Webアプリケーション

## 概要

このアプリケーションは、IFC（Industry Foundation Classes）ファイルから建築スペース情報を抽出し、設備設計に必要な計算を行うツールです。

### Phase 1 機能（実装済み）

- ✅ IFCファイルのアップロード
- ✅ スペース（室）情報の抽出と表示
- ✅ 3Dビューアによる視覚化
- ✅ 換気計算機能
  - 建築基準法ベース
  - 床面積ベース
  - 在室人数ベース

## セットアップ

### 必要要件

- Python 3.9+
- Node.js 18+
- npm or yarn

### バックエンドのセットアップ

```bash
cd backend

# 仮想環境を作成（推奨）
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存パッケージをインストール
pip install -r requirements.txt

# サーバーを起動
python -m app.main
# または
uvicorn app.main:app --reload
```

バックエンドは `http://localhost:8000` で起動します。

APIドキュメントは `http://localhost:8000/docs` で確認できます。

### フロントエンドのセットアップ

```bash
cd frontend

# 依存パッケージをインストール
npm install

# 開発サーバーを起動
npm run dev
```

フロントエンドは `http://localhost:3000` で起動します。

## 使い方

1. アプリケーションを開く（`http://localhost:3000`）
2. 左側のサイドバーからIFCファイルをアップロード
3. スペース一覧からスペースを選択
4. 「換気計算」タブで計算を実行
5. 3Dビューアで結果を視覚的に確認

## 技術スタック

### バックエンド

- FastAPI - Webフレームワーク
- ifcopenshell - IFC解析ライブラリ
- Pydantic - データバリデーション

### フロントエンド

- React 18 - UIフレームワーク
- TypeScript - 型安全性
- Three.js - 3D表示
- Zustand - 状態管理
- Vite - ビルドツール

## プロジェクト構成

```
ifc-mep-design-tool/
├── backend/              # Pythonバックエンド
│   ├── app/
│   │   ├── api/         # APIエンドポイント
│   │   ├── calculators/ # 計算ロジック
│   │   ├── models/      # データモデル
│   │   ├── services/    # ビジネスロジック
│   │   └── main.py      # エントリーポイント
│   └── requirements.txt
│
└── frontend/            # React フロントエンド
    ├── src/
    │   ├── components/  # UIコンポーネント
    │   ├── services/    # API通信
    │   ├── store/       # 状態管理
    │   └── types/       # TypeScript型定義
    └── package.json
```

## デプロイ

### フロントエンド（Vercel）

1. [Vercel](https://vercel.com)にログイン
2. GitHubリポジトリをインポート
3. プロジェクト設定：
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - ※ `vercel.json`が自動的に検出されます
4. 環境変数を設定：
   - `VITE_API_URL`: バックエンドのURL（例: `https://your-api.railway.app`）
5. デプロイ完了後、生成されたURLを確認

### バックエンド（Railway - 推奨）

1. [Railway](https://railway.app)にログイン
2. 「New Project」→「Deploy from GitHub repo」
3. リポジトリを選択
4. 設定：
   - **Root Directory**: `backend`
   - **Builder**: Dockerfile（自動検出）
   - ※ `railway.toml`が自動的に検出されます
5. 環境変数を設定：
   - `PORT`: `8000`（必須）
   - `CORS_ORIGINS`: VercelのURL（例: `https://your-app.vercel.app`）
   - `LOG_LEVEL`: `INFO`（オプション）
6. デプロイ完了後、生成されたURLをVercelの`VITE_API_URL`に設定

### バックエンド（Render - 代替）

1. [Render](https://render.com)にログイン
2. 「New」→「Web Service」
3. GitHubリポジトリを接続
4. 設定：
   - **Root Directory**: `backend`
   - **Runtime**: Docker
   - **Region**: Singapore（日本に近い）
   - ※ `render.yaml`が自動的に検出されます
5. 環境変数を設定：
   - `PORT`: `8000`（必須）
   - `CORS_ORIGINS`: VercelのURL（例: `https://your-app.vercel.app`）
   - `LOG_LEVEL`: `INFO`（オプション）
6. デプロイ完了後、生成されたURLをVercelの`VITE_API_URL`に設定

### デプロイ後の設定

1. バックエンドのURLを確認（例: `https://ifc-mep-api.railway.app`）
2. Vercelで環境変数 `VITE_API_URL` を更新
3. フロントエンドを再デプロイ
4. 動作確認

### ローカルDocker起動

```bash
cd backend
docker build -t ifc-mep-backend .
docker run -p 8000:8000 -e CORS_ORIGINS="http://localhost:3000" ifc-mep-backend
```

## 今後の拡張予定（Phase 2以降）

- [ ] 機器情報の抽出と表示
- [ ] 機器重量の集計
- [ ] 部材の積算機能
- [ ] 負荷計算
- [ ] 干渉チェック
- [ ] レポート生成・エクスポート
- [ ] ユーザー認証
- [ ] プロジェクト保存機能

## ライセンス

MIT License

## 開発者向け情報

### APIエンドポイント

- `POST /api/ifc/upload` - IFCファイルアップロード
- `GET /api/ifc/{model_id}/spaces` - スペース一覧取得
- `POST /api/calculations/ventilation` - 換気計算実行
- 詳細は `/docs` を参照

### 開発時の注意点

- バックエンドとフロントエンドは別々のポートで起動します
- CORSは開発用に設定済みです
- IFCファイルは `/tmp/ifc_uploads` に保存されます（本番環境では要変更）
