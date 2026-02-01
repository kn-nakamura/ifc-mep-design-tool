from fastapi import APIRouter, HTTPException
from typing import List
import logging

from app.models import (
    VentilationCalculationInput,
    VentilationCalculationResult,
    VentilationBatchResult
)
from app.calculators.ventilation import VentilationCalculator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/calculations", tags=["Calculations"])

# IFCストレージへの参照（本来は依存性注入で渡すべき）
from app.api.ifc import ifc_storage


@router.post("/ventilation", response_model=VentilationCalculationResult)
async def calculate_ventilation(calc_input: VentilationCalculationInput, model_id: str = None):
    """
    単一スペースの換気計算を実行
    
    Args:
        calc_input: 計算入力パラメータ
        model_id: IFCモデルID（スペース情報を自動取得する場合）
    """
    try:
        calculator = VentilationCalculator()
        
        # モデルIDが指定されている場合、スペース情報を取得
        space = None
        if model_id and model_id in ifc_storage:
            spaces = ifc_storage[model_id]["spaces"]
            for s in spaces:
                if s.id == calc_input.spaceId:
                    space = s
                    break
        
        # 計算実行
        result = calculator.calculate(calc_input, space)
        
        logger.info(f"換気計算完了: Space={calc_input.spaceId}, 必要換気量={result.requiredVentilation}m³/h")
        
        return result
        
    except Exception as e:
        logger.error(f"換気計算エラー: {e}")
        raise HTTPException(status_code=500, detail=f"計算エラー: {str(e)}")


@router.post("/ventilation/batch", response_model=VentilationBatchResult)
async def calculate_ventilation_batch(
    calc_inputs: List[VentilationCalculationInput],
    model_id: str = None
):
    """
    複数スペースの換気計算を一括実行
    
    Args:
        calc_inputs: 計算入力パラメータのリスト
        model_id: IFCモデルID
    """
    try:
        calculator = VentilationCalculator()
        results = []
        
        # スペース情報の取得（モデルIDがある場合）
        spaces_dict = {}
        if model_id and model_id in ifc_storage:
            spaces = ifc_storage[model_id]["spaces"]
            spaces_dict = {s.id: s for s in spaces}
        
        # 各スペースの計算を実行
        for calc_input in calc_inputs:
            space = spaces_dict.get(calc_input.spaceId)
            result = calculator.calculate(calc_input, space)
            results.append(result)
        
        # サマリー情報の作成
        total_ventilation = sum(r.requiredVentilation for r in results)
        ok_count = sum(1 for r in results if r.complianceStatus == "OK")
        ng_count = sum(1 for r in results if r.complianceStatus == "NG")
        warning_count = sum(1 for r in results if r.complianceStatus == "WARNING")
        
        summary = {
            "totalRequiredVentilation": total_ventilation,
            "okCount": ok_count,
            "ngCount": ng_count,
            "warningCount": warning_count,
            "complianceRate": ok_count / len(results) if results else 0
        }
        
        logger.info(f"一括換気計算完了: {len(results)}スペース, 合計{total_ventilation}m³/h")
        
        return VentilationBatchResult(
            total=len(results),
            results=results,
            summary=summary
        )
        
    except Exception as e:
        logger.error(f"一括換気計算エラー: {e}")
        raise HTTPException(status_code=500, detail=f"計算エラー: {str(e)}")


@router.post("/{model_id}/ventilation/all", response_model=VentilationBatchResult)
async def calculate_all_spaces_ventilation(
    model_id: str,
    method: str = "building_code"
):
    """
    モデル内の全スペースの換気計算を実行
    
    Args:
        model_id: IFCモデルID
        method: 計算方法（building_code, occupancy_based, area_based）
    """
    if model_id not in ifc_storage:
        raise HTTPException(status_code=404, detail="モデルが見つかりません")
    
    try:
        spaces = ifc_storage[model_id]["spaces"]
        
        # 各スペースの計算入力を作成
        from app.models import VentilationMethod
        calc_inputs = [
            VentilationCalculationInput(
                spaceId=space.id,
                method=VentilationMethod(method)
            )
            for space in spaces
        ]
        
        # 一括計算を実行
        return await calculate_ventilation_batch(calc_inputs, model_id)
        
    except Exception as e:
        logger.error(f"全スペース換気計算エラー: {e}")
        raise HTTPException(status_code=500, detail=f"計算エラー: {str(e)}")
