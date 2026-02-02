import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useIFCStore } from '@/store/ifcStore';
import { useCalculationStore } from '@/store/calculationStore';

/**
 * 異なる色のセットを生成
 */
function generateColors(count: number): number[] {
  const colors: number[] = [];
  const predefinedColors = [
    0x3498db, // 青
    0xe74c3c, // 赤
    0x2ecc71, // 緑
    0xf39c12, // オレンジ
    0x9b59b6, // 紫
    0x1abc9c, // ターコイズ
    0xe67e22, // キャロット
    0x34495e, // ダークグレー
    0x16a085, // グリーンシー
    0xc0392b, // ポメグラネイト
    0x2980b9, // ベルフラワー
    0x8e44ad, // ウィステリア
  ];

  for (let i = 0; i < count; i++) {
    if (i < predefinedColors.length) {
      colors.push(predefinedColors[i]);
    } else {
      // 追加の色をHSLで生成
      const hue = (i * 137.508) % 360; // ゴールデンアングルで分散
      const saturation = 70;
      const lightness = 50;
      colors.push(hslToHex(hue, saturation, lightness));
    }
  }

  return colors;
}

/**
 * HSLをHEX色に変換
 */
function hslToHex(h: number, s: number, l: number): number {
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = lNorm;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;

    r = hue2rgb(p, q, hNorm + 1 / 3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return parseInt(toHex(r) + toHex(g) + toHex(b), 16);
}

const MODEL_SCALE = 1;
const CAMERA_NEAR = 0.1 * MODEL_SCALE;
const CAMERA_FAR = 1000 * MODEL_SCALE;
const GRID_SIZE = 100 * MODEL_SCALE;
const MIN_DIMENSION = 0.1 * MODEL_SCALE;

export const IFCViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const perspectiveCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orthographicCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const spaceMeshesRef = useRef<THREE.Mesh[]>([]);
  const fitBoundsRef = useRef<{ center: THREE.Vector3; maxDimension: number } | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const is2DModeRef = useRef(false); // クロージャ問題解決用

  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [is2DMode, setIs2DMode] = useState(false);

  const filteredSpaces = useIFCStore((state) => state.filteredSpaces());
  const selectedSpaceIds = useIFCStore((state) => state.selectedSpaceIds);
  const toggleSelectedSpaceId = useIFCStore((state) => state.toggleSelectedSpaceId);
  const setSelectedSpaceIds = useIFCStore((state) => state.setSelectedSpaceIds);
  const colorByProperty = useIFCStore((state) => state.colorByProperty);
  const availablePropertyValues = useIFCStore((state) => state.availablePropertyValues);
  const ventilationResults = useCalculationStore((state) => state.ventilationResults);

  const fitCameraToBounds = (center: THREE.Vector3, maxDimension: number) => {
    if (!perspectiveCameraRef.current || !orthographicCameraRef.current || !controlsRef.current || !containerRef.current) {
      return;
    }

    const perspectiveCamera = perspectiveCameraRef.current;
    const orthographicCamera = orthographicCameraRef.current;
    const controls = controlsRef.current;

    const radius = Math.max(maxDimension / 2, 0.1);
    const fovRadians = (perspectiveCamera.fov * Math.PI) / 180;
    const distance = radius / Math.tan(fovRadians / 2);
    const cameraDistance = distance * 1.4;

    perspectiveCamera.position.set(
      center.x + cameraDistance,
      center.y + cameraDistance,
      center.z + cameraDistance
    );
    perspectiveCamera.lookAt(center);

    orthographicCamera.position.set(center.x, center.y + cameraDistance, center.z);
    orthographicCamera.lookAt(center);

    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const frustumSize = maxDimension * 1.5;
    orthographicCamera.left = (frustumSize * aspect) / -2;
    orthographicCamera.right = (frustumSize * aspect) / 2;
    orthographicCamera.top = frustumSize / 2;
    orthographicCamera.bottom = frustumSize / -2;
    orthographicCamera.updateProjectionMatrix();

    controls.target.copy(center);
    controls.update();
  };

  // シーンの初期化
  useEffect(() => {
    if (!containerRef.current) return;

    // WebGLサポートチェック
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setInitError('WebGLがサポートされていません。ブラウザの設定を確認するか、別のブラウザをお試しください。');
      return;
    }

    try {
      // シーン
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);
      sceneRef.current = scene;

      // パースペクティブカメラ
      const perspectiveCamera = new THREE.PerspectiveCamera(
        75,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        CAMERA_NEAR,
        CAMERA_FAR
      );
      perspectiveCamera.position.set(30 * MODEL_SCALE, 30 * MODEL_SCALE, 30 * MODEL_SCALE);
      perspectiveCameraRef.current = perspectiveCamera;

      // オルソグラフィックカメラ（2Dビュー用）
      const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      const frustumSize = 50 * MODEL_SCALE;
      const orthographicCamera = new THREE.OrthographicCamera(
        (frustumSize * aspect) / -2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        frustumSize / -2,
        CAMERA_NEAR,
        CAMERA_FAR
      );
      orthographicCamera.position.set(0, 100 * MODEL_SCALE, 0);
      orthographicCamera.lookAt(0, 0, 0);
      orthographicCameraRef.current = orthographicCamera;

      // レンダラー
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // コントロール（初期はパースペクティブカメラ）
      const controls = new OrbitControls(perspectiveCamera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controlsRef.current = controls;

      // ライト
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 10);
      scene.add(directionalLight);

      // グリッド
      const gridHelper = new THREE.GridHelper(GRID_SIZE, 100, 0x888888, 0xcccccc);
      scene.add(gridHelper);
      gridHelperRef.current = gridHelper;

      // アニメーションループ（refを使用してis2DModeの最新値を参照）
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        const currentCamera = is2DModeRef.current ? orthographicCamera : perspectiveCamera;
        renderer.render(scene, currentCamera);
      };
      animate();

      // クリックハンドラー
      const handleClick = (event: MouseEvent) => {
        if (!containerRef.current) return;
        const currentCamera = is2DMode ? orthographicCameraRef.current : perspectiveCameraRef.current;
        if (!currentCamera) return;

        const rect = renderer.domElement.getBoundingClientRect();
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycasterRef.current.setFromCamera(mouseRef.current, currentCamera);
        const intersects = raycasterRef.current.intersectObjects(spaceMeshesRef.current);

        if (intersects.length > 0) {
          const clickedMesh = intersects[0].object as THREE.Mesh;
          const spaceId = clickedMesh.userData.spaceId;

          // Ctrl/Cmdキーが押されている場合は複数選択
          if (event.ctrlKey || event.metaKey) {
            toggleSelectedSpaceId(spaceId);
          } else {
            setSelectedSpaceIds([spaceId]);
          }
        } else {
          // 空白をクリックした場合は選択解除
          if (!event.ctrlKey && !event.metaKey) {
            setSelectedSpaceIds([]);
          }
        }
      };

      renderer.domElement.addEventListener('click', handleClick);

      // リサイズハンドラー
      const handleResize = () => {
        if (!containerRef.current || !perspectiveCamera || !orthographicCamera || !renderer) return;

        const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;

        // パースペクティブカメラの更新
        perspectiveCamera.aspect = aspect;
        perspectiveCamera.updateProjectionMatrix();

        // オルソグラフィックカメラの更新
        const frustumSize = fitBoundsRef.current ? fitBoundsRef.current.maxDimension * 1.5 : 50;
        orthographicCamera.left = (frustumSize * aspect) / -2;
        orthographicCamera.right = (frustumSize * aspect) / 2;
        orthographicCamera.top = frustumSize / 2;
        orthographicCamera.bottom = frustumSize / -2;
        orthographicCamera.updateProjectionMatrix();

        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      };

      window.addEventListener('resize', handleResize);

      setIsInitialized(true);
      console.log('IFCViewer: Three.js初期化完了');

      // クリーンアップ
      return () => {
        window.removeEventListener('resize', handleResize);
        renderer.domElement.removeEventListener('click', handleClick);
        if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    } catch (error) {
      console.error('IFCViewer: 初期化エラー', error);
      setInitError(`3Dビューアの初期化に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }, [toggleSelectedSpaceId, setSelectedSpaceIds]);

  // スペースメッシュの作成
  useEffect(() => {
    console.log('IFCViewer: filteredSpacesの更新検知', {
      spacesCount: filteredSpaces.length,
      sceneReady: !!sceneRef.current,
      firstSpace: filteredSpaces[0] ? {
        id: filteredSpaces[0].id,
        name: filteredSpaces[0].name,
        hasGeometry: !!filteredSpaces[0].geometry,
        hasVertices: filteredSpaces[0].geometry?.vertices?.length || 0,
        hasIndices: filteredSpaces[0].geometry?.indices?.length || 0,
        hasBoundingBox: !!filteredSpaces[0].geometry?.boundingBox,
        area: filteredSpaces[0].area,
        height: filteredSpaces[0].height,
        location: filteredSpaces[0].location,
      } : null
    });

    if (!sceneRef.current) {
      console.log('IFCViewer: シーンが未初期化');
      return;
    }

    if (filteredSpaces.length === 0) {
      console.log('IFCViewer: フィルタリング後のスペースが空');
      // 既存のメッシュを削除
      spaceMeshesRef.current.forEach((mesh) => {
        sceneRef.current?.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      });
      spaceMeshesRef.current = [];
      return;
    }

    // 既存のメッシュを削除
    spaceMeshesRef.current.forEach((mesh) => {
      sceneRef.current?.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => mat.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    spaceMeshesRef.current = [];

    const boundsMin = new THREE.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    const boundsMax = new THREE.Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

    const updateBounds = (vertices: THREE.Vector3[]) => {
      vertices.forEach(v => {
        boundsMin.min(v);
        boundsMax.max(v);
      });
    };

    const createBoxMesh = (space: typeof filteredSpaces[number], index: number) => {
      const geometryData = space.geometry?.boundingBox;
      const hasBoundingBox = Boolean(geometryData?.min && geometryData?.max);

      // 面積からサイズを推定（最低5mを確保）
      const fallbackSize = Math.max(Math.sqrt(space.area || 25), 5);
      const scaledFallbackSize = fallbackSize * MODEL_SCALE;

      let width: number, depth: number, height: number;
      let centerX: number, centerY: number, centerZ: number;

      if (hasBoundingBox) {
        // バウンディングボックスからサイズを計算
        width = (Math.abs(geometryData!.max.x - geometryData!.min.x) || fallbackSize) * MODEL_SCALE;
        depth = (Math.abs(geometryData!.max.y - geometryData!.min.y) || fallbackSize) * MODEL_SCALE;
        height = (Math.abs(geometryData!.max.z - geometryData!.min.z) || space.height || 3) * MODEL_SCALE;

        // IFC座標系からThree.js座標系への変換 (x, y, z) -> (x, z, y)
        centerX = ((geometryData!.min.x + geometryData!.max.x) / 2) * MODEL_SCALE;
        centerY = ((geometryData!.min.z + geometryData!.max.z) / 2) * MODEL_SCALE; // IFCのzがThree.jsのy
        centerZ = ((geometryData!.min.y + geometryData!.max.y) / 2) * MODEL_SCALE; // IFCのyがThree.jsのz

        console.log(`IFCViewer: createBoxMesh[${index}] バウンディングボックス使用:`, {
          bbox: geometryData,
          size: { width: width / MODEL_SCALE, depth: depth / MODEL_SCALE, height: height / MODEL_SCALE },
          center: { x: centerX / MODEL_SCALE, y: centerY / MODEL_SCALE, z: centerZ / MODEL_SCALE }
        });
      } else {
        // 位置情報とフォールバックサイズを使用
        width = scaledFallbackSize;
        depth = scaledFallbackSize;
        height = (space.height || 3) * MODEL_SCALE;

        const location = space.location;
        centerX = (location?.x ?? (index * 10)) * MODEL_SCALE; // スペースがない場合は横に並べる
        centerY = ((location?.z ?? 0) * MODEL_SCALE) + height / 2; // IFCのzがThree.jsのy
        centerZ = (location?.y ?? 0) * MODEL_SCALE; // IFCのyがThree.jsのz

        console.log(`IFCViewer: createBoxMesh[${index}] フォールバック使用:`, {
          location: space.location,
          size: { width: width / MODEL_SCALE, depth: depth / MODEL_SCALE, height: height / MODEL_SCALE },
          center: { x: centerX / MODEL_SCALE, y: centerY / MODEL_SCALE, z: centerZ / MODEL_SCALE }
        });
      }

      // 最小サイズを確保
      width = Math.max(width, MIN_DIMENSION);
      depth = Math.max(depth, MIN_DIMENSION);
      height = Math.max(height, MIN_DIMENSION);

      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshPhongMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(centerX, centerY, centerZ);

      // バウンズを更新
      updateBounds([
        new THREE.Vector3(centerX - width / 2, centerY - height / 2, centerZ - depth / 2),
        new THREE.Vector3(centerX + width / 2, centerY + height / 2, centerZ + depth / 2),
      ]);

      return mesh;
    };

    const isPlanarFootprint = (vertices: number[][]) => {
      if (vertices.length < 3) return false;
      let minZ = Number.POSITIVE_INFINITY;
      let maxZ = Number.NEGATIVE_INFINITY;
      vertices.forEach((v) => {
        minZ = Math.min(minZ, v[2]);
        maxZ = Math.max(maxZ, v[2]);
      });
      return Math.abs(maxZ - minZ) < 0.05;
    };

    // スペースごとにメッシュを作成（実際の形状を使用）
    filteredSpaces.forEach((space, index) => {
      let mesh: THREE.Mesh;

      const geometryVertices = space.geometry?.vertices;
      const geometryIndices = space.geometry?.indices;
      const hasBoundingBox = Boolean(space.geometry?.boundingBox);

      console.log(`IFCViewer: スペース[${index}] ${space.name} (ID: ${space.id}) - vertices: ${geometryVertices?.length || 0}, indices: ${geometryIndices?.length || 0}, bbox: ${hasBoundingBox}`);

      if (geometryVertices && geometryVertices.length >= 3 && geometryIndices && geometryIndices.length >= 3) {
        // パターン1: BufferGeometry（インデックス付き完全なメッシュ）
        try {
          // IFC座標系からThree.js座標系への変換 (x, y, z) -> (x, z, y)
          const positions = geometryVertices.flatMap(([x, y, z]) => [x * MODEL_SCALE, z * MODEL_SCALE, y * MODEL_SCALE]);
          const bufferGeometry = new THREE.BufferGeometry();
          bufferGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
          bufferGeometry.setIndex(geometryIndices);
          bufferGeometry.computeVertexNormals();

          const material = new THREE.MeshPhongMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
          });

          mesh = new THREE.Mesh(bufferGeometry, material);

          // バウンディングボックスの更新
          bufferGeometry.computeBoundingBox();
          if (bufferGeometry.boundingBox) {
            updateBounds([
              bufferGeometry.boundingBox.min,
              bufferGeometry.boundingBox.max,
            ]);
          }

          console.log(`IFCViewer: スペース[${index}] BufferGeometry作成成功`, {
            vertexCount: geometryVertices.length,
            indexCount: geometryIndices.length,
            boundingBox: bufferGeometry.boundingBox
          });
        } catch (error) {
          console.error(`IFCViewer: スペース[${index}] BufferGeometry作成エラー:`, error);
          mesh = createBoxMesh(space, index);
        }
      } else if (geometryVertices && geometryVertices.length >= 3 && isPlanarFootprint(geometryVertices)) {
        // パターン2: ExtrudeGeometry（平面フットプリント）
        try {
          // IFC座標系からThree.js座標系に変換 (x, y, z) -> (x, z, y)
          const vertices = geometryVertices.map(v =>
            new THREE.Vector3(v[0] * MODEL_SCALE, v[2] * MODEL_SCALE, v[1] * MODEL_SCALE)
          );

          const height = (space.height || 3) * MODEL_SCALE;

          const shape = new THREE.Shape();
          if (vertices.length > 0) {
            shape.moveTo(vertices[0].x, vertices[0].z);
            for (let i = 1; i < vertices.length; i++) {
              shape.lineTo(vertices[i].x, vertices[i].z);
            }
            shape.closePath();
          }

          const extrudeSettings = {
            depth: height,
            bevelEnabled: false,
          };

          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          const material = new THREE.MeshPhongMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide,
          });

          mesh = new THREE.Mesh(geometry, material);

          const baseY = (space.location?.z ?? 0) * MODEL_SCALE;
          mesh.position.set(0, baseY, 0);
          mesh.rotation.x = -Math.PI / 2;

          updateBounds(vertices);
          console.log(`IFCViewer: スペース[${index}] ExtrudeGeometry作成成功`, {
            vertexCount: geometryVertices.length,
            height
          });
        } catch (error) {
          console.error(`IFCViewer: スペース[${index}] ExtrudeGeometry作成エラー:`, error);
          mesh = createBoxMesh(space, index);
        }
      } else {
        // パターン3: BoxGeometry（フォールバック）
        console.log(`IFCViewer: スペース[${index}] BoxGeometry使用（フォールバック）`, {
          hasGeometry: !!space.geometry,
          hasVertices: geometryVertices?.length || 0,
          hasIndices: geometryIndices?.length || 0,
          hasBoundingBox: !!space.geometry?.boundingBox
        });
        mesh = createBoxMesh(space, index);
      }

      mesh.userData = { spaceId: space.id };

      sceneRef.current?.add(mesh);
      spaceMeshesRef.current.push(mesh);
    });

    console.log('IFCViewer: メッシュ作成完了', {
      total: spaceMeshesRef.current.length,
      filteredSpaces: filteredSpaces.length,
      bounds: { min: boundsMin.toArray(), max: boundsMax.toArray() }
    });

    // カメラ位置を調整
    if (spaceMeshesRef.current.length > 0) {
      const boundsValid =
        isFinite(boundsMin.x) && isFinite(boundsMax.x) &&
        isFinite(boundsMin.y) && isFinite(boundsMax.y) &&
        isFinite(boundsMin.z) && isFinite(boundsMax.z);

      let center: THREE.Vector3;
      let maxDimension: number;

      if (boundsValid) {
        center = boundsMin.clone().add(boundsMax).multiplyScalar(0.5);
        const size = boundsMax.clone().sub(boundsMin);
        maxDimension = Math.max(size.x, size.y, size.z, 10);
      } else {
        center = new THREE.Vector3(0, 0, 0);
        maxDimension = 30;
        console.warn('IFCViewer: バウンズが無効なためデフォルト位置を使用');
      }

      fitBoundsRef.current = { center, maxDimension };
      fitCameraToBounds(center, maxDimension);

      console.log('IFCViewer: カメラ位置調整完了', {
        center: center.toArray(),
        maxDimension
      });

      if (gridHelperRef.current) {
        const targetGridSize = Math.max(maxDimension * 2, 10);
        const gridScale = targetGridSize / GRID_SIZE;
        gridHelperRef.current.scale.set(gridScale, gridScale, gridScale);
      }
    }
  }, [filteredSpaces]);

  // 2D/3D モード切り替え
  useEffect(() => {
    // refを更新（アニメーションループで使用）
    is2DModeRef.current = is2DMode;

    if (!controlsRef.current || !perspectiveCameraRef.current || !orthographicCameraRef.current) return;

    const controls = controlsRef.current;

    if (is2DMode) {
      // 2Dモード: オルソグラフィックカメラに切り替え
      (controls as any).object = orthographicCameraRef.current;
      controls.enableRotate = false; // 回転を無効化
      controls.maxPolarAngle = 0; // 真上のみ
      controls.minPolarAngle = 0;
    } else {
      // 3Dモード: パースペクティブカメラに切り替え
      (controls as any).object = perspectiveCameraRef.current;
      controls.enableRotate = true; // 回転を有効化
      controls.maxPolarAngle = Math.PI; // 制限を解除
      controls.minPolarAngle = 0;
    }

    controls.update();
  }, [is2DMode]);

  const handleFitToView = () => {
    if (!fitBoundsRef.current) return;
    fitCameraToBounds(fitBoundsRef.current.center, fitBoundsRef.current.maxDimension);
  };

  // 選択状態とハイライトの更新
  useEffect(() => {
    // パラメーター値に基づく色のマッピングを作成
    const colorMap = new Map<string, number>();
    if (colorByProperty) {
      const values = availablePropertyValues(colorByProperty);
      const colors = generateColors(values.length);
      values.forEach((value, index) => {
        colorMap.set(value, colors[index]);
      });
    }

    spaceMeshesRef.current.forEach((mesh) => {
      const spaceId = mesh.userData.spaceId;
      const material = mesh.material as THREE.MeshPhongMaterial;

      // 色の優先順位: 選択状態 > パラメーター色分け > 換気計算結果 > デフォルト
      let color = 0x88ccff; // デフォルト色

      // パラメーターに基づく色分け
      if (colorByProperty) {
        const space = filteredSpaces.find(s => s.id === spaceId);
        if (space) {
          const propValue = space.properties[colorByProperty];
          if (propValue !== undefined && propValue !== null) {
            const mappedColor = colorMap.get(String(propValue));
            if (mappedColor !== undefined) {
              color = mappedColor;
            }
          }
        }
      } else {
        // 換気計算結果に基づく色設定
        const result = ventilationResults[spaceId];
        if (result) {
          if (result.complianceStatus === 'OK') {
            color = 0x2ecc71; // 緑
          } else if (result.complianceStatus === 'NG') {
            color = 0xe74c3c; // 赤
          } else if (result.complianceStatus === 'WARNING') {
            color = 0xf39c12; // オレンジ
          }
        }
      }

      // 選択状態（複数選択対応）
      if (selectedSpaceIds.includes(spaceId)) {
        material.color.set(0xffff00); // 黄色
        material.opacity = 0.9;
      } else {
        material.color.set(color);
        material.opacity = 0.7;
      }
    });
  }, [selectedSpaceIds, ventilationResults, colorByProperty, filteredSpaces, availablePropertyValues]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* エラー表示 */}
      {initError && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: '#fee',
              border: '1px solid #e74c3c',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '500px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <div style={{ color: '#c0392b', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
              3Dビューアの初期化に失敗しました
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>{initError}</div>
          </div>
        </div>
      )}

      {/* ローディング表示（初期化中） */}
      {!isInitialized && !initError && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            zIndex: 100,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
            <div style={{ color: '#666' }}>3Dビューアを初期化中...</div>
          </div>
        </div>
      )}

      {/* スペースが空の場合の警告 */}
      {isInitialized && !initError && filteredSpaces.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 193, 7, 0.95)',
            color: '#333',
            padding: '24px',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '400px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            スペースが見つかりません
          </div>
          <div style={{ fontSize: '14px' }}>
            フィルタリング条件に一致するスペースがありません。
            フィルタ設定を確認してください。
          </div>
        </div>
      )}

      {/* 操作ガイド */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          lineHeight: '1.6',
        }}
      >
        <div><strong>操作方法</strong></div>
        {is2DMode ? (
          <>
            <div>ドラッグ: 移動</div>
            <div>ホイール: ズーム</div>
          </>
        ) : (
          <>
            <div>左ドラッグ: 回転</div>
            <div>右ドラッグ: 移動</div>
            <div>ホイール: ズーム</div>
          </>
        )}
        <div>クリック: スペース選択</div>
      </div>

      {/* 2D/3D切り替えボタン */}
      {isInitialized && !initError && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '4px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '4px',
            borderRadius: '6px',
          }}
        >
          <button
            onClick={handleFitToView}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            フィット
          </button>
          <button
            onClick={() => setIs2DMode(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: !is2DMode ? '#3498db' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: !is2DMode ? 'bold' : 'normal',
            }}
          >
            3D
          </button>
          <button
            onClick={() => setIs2DMode(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: is2DMode ? '#3498db' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: is2DMode ? 'bold' : 'normal',
            }}
          >
            2D
          </button>
        </div>
      )}

      {/* スペース数表示 */}
      {filteredSpaces.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            backgroundColor: 'rgba(46, 204, 113, 0.9)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        >
          {filteredSpaces.length} 個のスペースを表示中
          {selectedSpaceIds.length > 0 && ` (${selectedSpaceIds.length}個選択中)`}
        </div>
      )}

      {/* 凡例 */}
      {Object.keys(ventilationResults).length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        >
          <div style={{ marginBottom: '8px' }}><strong>換気計算結果</strong></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: '#2ecc71', borderRadius: '2px' }} />
            <span>OK</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: '#f39c12', borderRadius: '2px' }} />
            <span>警告</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', backgroundColor: '#e74c3c', borderRadius: '2px' }} />
            <span>NG</span>
          </div>
        </div>
      )}
    </div>
  );
};
