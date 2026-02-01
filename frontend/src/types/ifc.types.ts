export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  min: Point3D;
  max: Point3D;
}

export interface Geometry3D {
  vertices: number[][];
  indices?: number[];
  boundingBox?: BoundingBox;
}

export interface Space {
  id: string;
  globalId?: string;
  name: string;
  longName?: string;
  description?: string;
  area?: number;
  volume?: number;
  height?: number;
  floorLevel?: string;
  location?: Point3D;
  usage?: string;
  occupancy?: number;
  geometry?: Geometry3D;
  relatedEquipmentIds: string[];
  properties: Record<string, any>;
}

export interface SpaceList {
  total: number;
  spaces: Space[];
}

export interface IFCUploadResponse {
  modelId: string;
  filename: string;
  fileSize: number;
  uploadedAt: string;
  totalSpaces: number;
  totalEquipment: number;
  ifcSchema?: string;
  projectName?: string;
  parseStatus: string;
  warnings: string[];
}

export interface IFCModelInfo {
  modelId: string;
  filename: string;
  uploadedAt: string;
  spaceCount: number;
  equipmentCount: number;
  buildingElementCount: number;
  projectInfo: Record<string, any>;
  metadata: Record<string, any>;
}
