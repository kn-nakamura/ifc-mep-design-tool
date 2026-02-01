import logging
from typing import Optional, Dict, Any
from app.models import (
    VentilationCalculationInput,
    VentilationCalculationResult,
    VentilationMethod,
    RoomUsageType,
    Space
)

logger = logging.getLogger(__name__)


class VentilationCalculator:
    """換気計算を実行するクラス"""
    
    # 建築基準法に基づく標準換気回数（回/h）
    STANDARD_AIR_CHANGE_RATES = {
        RoomUsageType.OFFICE: 2.0,
        RoomUsageType.RESIDENCE: 0.5,
        RoomUsageType.MEETING_ROOM: 4.0,
        RoomUsageType.CORRIDOR: 1.0,
        RoomUsageType.TOILET: 10.0,
        RoomUsageType.KITCHEN: 10.0,
        RoomUsageType.STORAGE: 0.5,
        RoomUsageType.OTHER: 1.0,
    }
    
    # 一人当たり必要外気量（m³/h/人）
    FRESH_AIR_PER_PERSON = {
        RoomUsageType.OFFICE: 30.0,
        RoomUsageType.RESIDENCE: 25.0,
        RoomUsageType.MEETING_ROOM: 40.0,
        RoomUsageType.OTHER: 30.0,
    }
    
    def calculate(
        self,
        calculation_input: VentilationCalculationInput,
        space: Optional[Space] = None
    ) -> VentilationCalculationResult:
        """
        換気計算を実行
        
        Args:
            calculation_input: 計算入力パラメータ
            space: スペース情報（入力パラメータに不足がある場合に使用）
        
        Returns:
            計算結果
        """
        # スペース情報から不足データを補完
        area = calculation_input.area or (space.area if space else None)
        volume = calculation_input.volume or (space.volume if space else None)
        height = calculation_input.height or (space.height if space else None)
        usage = calculation_input.usage or self._infer_usage(space)
        occupancy = calculation_input.occupancy
        
        # 容積の計算（面積と高さから）
        if volume is None and area is not None and height is not None:
            volume = area * height
        
        # 計算方法に応じた処理
        if calculation_input.method == VentilationMethod.BUILDING_CODE:
            result = self._calculate_by_building_code(
                space_id=calculation_input.spaceId,
                space_name=space.name if space else "Unknown",
                area=area,
                volume=volume,
                usage=usage
            )
        elif calculation_input.method == VentilationMethod.OCCUPANCY_BASED:
            result = self._calculate_by_occupancy(
                space_id=calculation_input.spaceId,
                space_name=space.name if space else "Unknown",
                occupancy=occupancy,
                usage=usage,
                fresh_air_per_person=calculation_input.freshAirPerPerson
            )
        elif calculation_input.method == VentilationMethod.AREA_BASED:
            result = self._calculate_by_area(
                space_id=calculation_input.spaceId,
                space_name=space.name if space else "Unknown",
                area=area,
                air_change_rate=calculation_input.airChangeRate,
                height=height
            )
        else:
            # カスタム計算
            result = self._calculate_custom(
                space_id=calculation_input.spaceId,
                space_name=space.name if space else "Unknown",
                volume=volume,
                air_change_rate=calculation_input.airChangeRate
            )
        
        # 使用したパラメータを記録
        result.usedArea = area
        result.usedVolume = volume
        result.usedOccupancy = occupancy
        result.usedUsage = usage
        
        return result
    
    def _calculate_by_building_code(
        self,
        space_id: str,
        space_name: str,
        area: Optional[float],
        volume: Optional[float],
        usage: Optional[RoomUsageType]
    ) -> VentilationCalculationResult:
        """建築基準法に基づく換気計算"""
        
        if volume is None:
            return VentilationCalculationResult(
                spaceId=space_id,
                spaceName=space_name,
                requiredVentilation=0,
                airChangeRate=0,
                method=VentilationMethod.BUILDING_CODE,
                complianceStatus="NG",
                complianceNotes="容積情報が不足しているため計算できません"
            )
        
        # 用途に応じた標準換気回数を取得
        standard_rate = self.STANDARD_AIR_CHANGE_RATES.get(
            usage or RoomUsageType.OTHER,
            1.0
        )
        
        # 必要換気量 = 容積 × 換気回数
        required_ventilation = volume * standard_rate
        
        return VentilationCalculationResult(
            spaceId=space_id,
            spaceName=space_name,
            requiredVentilation=required_ventilation,
            airChangeRate=standard_rate,
            method=VentilationMethod.BUILDING_CODE,
            standardAirChangeRate=standard_rate,
            complianceStatus="OK",
            appliedStandard="建築基準法",
            calculationDetails={
                "volume": volume,
                "standardRate": standard_rate,
                "calculation": f"{volume} m³ × {standard_rate} 回/h = {required_ventilation} m³/h"
            }
        )
    
    def _calculate_by_occupancy(
        self,
        space_id: str,
        space_name: str,
        occupancy: Optional[int],
        usage: Optional[RoomUsageType],
        fresh_air_per_person: Optional[float]
    ) -> VentilationCalculationResult:
        """在室人数ベースの換気計算"""
        
        if occupancy is None or occupancy <= 0:
            return VentilationCalculationResult(
                spaceId=space_id,
                spaceName=space_name,
                requiredVentilation=0,
                airChangeRate=0,
                method=VentilationMethod.OCCUPANCY_BASED,
                complianceStatus="NG",
                complianceNotes="在室人数情報が不足しているため計算できません"
            )
        
        # 一人当たり外気量を決定
        if fresh_air_per_person is None:
            fresh_air_per_person = self.FRESH_AIR_PER_PERSON.get(
                usage or RoomUsageType.OTHER,
                30.0
            )
        
        # 必要換気量 = 在室人数 × 一人当たり外気量
        required_ventilation = occupancy * fresh_air_per_person
        
        return VentilationCalculationResult(
            spaceId=space_id,
            spaceName=space_name,
            requiredVentilation=required_ventilation,
            airChangeRate=0,  # 人数ベースでは換気回数は直接的には算出しない
            method=VentilationMethod.OCCUPANCY_BASED,
            standardFreshAirPerPerson=fresh_air_per_person,
            complianceStatus="OK",
            appliedStandard="在室人数基準",
            calculationDetails={
                "occupancy": occupancy,
                "freshAirPerPerson": fresh_air_per_person,
                "calculation": f"{occupancy} 人 × {fresh_air_per_person} m³/h/人 = {required_ventilation} m³/h"
            }
        )
    
    def _calculate_by_area(
        self,
        space_id: str,
        space_name: str,
        area: Optional[float],
        air_change_rate: Optional[float],
        height: Optional[float]
    ) -> VentilationCalculationResult:
        """床面積ベースの換気計算"""
        
        if area is None or area <= 0:
            return VentilationCalculationResult(
                spaceId=space_id,
                spaceName=space_name,
                requiredVentilation=0,
                airChangeRate=0,
                method=VentilationMethod.AREA_BASED,
                complianceStatus="NG",
                complianceNotes="面積情報が不足しているため計算できません"
            )
        
        if air_change_rate is None:
            air_change_rate = 1.0
        
        # 高さがあれば容積を計算
        if height is not None:
            volume = area * height
            required_ventilation = volume * air_change_rate
        else:
            # 高さ不明の場合は標準高さ（2.5m）を仮定
            assumed_height = 2.5
            volume = area * assumed_height
            required_ventilation = volume * air_change_rate
        
        return VentilationCalculationResult(
            spaceId=space_id,
            spaceName=space_name,
            requiredVentilation=required_ventilation,
            airChangeRate=air_change_rate,
            method=VentilationMethod.AREA_BASED,
            complianceStatus="OK" if height is not None else "WARNING",
            complianceNotes=None if height is not None else "天井高が不明のため標準値2.5mを使用",
            calculationDetails={
                "area": area,
                "height": height or assumed_height,
                "volume": volume,
                "airChangeRate": air_change_rate,
                "calculation": f"{volume} m³ × {air_change_rate} 回/h = {required_ventilation} m³/h"
            }
        )
    
    def _calculate_custom(
        self,
        space_id: str,
        space_name: str,
        volume: Optional[float],
        air_change_rate: Optional[float]
    ) -> VentilationCalculationResult:
        """カスタム換気計算"""
        
        if volume is None or air_change_rate is None:
            return VentilationCalculationResult(
                spaceId=space_id,
                spaceName=space_name,
                requiredVentilation=0,
                airChangeRate=0,
                method=VentilationMethod.CUSTOM,
                complianceStatus="NG",
                complianceNotes="計算に必要なパラメータが不足しています"
            )
        
        required_ventilation = volume * air_change_rate
        
        return VentilationCalculationResult(
            spaceId=space_id,
            spaceName=space_name,
            requiredVentilation=required_ventilation,
            airChangeRate=air_change_rate,
            method=VentilationMethod.CUSTOM,
            complianceStatus="OK",
            appliedStandard="カスタム",
            calculationDetails={
                "volume": volume,
                "airChangeRate": air_change_rate,
                "calculation": f"{volume} m³ × {air_change_rate} 回/h = {required_ventilation} m³/h"
            }
        )
    
    def _infer_usage(self, space: Optional[Space]) -> Optional[RoomUsageType]:
        """スペース情報から用途を推測"""
        if space is None or space.usage is None:
            return None
        
        usage_lower = space.usage.lower()
        
        # 簡易的なマッピング
        if "office" in usage_lower or "事務" in usage_lower:
            return RoomUsageType.OFFICE
        elif "meeting" in usage_lower or "会議" in usage_lower:
            return RoomUsageType.MEETING_ROOM
        elif "toilet" in usage_lower or "wc" in usage_lower or "トイレ" in usage_lower:
            return RoomUsageType.TOILET
        elif "kitchen" in usage_lower or "厨房" in usage_lower:
            return RoomUsageType.KITCHEN
        elif "corridor" in usage_lower or "廊下" in usage_lower or "hall" in usage_lower:
            return RoomUsageType.CORRIDOR
        elif "storage" in usage_lower or "倉庫" in usage_lower:
            return RoomUsageType.STORAGE
        elif "residence" in usage_lower or "住宅" in usage_lower or "living" in usage_lower:
            return RoomUsageType.RESIDENCE
        
        return RoomUsageType.OTHER
