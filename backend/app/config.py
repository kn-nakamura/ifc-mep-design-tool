"""
アプリケーション設定
環境変数から設定を読み込む
"""
import os
from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """アプリケーション設定クラス"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # サーバー設定
    host: str = Field(default="0.0.0.0", validation_alias="HOST")
    port: int = Field(default=8000, validation_alias="PORT")

    # CORS設定（カンマ区切りの文字列）
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:5173",
        validation_alias="CORS_ORIGINS"
    )

    # ログレベル
    log_level: str = Field(default="INFO", validation_alias="LOG_LEVEL")

    # ファイルアップロード設定
    upload_dir: str = Field(default="/tmp/ifc_uploads", validation_alias="UPLOAD_DIR")
    max_upload_size_mb: int = Field(default=100, validation_alias="MAX_UPLOAD_SIZE_MB")

    @property
    def cors_origins_list(self) -> list[str]:
        """CORS許可オリジンをリストとして取得"""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    """設定のシングルトンインスタンスを取得"""
    return Settings()
