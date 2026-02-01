from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

from app.api import ifc, calculations
from app.config import get_settings

# 設定を取得
settings = get_settings()

# ロギング設定
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# FastAPIアプリケーション作成
app = FastAPI(
    title="IFC MEP Design Tool API",
    description="建築設備設計のためのIFC活用WebアプリケーションAPI",
    version="1.0.0"
)

# CORS設定（環境変数から読み込み）
logger.info(f"CORS許可オリジン: {settings.cors_origins_list}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターを登録
app.include_router(ifc.router)
app.include_router(calculations.router)


@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {
        "message": "IFC MEP Design Tool API",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/docs",
            "openapi": "/openapi.json"
        }
    }


@app.get("/health")
async def health_check():
    """ヘルスチェックエンドポイント"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
