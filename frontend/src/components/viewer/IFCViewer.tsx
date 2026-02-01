import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useIFCStore } from '@/store/ifcStore';
import { useCalculationStore } from '@/store/calculationStore';

export const IFCViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const spaceMeshesRef = useRef<THREE.Mesh[]>([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const spaces = useIFCStore((state) => state.spaces);
  const selectedSpaceId = useIFCStore((state) => state.selectedSpaceId);
  const setSelectedSpaceId = useIFCStore((state) => state.setSelectedSpaceId);
  const ventilationResults = useCalculationStore((state) => state.ventilationResults);

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

      // カメラ
      const camera = new THREE.PerspectiveCamera(
        75,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(30, 30, 30);
      cameraRef.current = camera;

      // レンダラー
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // コントロール
      const controls = new OrbitControls(camera, renderer.domElement);
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
      const gridHelper = new THREE.GridHelper(100, 100, 0x888888, 0xcccccc);
      scene.add(gridHelper);

      // アニメーションループ
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // クリックハンドラー
      const handleClick = (event: MouseEvent) => {
        if (!containerRef.current || !cameraRef.current) return;

        const rect = renderer.domElement.getBoundingClientRect();
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObjects(spaceMeshesRef.current);

        if (intersects.length > 0) {
          const clickedMesh = intersects[0].object as THREE.Mesh;
          const spaceId = clickedMesh.userData.spaceId;
          setSelectedSpaceId(spaceId);
        } else {
          setSelectedSpaceId(null);
        }
      };

      renderer.domElement.addEventListener('click', handleClick);

      // リサイズハンドラー
      const handleResize = () => {
        if (!containerRef.current || !camera || !renderer) return;

        camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        camera.updateProjectionMatrix();
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
  }, [setSelectedSpaceId]);

  // スペースメッシュの作成
  useEffect(() => {
    console.log('IFCViewer: spacesの更新検知', { spacesCount: spaces.length, sceneReady: !!sceneRef.current });

    if (!sceneRef.current) {
      console.log('IFCViewer: シーンが未初期化');
      return;
    }

    if (spaces.length === 0) {
      console.log('IFCViewer: スペースが空');
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

    // スペースごとにメッシュを作成（簡易版）
    spaces.forEach((space, index) => {
      // 簡易的な箱形状
      const width = Math.sqrt(space.area || 25) || 5;
      const height = space.height || 3;
      const depth = Math.sqrt(space.area || 25) || 5;

      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshPhongMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);

      // 配置（グリッド状に並べる）
      const cols = Math.ceil(Math.sqrt(spaces.length));
      const row = Math.floor(index / cols);
      const col = index % cols;
      const spacing = 10;

      mesh.position.set(
        (col - cols / 2) * spacing,
        height / 2,
        (row - Math.ceil(spaces.length / cols) / 2) * spacing
      );

      mesh.userData = { spaceId: space.id };

      sceneRef.current?.add(mesh);
      spaceMeshesRef.current.push(mesh);
    });

    console.log('IFCViewer: メッシュ作成完了', { count: spaceMeshesRef.current.length });

    // カメラ位置を調整
    if (cameraRef.current && controlsRef.current) {
      const cols = Math.ceil(Math.sqrt(spaces.length));
      const size = cols * 10;
      cameraRef.current.position.set(size * 0.8, size * 0.8, size * 0.8);
      controlsRef.current.target.set(0, 0, 0);
    }
  }, [spaces]);

  // 選択状態とハイライトの更新
  useEffect(() => {
    spaceMeshesRef.current.forEach((mesh) => {
      const spaceId = mesh.userData.spaceId;
      const material = mesh.material as THREE.MeshPhongMaterial;
      
      // 計算結果に基づく色設定
      const result = ventilationResults[spaceId];
      let color = 0x88ccff; // デフォルト色
      
      if (result) {
        if (result.complianceStatus === 'OK') {
          color = 0x2ecc71; // 緑
        } else if (result.complianceStatus === 'NG') {
          color = 0xe74c3c; // 赤
        } else if (result.complianceStatus === 'WARNING') {
          color = 0xf39c12; // オレンジ
        }
      }
      
      // 選択状態
      if (spaceId === selectedSpaceId) {
        material.color.set(0xffff00); // 黄色
        material.opacity = 0.9;
      } else {
        material.color.set(color);
        material.opacity = 0.7;
      }
    });
  }, [selectedSpaceId, ventilationResults]);

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
      {isInitialized && !initError && spaces.length === 0 && (
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
            IFCファイル内にIfcSpaceエンティティが含まれていないか、解析に失敗しました。
            別のIFCファイルをお試しください。
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
        <div>左ドラッグ: 回転</div>
        <div>右ドラッグ: 移動</div>
        <div>ホイール: ズーム</div>
        <div>クリック: スペース選択</div>
      </div>

      {/* スペース数表示 */}
      {spaces.length > 0 && (
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
          {spaces.length} 個のスペースを表示中
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
