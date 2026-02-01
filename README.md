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
