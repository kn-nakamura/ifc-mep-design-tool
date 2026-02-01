from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.api import ifc, calculations

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# FastAPIアプリケーション作成
app = FastAPI(
    title="IFC MEP Design Tool API",
    description="建築設備設計のためのIFC活用WebアプリケーションAPI",
    version="1.0.0"
)

# CORS設定（フロントエンドからのアクセスを許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # 開発用
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
