from fastapi import APIRouter, UploadFile, File, HTTPException
from datetime import datetime
import uuid
import os
import logging
from typing import Dict

from app.models import IFCUploadResponse, IFCModelInfo, SpaceList, Space
from app.services.ifc_parser import IFCParserService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ifc", tags=["IFC"])

# 一時的なストレージ（実際の実装ではDBやファイルストレージを使用）
ifc_storage: Dict[str, Dict] = {}
UPLOAD_DIR = "/tmp/ifc_uploads"

# アップロードディレクトリを作成
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=IFCUploadResponse)
async def upload_ifc_file(file: UploadFile = File(...)):
    """
    IFCファイルをアップロードして解析
    """
    # ファイル検証
    if not file.filename.lower().endswith('.ifc'):
        raise HTTPException(status_code=400, detail="IFCファイルのみアップロード可能です")
    
    # ユニークなモデルIDを生成
    model_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{model_id}.ifc")
    
    try:
        # ファイル保存
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        file_size = len(content)
        
        # IFCファイルを解析
        parser = IFCParserService(file_path)
        
        # プロジェクト情報を取得
        project_info = parser.get_project_info()
        
        # スペース情報を取得
        spaces = parser.get_all_spaces()
        
        # 統計情報を取得
        stats = parser.get_statistics()
        
        # ストレージに保存
        ifc_storage[model_id] = {
            "file_path": file_path,
            "filename": file.filename,
            "file_size": file_size,
            "uploaded_at": datetime.now(),
            "project_info": project_info,
            "spaces": spaces,
            "stats": stats
        }
        
        # IFCスキーマバージョンの取得
        ifc_schema = parser.ifc_file.wrapped_data.schema
        
        logger.info(f"IFCファイル {file.filename} を解析完了: {len(spaces)} スペース")
        
        return IFCUploadResponse(
            modelId=model_id,
            filename=file.filename,
            fileSize=file_size,
            uploadedAt=datetime.now(),
            totalSpaces=len(spaces),
            totalEquipment=0,  # Phase 1では機器情報は未対応
            ifcSchema=ifc_schema,
            projectName=project_info.get("name"),
            parseStatus="success",
            warnings=[]
        )
        
    except Exception as e:
        logger.error(f"IFCファイルのアップロードエラー: {e}")
        # エラー時はファイルを削除
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"IFCファイルの解析に失敗しました: {str(e)}")


@router.get("/{model_id}/info", response_model=IFCModelInfo)
async def get_ifc_model_info(model_id: str):
    """
    IFCモデルの情報を取得
    """
    if model_id not in ifc_storage:
        raise HTTPException(status_code=404, detail="モデルが見つかりません")
    
    data = ifc_storage[model_id]
    
    return IFCModelInfo(
        modelId=model_id,
        filename=data["filename"],
        uploadedAt=data["uploaded_at"],
        spaceCount=len(data["spaces"]),
        equipmentCount=0,
        buildingElementCount=data["stats"].get("elements", 0),
        projectInfo=data["project_info"],
        metadata=data["stats"]
    )


@router.get("/{model_id}/spaces", response_model=SpaceList)
async def get_spaces(model_id: str):
    """
    モデルのスペース一覧を取得
    """
    if model_id not in ifc_storage:
        raise HTTPException(status_code=404, detail="モデルが見つかりません")
    
    spaces = ifc_storage[model_id]["spaces"]
    
    return SpaceList(
        total=len(spaces),
        spaces=spaces
    )


@router.get("/{model_id}/spaces/{space_id}", response_model=Space)
async def get_space_detail(model_id: str, space_id: str):
    """
    特定のスペースの詳細情報を取得
    """
    if model_id not in ifc_storage:
        raise HTTPException(status_code=404, detail="モデルが見つかりません")
    
    spaces = ifc_storage[model_id]["spaces"]
    
    # スペースを検索
    for space in spaces:
        if space.id == space_id:
            return space
    
    raise HTTPException(status_code=404, detail="スペースが見つかりません")


@router.delete("/{model_id}")
async def delete_ifc_model(model_id: str):
    """
    IFCモデルを削除
    """
    if model_id not in ifc_storage:
        raise HTTPException(status_code=404, detail="モデルが見つかりません")
    
    # ファイルを削除
    file_path = ifc_storage[model_id]["file_path"]
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # ストレージから削除
    del ifc_storage[model_id]
    
    return {"message": "モデルを削除しました", "modelId": model_id}
