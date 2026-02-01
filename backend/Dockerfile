# Python 3.11をベースイメージとして使用
FROM python:3.11-slim

# 環境変数の設定
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# 作業ディレクトリを設定
WORKDIR /app

# システム依存パッケージのインストール
# ifcopenshellのビルドに必要な依存関係を追加
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libboost-all-dev \
    && rm -rf /var/lib/apt/lists/*

# Pythonパッケージのインストール
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY . .

# アップロードディレクトリを作成
RUN mkdir -p /tmp/ifc_uploads

# ポートを公開
EXPOSE ${PORT}

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/health')" || exit 1

# アプリケーションを起動
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
