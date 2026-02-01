# Python 3.11をベースイメージとして使用
FROM python:3.11-slim

# 環境変数の設定
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# 作業ディレクトリを設定
WORKDIR /app

# システム依存パッケージのインストール
# 軽量化のため最小限の依存関係のみ
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Pythonパッケージのインストール
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY . .

# アップロードディレクトリを作成
RUN mkdir -p /tmp/ifc_uploads

# ポートを公開（デフォルト8000だが、環境変数で上書き可能）
EXPOSE ${PORT}

# ヘルスチェック（環境変数PORTを使用）
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# アプリケーションを起動
# 環境変数PORTを使用、未設定の場合は8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
