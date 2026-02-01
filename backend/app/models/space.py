from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class Point3D(BaseModel):
    """3D座標点"""
    x: float
    y: float
    z: float


class BoundingBox(BaseModel):
    """バウンディングボックス"""
    min: Point3D
    max: Point3D


class Geometry3D(BaseModel):
    """3Dジオメトリ情報（簡易版）"""
    vertices: List[List[float]]  # [[x,y,z], [x,y,z], ...]
    indices: Optional[List[int]] = None
    boundingBox: Optional[BoundingBox] = None


class Space(BaseModel):
    """スペース（室）情報"""
    id: str = Field(..., description="IFCエンティティID")
    globalId: Optional[str] = Field(None, description="グローバルユニークID")
    name: str = Field(..., description="室名")
    longName: Optional[str] = Field(None, description="詳細名称")
    description: Optional[str] = Field(None, description="説明")
    
    # 幾何情報
    area: Optional[float] = Field(None, description="床面積 (m²)")
    volume: Optional[float] = Field(None, description="容積 (m³)")
    height: Optional[float] = Field(None, description="天井高 (m)")
    
    # 位置情報
    floorLevel: Optional[str] = Field(None, description="階レベル")
    location: Optional[Point3D] = Field(None, description="中心座標")
    
    # 用途・機能
    usage: Optional[str] = Field(None, description="用途区分")
    occupancy: Optional[int] = Field(None, description="想定在室人数")
    
    # ジオメトリ
    geometry: Optional[Geometry3D] = Field(None, description="3D形状データ")
    
    # 関連情報
    relatedEquipmentIds: List[str] = Field(default_factory=list, description="関連機器ID一覧")
    properties: Dict[str, Any] = Field(default_factory=dict, description="その他プロパティ")


class SpaceList(BaseModel):
    """スペース一覧レスポンス"""
    total: int
    spaces: List[Space]


class SpaceSummary(BaseModel):
    """スペース概要（リスト表示用）"""
    id: str
    name: str
    area: Optional[float] = None
    floorLevel: Optional[str] = None
    usage: Optional[str] = None
