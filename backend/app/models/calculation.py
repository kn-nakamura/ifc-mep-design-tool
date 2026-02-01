from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal
from enum import Enum


class VentilationMethod(str, Enum):
    """換気計算方法"""
    BUILDING_CODE = "building_code"  # 建築基準法
    OCCUPANCY_BASED = "occupancy_based"  # 在室人数ベース
    AREA_BASED = "area_based"  # 床面積ベース
    CUSTOM = "custom"  # カスタム


class RoomUsageType(str, Enum):
    """室用途区分"""
    OFFICE = "office"  # 事務所
    RESIDENCE = "residence"  # 住宅
    MEETING_ROOM = "meeting_room"  # 会議室
    CORRIDOR = "corridor"  # 廊下
    TOILET = "toilet"  # トイレ
    KITCHEN = "kitchen"  # 厨房
    STORAGE = "storage"  # 倉庫
    OTHER = "other"  # その他


class VentilationCalculationInput(BaseModel):
    """換気計算の入力パラメータ"""
    spaceId: str = Field(..., description="対象スペースID")
    method: VentilationMethod = Field(
        default=VentilationMethod.BUILDING_CODE,
        description="計算方法"
    )
    
    # 室情報（スペースから自動取得可能だが明示的に指定も可能）
    area: Optional[float] = Field(None, description="床面積 (m²)")
    volume: Optional[float] = Field(None, description="容積 (m³)")
    height: Optional[float] = Field(None, description="天井高 (m)")
    usage: Optional[RoomUsageType] = Field(None, description="用途区分")
    
    # 計算パラメータ
    occupancy: Optional[int] = Field(None, description="在室人数")
    airChangeRate: Optional[float] = Field(None, description="換気回数 (回/h)")
    freshAirPerPerson: Optional[float] = Field(None, description="一人当たり外気量 (m³/h)")
    
    # 建築基準法関連
    useNaturalVentilation: bool = Field(False, description="自然換気を考慮")
    
    # カスタムパラメータ
    customParameters: Dict[str, Any] = Field(default_factory=dict)


class VentilationCalculationResult(BaseModel):
    """換気計算結果"""
    spaceId: str = Field(..., description="対象スペースID")
    spaceName: str = Field(..., description="室名")
    
    # 計算結果
    requiredVentilation: float = Field(..., description="必要換気量 (m³/h)")
    airChangeRate: float = Field(..., description="換気回数 (回/h)")
    
    # 計算条件
    method: VentilationMethod = Field(..., description="使用した計算方法")
    usedArea: Optional[float] = Field(None, description="使用した床面積 (m²)")
    usedVolume: Optional[float] = Field(None, description="使用した容積 (m³)")
    usedOccupancy: Optional[int] = Field(None, description="使用した在室人数")
    usedUsage: Optional[RoomUsageType] = Field(None, description="使用した用途区分")
    
    # 基準値
    standardAirChangeRate: Optional[float] = Field(None, description="基準換気回数")
    standardFreshAirPerPerson: Optional[float] = Field(None, description="基準一人当たり外気量")
    
    # 適合性
    complianceStatus: Literal["OK", "NG", "WARNING"] = Field(..., description="基準適合状況")
    complianceNotes: Optional[str] = Field(None, description="適合性に関する注記")
    
    # 計算詳細
    calculationDetails: Dict[str, Any] = Field(default_factory=dict, description="計算の詳細情報")
    appliedStandard: Optional[str] = Field(None, description="適用基準")


class VentilationBatchResult(BaseModel):
    """複数スペースの換気計算結果"""
    total: int
    results: list[VentilationCalculationResult]
    summary: Dict[str, Any] = Field(default_factory=dict)
