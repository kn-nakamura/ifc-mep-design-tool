"""
アプリケーション設定
環境変数から設定を読み込む
"""
import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """アプリケーション設定クラス"""

    # サーバー設定
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS設定（カンマ区切りの文字列）
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    # ログレベル
    log_level: str = "INFO"

    # ファイルアップロード設定
    upload_dir: str = "/tmp/ifc_uploads"
    max_upload_size_mb: int = 100

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    @property
    def cors_origins_list(self) -> list[str]:
        """CORS許可オリジンをリストとして取得"""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    """設定のシングルトンインスタンスを取得"""
    return Settings()
