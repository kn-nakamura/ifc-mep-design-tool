from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class IFCUploadResponse(BaseModel):
    """IFCファイルアップロードレスポンス"""
    modelId: str = Field(..., description="モデルID（一意な識別子）")
    filename: str = Field(..., description="ファイル名")
    fileSize: int = Field(..., description="ファイルサイズ (bytes)")
    uploadedAt: datetime = Field(..., description="アップロード日時")
    
    # パース結果のサマリー
    totalSpaces: int = Field(..., description="スペース総数")
    totalEquipment: int = Field(0, description="機器総数")
    
    # メタ情報
    ifcSchema: Optional[str] = Field(None, description="IFCスキーマバージョン")
    projectName: Optional[str] = Field(None, description="プロジェクト名")
    
    # 処理ステータス
    parseStatus: str = Field(..., description="パース状態")
    warnings: list[str] = Field(default_factory=list, description="警告メッセージ")


class IFCModelInfo(BaseModel):
    """IFCモデル情報"""
    modelId: str
    filename: str
    uploadedAt: datetime
    
    # 統計情報
    spaceCount: int = 0
    equipmentCount: int = 0
    buildingElementCount: int = 0
    
    # プロジェクト情報
    projectInfo: Dict[str, Any] = Field(default_factory=dict)
    
    # メタデータ
    metadata: Dict[str, Any] = Field(default_factory=dict)
