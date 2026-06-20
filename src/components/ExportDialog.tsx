import { useState, useMemo } from 'react';
import { X, Download, FileType, FileCode, CheckCircle, AlertCircle } from 'lucide-react';
import { useCastleStore } from '@/store/useCastleStore';
import { ModelExporter } from '@/utils/ModelExporter';
import { CastleGenerator } from '@/utils/CastleGenerator';
import { UVUnwrapper, UVIsland } from '@/utils/UVUnwrapper';
import * as THREE from 'three';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

type ExportFormat = 'glb' | 'gltf' | 'obj';

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const { params } = useCastleStore();
  const [format, setFormat] = useState<ExportFormat>('glb');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const { uvPreviewUrl, islandCount } = useMemo(() => {
    if (!open) return { uvPreviewUrl: '', islandCount: 0 };
    
    const generator = new CastleGenerator(params);
    const result = generator.generateAll();

    const islands: UVIsland[] = [];

    result.walls.forEach((geo, i) => {
      const island = UVUnwrapper.unwrapGeometry(geo, `wall_${i}`);
      islands.push(island);
    });
    result.towers.forEach((geo, i) => {
      const island = UVUnwrapper.unwrapGeometry(geo, `tower_${i}`);
      islands.push(island);
    });
    islands.push(UVUnwrapper.unwrapGeometry(result.gate, 'gate'));
    if (result.moat) {
      islands.push(UVUnwrapper.unwrapGeometry(result.moat, 'moat'));
    }
    result.buildings.forEach((geo, i) => {
      const island = UVUnwrapper.unwrapGeometry(geo, `building_${i}`);
      islands.push(island);
    });

    UVUnwrapper.packIslands(islands, 0.02);

    const geometries = islands.map((island) => island.geometry);
    const canvas = UVUnwrapper.generateUVPreview(geometries, 256);
    
    return {
      uvPreviewUrl: canvas.toDataURL(),
      islandCount: islands.length,
    };
  }, [params, open]);

  const buildExportGroup = (): THREE.Group => {
    const group = new THREE.Group();
    group.name = 'Castle';

    const generator = new CastleGenerator(params);
    const result = generator.generateAll();

    const islands: UVIsland[] = [];

    result.walls.forEach((geo, i) => {
      const island = UVUnwrapper.unwrapGeometry(geo, `wall_${i}`);
      islands.push(island);
    });
    result.towers.forEach((geo, i) => {
      const island = UVUnwrapper.unwrapGeometry(geo, `tower_${i}`);
      islands.push(island);
    });
    islands.push(UVUnwrapper.unwrapGeometry(result.gate, 'gate'));
    if (result.moat) {
      islands.push(UVUnwrapper.unwrapGeometry(result.moat, 'moat'));
    }
    result.buildings.forEach((geo, i) => {
      const island = UVUnwrapper.unwrapGeometry(geo, `building_${i}`);
      islands.push(island);
    });

    UVUnwrapper.packIslands(islands, 0.02);

    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.85,
      metalness: 0.05,
    });

    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.7,
      metalness: 0.1,
    });

    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.8,
    });

    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d5c3d,
      roughness: 1.0,
      metalness: 0.0,
    });

    result.walls.forEach((geo, i) => {
      const mesh = new THREE.Mesh(geo, stoneMaterial);
      mesh.name = `wall_${i}`;
      group.add(mesh);
    });

    result.towers.forEach((geo, i) => {
      const mesh = new THREE.Mesh(geo, stoneMaterial);
      mesh.name = `tower_${i}`;
      group.add(mesh);
    });

    const gateMesh = new THREE.Mesh(result.gate, woodMaterial);
    gateMesh.name = 'gate';
    group.add(gateMesh);

    if (result.moat) {
      const moatMesh = new THREE.Mesh(result.moat, waterMaterial);
      moatMesh.name = 'moat';
      group.add(moatMesh);
    }

    result.buildings.forEach((geo, i) => {
      const mesh = new THREE.Mesh(geo, stoneMaterial);
      mesh.name = `building_${i}`;
      group.add(mesh);
    });

    const groundMesh = new THREE.Mesh(result.ground, groundMaterial);
    groundMesh.name = 'ground';
    group.add(groundMesh);

    return group;
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('idle');
    setErrorMessage('');

    try {
      const exportGroup = buildExportGroup();

      const stats = ModelExporter.getMeshStats(exportGroup);
      console.log('Export stats:', stats);

      const filename = `castle_${params.seed}.${format}`;

      switch (format) {
        case 'glb':
          await ModelExporter.exportGLB(exportGroup, filename);
          break;
        case 'gltf':
          await ModelExporter.exportGLTF(exportGroup, filename);
          break;
        case 'obj': {
          const geos: THREE.BufferGeometry[] = [];
          exportGroup.traverse((child) => {
            if (child instanceof THREE.Mesh && child.geometry) {
              geos.push(child.geometry);
            }
          });
          ModelExporter.exportOBJ(geos, filename);
          break;
        }
      }

      setExportStatus('success');
      setTimeout(() => {
        onClose();
        setExportStatus('idle');
      }, 1500);
    } catch (error) {
      setExportStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  if (!open) return null;

  const formats: { id: ExportFormat; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'glb', label: 'GLB', icon: <FileType className="w-5 h-5" />, desc: '二进制格式，推荐' },
    { id: 'gltf', label: 'glTF', icon: <FileCode className="w-5 h-5" />, desc: 'JSON格式，易编辑' },
    { id: 'obj', label: 'OBJ', icon: <FileCode className="w-5 h-5" />, desc: '通用格式' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-stone-900 border border-amber-900/30 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-900/30 bg-gradient-to-r from-stone-900 to-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600/20 rounded-lg">
              <Download className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-100">导出模型</h2>
              <p className="text-xs text-stone-400">选择导出格式</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-stone-300">导出格式</label>
            <div className="grid grid-cols-3 gap-2">
              {formats.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    format === f.id
                      ? 'border-amber-500 bg-amber-600/10 text-amber-200'
                      : 'border-stone-700 bg-stone-800/50 text-stone-400 hover:border-stone-600'
                  }`}
                >
                  <div className="flex justify-center mb-1">
                    {f.icon}
                  </div>
                  <div className="text-sm font-semibold">{f.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-stone-800/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">种子</span>
              <span className="text-stone-200 font-mono">{params.seed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">塔楼数量</span>
              <span className="text-stone-200">{params.towerCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">建筑数量</span>
              <span className="text-stone-200">{params.buildingCount}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-stone-700/50">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-stone-400">UV布局</span>
                <span className="text-green-400">{islandCount} 个UV岛</span>
              </div>
              <div className="bg-stone-900 rounded-lg overflow-hidden border border-stone-700">
                <img 
                  src={uvPreviewUrl} 
                  alt="UV预览" 
                  className="w-full aspect-square object-contain"
                />
              </div>
            </div>
          </div>

          {exportStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {exportStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700/50 rounded-lg text-green-300 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>导出成功！</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-amber-900/30 bg-stone-800/30">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-stone-700 text-stone-200 hover:bg-stone-600 transition-colors font-medium text-sm"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || exportStatus === 'success'}
            className="flex-1 px-4 py-2.5 rounded-lg bg-amber-600 text-white hover:bg-amber-500 transition-colors font-medium text-sm shadow-lg shadow-amber-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                导出中...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                导出 {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
