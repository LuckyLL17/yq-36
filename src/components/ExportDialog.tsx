import { useState, useMemo, useCallback } from 'react';
import { X, Download, FileType, FileCode, CheckCircle, AlertCircle, Box, Layers, Image, HardDrive } from 'lucide-react';
import { useCastleStore } from '@/store/useCastleStore';
import { ModelExporter, ExportFormatType, FileSizeEstimate } from '@/utils/ModelExporter';
import { CastleGenerator } from '@/utils/CastleGenerator';
import { UVUnwrapper, UVIsland } from '@/utils/UVUnwrapper';
import * as THREE from 'three';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FormatOption {
  id: ExportFormatType;
  label: string;
  icon: React.ReactNode;
  desc: string;
  category: 'model' | 'texture';
}

const FORMAT_OPTIONS: FormatOption[] = [
  { id: 'glb', label: 'GLB', icon: <FileType className="w-5 h-5" />, desc: '二进制格式，推荐', category: 'model' },
  { id: 'gltf', label: 'glTF', icon: <FileCode className="w-5 h-5" />, desc: 'JSON格式，易编辑', category: 'model' },
  { id: 'obj', label: 'OBJ', icon: <FileCode className="w-5 h-5" />, desc: '通用3D格式', category: 'model' },
  { id: 'stl', label: 'STL', icon: <Box className="w-5 h-5" />, desc: '3D打印格式', category: 'model' },
  { id: 'fbx', label: 'FBX', icon: <Layers className="w-5 h-5" />, desc: '动画/游戏格式', category: 'model' },
  { id: 'usdz', label: 'USDZ', icon: <Box className="w-5 h-5" />, desc: 'Apple AR格式', category: 'model' },
  { id: 'textures', label: '贴图', icon: <Image className="w-5 h-5" />, desc: '材质贴图PNG', category: 'texture' },
];

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full bg-stone-700/50 rounded-full h-2.5 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}

function formatFileSizeRange(estimate: FileSizeEstimate): string {
  const fmtBytes = (b: number) => {
    if (b < 1024) return `${Math.round(b)} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };
  if (estimate.min === estimate.max) return fmtBytes(estimate.min);
  return `~${fmtBytes((estimate.min + estimate.max) / 2)}`;
}

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const { params } = useCastleStore();
  const [format, setFormat] = useState<ExportFormatType>('glb');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
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

    const canvas = UVUnwrapper.generateUVPreview(islands, 256);

    return {
      uvPreviewUrl: canvas.toDataURL(),
      islandCount: islands.length,
    };
  }, [params, open]);

  const buildExportGroup = useCallback((): THREE.Group => {
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
  }, [params]);

  const fileSizeEstimate = useMemo(() => {
    if (!open) return null;
    const group = buildExportGroup();
    return ModelExporter.estimateFileSize(group, format);
  }, [open, format, buildExportGroup]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('idle');
    setErrorMessage('');

    const onProgress = (progress: number) => {
      setExportProgress(progress);
    };

    try {
      const exportGroup = buildExportGroup();
      const stats = ModelExporter.getMeshStats(exportGroup);
      console.log('Export stats:', stats);

      const filename = `castle_${params.seed}.${format}`;
      const baseFilename = `castle_${params.seed}`;

      switch (format) {
        case 'glb':
          await ModelExporter.exportGLB(exportGroup, filename, onProgress);
          break;
        case 'gltf':
          await ModelExporter.exportGLTF(exportGroup, filename, onProgress);
          break;
        case 'obj': {
          const geos: THREE.BufferGeometry[] = [];
          exportGroup.traverse((child) => {
            if (child instanceof THREE.Mesh && child.geometry) {
              geos.push(child.geometry);
            }
          });
          ModelExporter.exportOBJ(geos, filename, onProgress);
          break;
        }
        case 'stl':
          ModelExporter.exportSTL(exportGroup, filename, onProgress);
          break;
        case 'fbx':
          await ModelExporter.exportFBX(exportGroup, filename, onProgress);
          break;
        case 'usdz':
          await ModelExporter.exportUSDZ(exportGroup, filename, onProgress);
          break;
        case 'textures':
          ModelExporter.exportTextures(exportGroup, baseFilename, onProgress);
          break;
      }

      setExportProgress(100);
      setExportStatus('success');
      setTimeout(() => {
        onClose();
        setExportStatus('idle');
        setExportProgress(0);
      }, 1500);
    } catch (error) {
      setExportStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '导出失败');
      setExportProgress(0);
    } finally {
      setIsExporting(false);
    }
  };

  if (!open) return null;

  const modelFormats = FORMAT_OPTIONS.filter((f) => f.category === 'model');
  const textureFormats = FORMAT_OPTIONS.filter((f) => f.category === 'texture');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-stone-900 border border-amber-900/30 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-900/30 bg-gradient-to-r from-stone-900 to-stone-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600/20 rounded-lg">
              <Download className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-100">导出模型</h2>
              <p className="text-xs text-stone-400">选择导出格式与选项</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="space-y-3">
            <label className="text-sm font-medium text-stone-300">3D模型格式</label>
            <div className="grid grid-cols-3 gap-2">
              {modelFormats.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  disabled={isExporting}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    format === f.id
                      ? 'border-amber-500 bg-amber-600/10 text-amber-200'
                      : 'border-stone-700 bg-stone-800/50 text-stone-400 hover:border-stone-600'
                  } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex justify-center mb-1">{f.icon}</div>
                  <div className="text-sm font-semibold">{f.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-stone-300">材质贴图</label>
            <div className="grid grid-cols-1 gap-2">
              {textureFormats.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  disabled={isExporting}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                    format === f.id
                      ? 'border-amber-500 bg-amber-600/10 text-amber-200'
                      : 'border-stone-700 bg-stone-800/50 text-stone-400 hover:border-stone-600'
                  } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex-shrink-0">{f.icon}</div>
                  <div className="text-left">
                    <div className="text-sm font-semibold">{f.label}</div>
                    <div className="text-[10px] opacity-70">{f.desc}</div>
                  </div>
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
            {fileSizeEstimate && (
              <div className="flex justify-between text-sm pt-1">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5" />
                  预估大小
                </span>
                <span className="text-amber-300 font-medium">{fileSizeEstimate.label}</span>
              </div>
            )}
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

          {isExporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-300">
                  {format === 'textures' ? '正在导出贴图...' : '正在导出模型...'}
                </span>
                <span className="text-amber-400 font-mono">{Math.round(exportProgress)}%</span>
              </div>
              <ProgressBar progress={exportProgress} />
            </div>
          )}

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

        <div className="flex gap-3 px-6 py-4 border-t border-amber-900/30 bg-stone-800/30 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 px-4 py-2.5 rounded-lg bg-stone-700 text-stone-200 hover:bg-stone-600 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                {Math.round(exportProgress)}%
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                导出 {format === 'textures' ? '贴图' : format.toUpperCase()}
                {fileSizeEstimate && (
                  <span className="text-[10px] opacity-70 ml-1">
                    ({formatFileSizeRange(fileSizeEstimate)})
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
