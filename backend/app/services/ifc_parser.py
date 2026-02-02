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
            # calculate_unit_scale returns the factor to convert from IFC units to SI units (meters)
            # This properly handles all unit types including MILLIMETRE, FOOT, INCH, etc.
            scale = ifcopenshell.util.unit.calculate_unit_scale(self.ifc_file)
            if scale and scale > 0:
                logger.info(f"IFC単位スケール: {scale} (IFC単位 → メートル)")
                return scale
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

            # 一部の環境でifcopenshell.geomが使えない場合があるため、try-except
            try:
                shape = ifcopenshell.geom.create_shape(settings, ifc_space)
            except Exception as geom_error:
                logger.warning(f"スペース {ifc_space.id()} のジオメトリ作成失敗 (ifcopenshell.geom): {geom_error}")
                return self._create_fallback_geometry(ifc_space)

            raw_vertices = getattr(shape.geometry, "verts", None)
            if not raw_vertices or len(raw_vertices) < 9:  # 最低3頂点（9座標）必要
                logger.warning(f"スペース {ifc_space.id()} の頂点情報が不足しています (頂点数: {len(raw_vertices) if raw_vertices else 0})")
                return self._create_fallback_geometry(ifc_space)

            vertices: List[List[float]] = []
            min_x = min_y = min_z = float("inf")
            max_x = max_y = max_z = float("-inf")
            # Note: ifcopenshell.geom.create_shape() already returns coordinates in SI units (meters)
            # so we do NOT apply self.length_unit here (that would double-convert mm files)

            for i in range(0, len(raw_vertices), 3):
                x = float(raw_vertices[i])
                y = float(raw_vertices[i + 1])
                z = float(raw_vertices[i + 2])
                vertices.append([x, y, z])
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                min_z = min(min_z, z)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
                max_z = max(max_z, z)

            raw_indices = getattr(shape.geometry, "faces", None)
            indices = [int(i) for i in raw_indices] if raw_indices and len(raw_indices) >= 3 else None

            # インデックスの検証
            if indices:
                max_index = max(indices)
                if max_index >= len(vertices):
                    logger.warning(f"スペース {ifc_space.id()} のインデックスが頂点数を超えています (max_index: {max_index}, vertices: {len(vertices)})")
                    indices = None

            bounding_box = BoundingBox(
                min=Point3D(x=min_x, y=min_y, z=min_z),
                max=Point3D(x=max_x, y=max_y, z=max_z),
            )

            logger.info(f"スペース {ifc_space.id()} のジオメトリ取得成功 (SI単位): {len(vertices)} 頂点, {len(indices) if indices else 0} インデックス, bbox: ({min_x:.2f},{min_y:.2f},{min_z:.2f})-({max_x:.2f},{max_y:.2f},{max_z:.2f}) [m]")
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

            # デフォルト値を設定
            if not area or area <= 0:
                area = 25.0  # デフォルト5m x 5m
            h = height if height and height > 0 else 3.0

            # 面積から正方形のサイズを推定
            half_size = (area ** 0.5) / 2

            # 中心位置
            cx = location.x if location else 0.0
            cy = location.y if location else 0.0
            cz = location.z if location else 0.0

            # 8頂点の直方体を作成（BoxGeometry用）
            min_x = cx - half_size
            max_x = cx + half_size
            min_y = cy - half_size
            max_y = cy + half_size
            min_z = cz
            max_z = cz + h

            # 頂点リスト（直方体の8頂点）
            vertices = [
                [min_x, min_y, min_z],  # 0: 下面左前
                [max_x, min_y, min_z],  # 1: 下面右前
                [max_x, max_y, min_z],  # 2: 下面右奥
                [min_x, max_y, min_z],  # 3: 下面左奥
                [min_x, min_y, max_z],  # 4: 上面左前
                [max_x, min_y, max_z],  # 5: 上面右前
                [max_x, max_y, max_z],  # 6: 上面右奥
                [min_x, max_y, max_z],  # 7: 上面左奥
            ]

            # インデックス（12個の三角形 = 6面 x 2三角形）
            indices = [
                # 下面
                0, 1, 2, 0, 2, 3,
                # 上面
                4, 6, 5, 4, 7, 6,
                # 前面
                0, 5, 1, 0, 4, 5,
                # 奥面
                2, 7, 3, 2, 6, 7,
                # 左面
                0, 7, 4, 0, 3, 7,
                # 右面
                1, 6, 2, 1, 5, 6,
            ]

            # バウンディングボックスを作成
            bounding_box = BoundingBox(
                min=Point3D(x=min_x, y=min_y, z=min_z),
                max=Point3D(x=max_x, y=max_y, z=max_z),
            )

            logger.info(f"スペース {ifc_space.id()} のフォールバックジオメトリを作成: area={area:.2f}, half_size={half_size:.2f}, height={h:.2f}, center=({cx:.2f},{cy:.2f},{cz:.2f})")
            return Geometry3D(vertices=vertices, indices=indices, boundingBox=bounding_box)

        except Exception as e:
            logger.error(f"スペース {ifc_space.id()} のフォールバックジオメトリ作成エラー: {e}")
            # 最終フォールバック: 最小限のバウンディングボックスだけを返す
            try:
                bounding_box = BoundingBox(
                    min=Point3D(x=0, y=0, z=0),
                    max=Point3D(x=5, y=5, z=3),
                )
                return Geometry3D(vertices=[], indices=None, boundingBox=bounding_box)
            except:
                return None
    
    def get_statistics(self) -> Dict[str, int]:
        """統計情報を取得"""
        return {
            "spaces": len(self.ifc_file.by_type("IfcSpace")),
            "buildings": len(self.ifc_file.by_type("IfcBuilding")),
            "storeys": len(self.ifc_file.by_type("IfcBuildingStorey")),
            "elements": len(self.ifc_file.by_type("IfcBuildingElement")),
        }
