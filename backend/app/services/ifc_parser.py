import ifcopenshell
import ifcopenshell.geom
import ifcopenshell.util.element
import ifcopenshell.util.unit
from typing import List, Dict, Any, Optional, Tuple
from app.models import Space, Point3D, Geometry3D, BoundingBox
import logging

logger = logging.getLogger(__name__)


class IFCParserService:
    """IFCファイルを解析し、必要な情報を抽出するサービス"""
    
    def __init__(self, ifc_file_path: str):
        """
        Args:
            ifc_file_path: IFCファイルのパス
        """
        self.ifc_file = ifcopenshell.open(ifc_file_path)
        self.length_unit = self._get_length_unit()
        
    def _get_length_unit(self) -> float:
        """長さ単位を取得（メートルへの変換係数を返す）"""
        try:
            units = ifcopenshell.util.unit.get_project_unit(self.ifc_file, "LENGTHUNIT")
            if units:
                return ifcopenshell.util.unit.get_prefix_multiplier(units.Prefix) if hasattr(units, 'Prefix') else 1.0
            return 1.0
        except Exception as e:
            logger.warning(f"単位の取得に失敗: {e}")
            return 1.0
    
    def get_project_info(self) -> Dict[str, Any]:
        """プロジェクト情報を取得"""
        project = self.ifc_file.by_type("IfcProject")
        if not project:
            return {}
        
        project = project[0]
        return {
            "name": getattr(project, "Name", None),
            "description": getattr(project, "Description", None),
            "longName": getattr(project, "LongName", None) if hasattr(project, "LongName") else None,
            "phase": getattr(project, "Phase", None) if hasattr(project, "Phase") else None,
        }
    
    def get_all_spaces(self) -> List[Space]:
        """すべてのスペース（IfcSpace）を取得"""
        ifc_spaces = self.ifc_file.by_type("IfcSpace")
        spaces = []
        
        for ifc_space in ifc_spaces:
            try:
                space = self._parse_space(ifc_space)
                if space:
                    spaces.append(space)
            except Exception as e:
                logger.error(f"スペース {ifc_space.id()} の解析エラー: {e}")
                continue
        
        logger.info(f"合計 {len(spaces)} 個のスペースを抽出しました")
        return spaces
    
    def get_space_by_id(self, space_id: str) -> Optional[Space]:
        """IDでスペースを取得"""
        try:
            ifc_space = self.ifc_file.by_id(int(space_id))
            if ifc_space and ifc_space.is_a("IfcSpace"):
                return self._parse_space(ifc_space)
        except Exception as e:
            logger.error(f"スペース ID {space_id} の取得エラー: {e}")
        return None
    
    def _parse_space(self, ifc_space) -> Optional[Space]:
        """IfcSpaceエンティティをSpaceモデルに変換"""
        try:
            # 基本情報
            space_id = str(ifc_space.id())
            global_id = getattr(ifc_space, "GlobalId", None)
            name = getattr(ifc_space, "Name", f"Space_{space_id}")
            long_name = getattr(ifc_space, "LongName", None)
            description = getattr(ifc_space, "Description", None)
            
            # 数量情報の取得
            area, volume, height = self._get_quantities(ifc_space)
            
            # 位置情報
            location = self._get_location(ifc_space)
            floor_level = self._get_floor_level(ifc_space)
            
            # 用途情報
            usage = self._get_object_type(ifc_space)
            
            # プロパティセットから追加情報を取得
            properties = self._get_property_sets(ifc_space)
            
            # 在室人数（プロパティから取得可能な場合）
            occupancy = properties.get("Occupancy", None)
            if occupancy and isinstance(occupancy, (int, float)):
                occupancy = int(occupancy)
            else:
                occupancy = None
            
            # ジオメトリ情報（簡易版）
            geometry = self._get_simple_geometry(ifc_space)
            
            return Space(
                id=space_id,
                globalId=global_id,
                name=name,
                longName=long_name,
                description=description,
                area=area,
                volume=volume,
                height=height,
                floorLevel=floor_level,
                location=location,
                usage=usage,
                occupancy=occupancy,
                geometry=geometry,
                properties=properties
            )
        except Exception as e:
            logger.error(f"スペース解析エラー: {e}")
            return None
    
    def _get_quantities(self, ifc_space) -> Tuple[Optional[float], Optional[float], Optional[float]]:
        """数量情報（面積、容積、高さ）を取得"""
        area = None
        volume = None
        height = None
        
        try:
            # IfcElementQuantityから取得
            for definition in ifcopenshell.util.element.get_psets(ifc_space).values():
                for key, value in definition.items():
                    if key in ["NetFloorArea", "GrossFloorArea", "Area"]:
                        if area is None and isinstance(value, (int, float)):
                            area = float(value) * self.length_unit * self.length_unit
                    elif key in ["NetVolume", "GrossVolume", "Volume"]:
                        if volume is None and isinstance(value, (int, float)):
                            volume = float(value) * self.length_unit ** 3
                    elif key in ["Height", "FinishCeilingHeight"]:
                        if height is None and isinstance(value, (int, float)):
                            height = float(value) * self.length_unit
            
            # 面積が取得できなかった場合、形状から計算を試みる
            if area is None:
                # 簡易的な面積計算（実装は省略、必要に応じて追加）
                pass
                
        except Exception as e:
            logger.warning(f"数量情報の取得エラー: {e}")
        
        return area, volume, height
    
    def _get_location(self, ifc_space) -> Optional[Point3D]:
        """スペースの位置座標を取得"""
        try:
            if hasattr(ifc_space, "ObjectPlacement") and ifc_space.ObjectPlacement:
                placement = ifc_space.ObjectPlacement
                if hasattr(placement, "RelativePlacement"):
                    rel_placement = placement.RelativePlacement
                    if hasattr(rel_placement, "Location"):
                        coords = rel_placement.Location.Coordinates
                        return Point3D(
                            x=float(coords[0]) * self.length_unit,
                            y=float(coords[1]) * self.length_unit,
                            z=float(coords[2]) * self.length_unit if len(coords) > 2 else 0.0
                        )
        except Exception as e:
            logger.warning(f"位置情報の取得エラー: {e}")
        return None
    
    def _get_floor_level(self, ifc_space) -> Optional[str]:
        """階レベルを取得"""
        try:
            # 建物階層から取得
            if hasattr(ifc_space, "Decomposes"):
                for rel in ifc_space.Decomposes:
                    if rel.is_a("IfcRelAggregates"):
                        relating_object = rel.RelatingObject
                        if relating_object.is_a("IfcBuildingStorey"):
                            return getattr(relating_object, "Name", None)
        except Exception as e:
            logger.warning(f"階レベルの取得エラー: {e}")
        return None
    
    def _get_object_type(self, ifc_space) -> Optional[str]:
        """オブジェクトタイプ（用途）を取得"""
        try:
            object_type = getattr(ifc_space, "ObjectType", None)
            if object_type:
                return object_type
            
            # PredefinedTypeから取得
            if hasattr(ifc_space, "PredefinedType"):
                return str(ifc_space.PredefinedType)
        except Exception as e:
            logger.warning(f"オブジェクトタイプの取得エラー: {e}")
        return None
    
    def _get_property_sets(self, ifc_element) -> Dict[str, Any]:
        """プロパティセットを取得"""
        try:
            psets = ifcopenshell.util.element.get_psets(ifc_element)
            # すべてのプロパティセットを統合
            all_props = {}
            for pset_name, props in psets.items():
                for key, value in props.items():
                    if key not in all_props:
                        all_props[key] = value
            return all_props
        except Exception as e:
            logger.warning(f"プロパティセットの取得エラー: {e}")
            return {}
    
    def _get_simple_geometry(self, ifc_space) -> Optional[Geometry3D]:
        """簡易的なジオメトリ情報を取得（バウンディングボックス）"""
        try:
            settings = ifcopenshell.geom.settings()
            settings.set(settings.USE_WORLD_COORDS, True)
            shape = ifcopenshell.geom.create_shape(settings, ifc_space)

            raw_vertices = getattr(shape.geometry, "verts", None)
            if not raw_vertices or len(raw_vertices) < 3:
                logger.warning(f"スペース {ifc_space.id()} の頂点情報が不足しています")
                return self._create_fallback_geometry(ifc_space)

            vertices: List[List[float]] = []
            min_x = min_y = min_z = float("inf")
            max_x = max_y = max_z = float("-inf")
            scale = self.length_unit

            for i in range(0, len(raw_vertices), 3):
                x = float(raw_vertices[i]) * scale
                y = float(raw_vertices[i + 1]) * scale
                z = float(raw_vertices[i + 2]) * scale
                vertices.append([x, y, z])
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                min_z = min(min_z, z)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
                max_z = max(max_z, z)

            raw_indices = getattr(shape.geometry, "faces", None)
            indices = [int(i) for i in raw_indices] if raw_indices else None

            bounding_box = BoundingBox(
                min=Point3D(x=min_x, y=min_y, z=min_z),
                max=Point3D(x=max_x, y=max_y, z=max_z),
            )

            logger.debug(f"スペース {ifc_space.id()} のジオメトリ取得成功: {len(vertices)} 頂点, {len(indices) if indices else 0} インデックス")
            return Geometry3D(vertices=vertices, indices=indices, boundingBox=bounding_box)
        except Exception as e:
            logger.warning(f"スペース {ifc_space.id()} のジオメトリ取得エラー: {e}")
            return self._create_fallback_geometry(ifc_space)

    def _create_fallback_geometry(self, ifc_space) -> Optional[Geometry3D]:
        """フォールバック用のジオメトリを作成（面積と位置から推定）"""
        try:
            # 面積と高さから推定
            area, volume, height = self._get_quantities(ifc_space)
            location = self._get_location(ifc_space)

            if area and area > 0:
                # 面積から正方形のサイズを推定
                size = (area ** 0.5) / 2  # 半径として使用
                h = height if height and height > 0 else 3.0

                # 中心位置
                cx = location.x if location else 0.0
                cy = location.y if location else 0.0
                cz = location.z if location else 0.0

                # バウンディングボックスを作成
                bounding_box = BoundingBox(
                    min=Point3D(x=cx - size, y=cy - size, z=cz),
                    max=Point3D(x=cx + size, y=cy + size, z=cz + h),
                )

                logger.info(f"スペース {ifc_space.id()} のフォールバックジオメトリを作成: area={area:.2f}, size={size:.2f}")
                return Geometry3D(vertices=[], indices=None, boundingBox=bounding_box)

            logger.warning(f"スペース {ifc_space.id()} のフォールバックジオメトリ作成不可: 面積情報なし")
            return None
        except Exception as e:
            logger.error(f"スペース {ifc_space.id()} のフォールバックジオメトリ作成エラー: {e}")
            return None
    
    def get_statistics(self) -> Dict[str, int]:
        """統計情報を取得"""
        return {
            "spaces": len(self.ifc_file.by_type("IfcSpace")),
            "buildings": len(self.ifc_file.by_type("IfcBuilding")),
            "storeys": len(self.ifc_file.by_type("IfcBuildingStorey")),
            "elements": len(self.ifc_file.by_type("IfcBuildingElement")),
        }
