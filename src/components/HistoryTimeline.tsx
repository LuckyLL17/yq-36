import { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, X, ChevronLeft, ChevronRight, Info, Building2, Castle, Shield, Lightbulb } from 'lucide-react';
import { HISTORICAL_ERAS, HistoricalEra, getEraByYear } from '@/data/historicalEras';
import { useCastleStore } from '@/store/useCastleStore';

const YEAR_MIN = 800;
const YEAR_MAX = 1499;

const TOWER_SHAPE_LABEL: Record<string, string> = {
  square: '方形塔楼',
  round: '圆形塔楼',
  polygonal: '多边形塔楼',
  d_shaped: 'D形塔楼',
};

const CRENELLATION_LABEL: Record<string, string> = {
  simple: '简易城垛',
  decorated: '装饰城垛',
  machicolated: '投石器口',
  cross_shaped: '十字形城垛',
};

export function HistoryTimeline() {
  const { params, applyEraStyle, selectedEraId, setSelectedEraId } = useCastleStore();
  const [currentYear, setCurrentYear] = useState(params.eraYear);
  const [showPopup, setShowPopup] = useState(false);
  const [popupEra, setPopupEra] = useState<HistoricalEra | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    setCurrentYear(params.eraYear);
  }, [params.eraYear]);

  useEffect(() => {
    if (selectedEraId) {
      const era = HISTORICAL_ERAS.find((e) => e.id === selectedEraId);
      if (era) {
        setPopupEra(era);
        setShowPopup(true);
      }
    }
  }, [selectedEraId]);

  const handleSliderChange = useCallback((year: number) => {
    const clampedYear = Math.max(YEAR_MIN, Math.min(YEAR_MAX, year));
    setCurrentYear(clampedYear);
    applyEraStyle(clampedYear);
  }, [applyEraStyle]);

  const handleMouseMove = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!isDragging.current || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const year = Math.round(YEAR_MIN + percent * (YEAR_MAX - YEAR_MIN));
    handleSliderChange(year);
  }, [handleSliderChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    handleMouseMove(e);
  };

  useEffect(() => {
    const handleUp = () => {
      isDragging.current = false;
    };
    const handleMove = (e: MouseEvent) => handleMouseMove(e);

    window.addEventListener('mouseup', handleUp);
    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('mousemove', handleMove);
    };
  }, [handleMouseMove]);

  const handleEraClick = (era: HistoricalEra) => {
    setPopupEra(era);
    setShowPopup(true);
    setSelectedEraId(era.id);
  };

  const handleJumpEra = (era: HistoricalEra) => {
    const midYear = Math.round((era.yearStart + era.yearEnd) / 2);
    handleSliderChange(midYear);
    setPopupEra(era);
    setShowPopup(true);
    setSelectedEraId(era.id);
  };

  const handlePrevCentury = () => {
    const century = Math.floor(currentYear / 100) + 1;
    const prevCentury = Math.max(9, century - 1);
    const midYear = prevCentury * 100 - 50;
    handleSliderChange(midYear);
  };

  const handleNextCentury = () => {
    const century = Math.floor(currentYear / 100) + 1;
    const nextCentury = Math.min(15, century + 1);
    const midYear = nextCentury * 100 - 50;
    handleSliderChange(midYear);
  };

  const currentEra = getEraByYear(currentYear);
  const sliderPercent = ((currentYear - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 100;

  const formatYear = (year: number) => {
    if (year < 1000) return `${year}年 (${Math.floor(year / 100) + 1}世纪)`;
    return `${year}年 (${Math.floor(year / 100) + 1}世纪)`;
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedEraId(null);
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-3xl">
      <div className="bg-stone-900/95 backdrop-blur-md rounded-xl border border-amber-900/40 shadow-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-amber-600/20 rounded-lg">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-amber-100">城堡历史时间线</h2>
            <p className="text-xs text-stone-400">拖动滑块或点击节点浏览公元9-15世纪建筑演变</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevCentury}
              className="p-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-stone-300 transition-colors"
              title="上一世纪"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextCentury}
              className="p-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-stone-300 transition-colors"
              title="下一世纪"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-center mb-2">
          <span className="text-2xl font-bold text-amber-500 font-mono">{formatYear(currentYear)}</span>
        </div>

        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-900/30 rounded-full">
            <span className="text-xs text-amber-300 font-medium">{currentEra.name}</span>
            <span className="text-xs text-stone-400">·</span>
            <span className="text-xs text-stone-300">{currentEra.description.title}</span>
          </div>
        </div>

        <div className="relative mb-2">
          <div
            ref={sliderRef}
            className="relative h-10 cursor-pointer select-none"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-2 bg-stone-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-800 via-amber-600 to-amber-500 rounded-full"
                style={{ width: `${sliderPercent}%` }}
              />
            </div>

            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-amber-500 rounded-full border-2 border-stone-900 shadow-lg shadow-amber-500/50 cursor-grab active:cursor-grabbing transition-transform hover:scale-110 z-10"
              style={{ left: `${sliderPercent}%` }}
            >
              <div className="absolute inset-1 rounded-full bg-amber-300/50" />
            </div>

            {HISTORICAL_ERAS.map((era) => {
              const eraMidYear = (era.yearStart + era.yearEnd) / 2;
              const eraPercent = ((eraMidYear - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 100;
              const isActive = currentEra.id === era.id;
              const isSelected = selectedEraId === era.id;
              return (
                <button
                  key={era.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEraClick(era);
                  }}
                  onDoubleClick={() => handleJumpEra(era)}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full transition-all z-5 ${
                    isActive || isSelected
                      ? 'bg-amber-400 ring-2 ring-amber-300 ring-offset-1 ring-offset-stone-900 scale-125'
                      : 'bg-stone-600 hover:bg-stone-500 hover:scale-110'
                  }`}
                  style={{ left: `${eraPercent}%` }}
                  title={`${era.name} - ${era.description.title} (点击查看详情，双击跳转)`}
                />
              );
            })}
          </div>

          <div className="flex justify-between mt-1 px-1">
            {HISTORICAL_ERAS.map((era) => (
              <button
                key={era.id}
                onClick={() => handleJumpEra(era)}
                className={`text-[10px] font-mono transition-colors ${
                  currentEra.id === era.id
                    ? 'text-amber-400 font-bold'
                    : 'text-stone-500 hover:text-stone-300'
                }`}
              >
                {era.centuryStart}th
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-stone-400 mt-3 pt-3 border-t border-stone-700/50">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            <span>城墙: {(params.wallThickness).toFixed(1)}m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Castle className="w-3.5 h-3.5 text-amber-600" />
            <span>{TOWER_SHAPE_LABEL[params.towerShape]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>{CRENELLATION_LABEL[params.crenellationStyle]}</span>
          </div>
          {params.hasMoat && (
            <div className="flex items-center gap-1.5">
              <span className="text-blue-400">💧</span>
              <span>护城河</span>
            </div>
          )}
        </div>
      </div>

      {showPopup && popupEra && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={closePopup}
        >
          <div
            className="bg-stone-900 rounded-2xl border border-amber-900/50 shadow-2xl max-w-lg w-[90%] max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-amber-900/50 to-stone-800 p-5 border-b border-amber-900/30">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-amber-600/30 rounded text-xs text-amber-300 font-mono">
                      {popupEra.name}
                    </span>
                    <span className="text-xs text-stone-400">
                      {popupEra.yearStart} - {popupEra.yearEnd}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-amber-100">
                    {popupEra.description.title}
                  </h3>
                </div>
                <button
                  onClick={closePopup}
                  className="p-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-stone-400 hover:text-stone-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto max-h-[55vh] space-y-4">
              <div>
                <p className="text-sm text-stone-300 leading-relaxed">
                  {popupEra.description.overview}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 bg-stone-800/50 rounded-lg border border-stone-700/50">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-200">城墙特点</span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {popupEra.description.walls}
                  </p>
                </div>

                <div className="p-3 bg-stone-800/50 rounded-lg border border-stone-700/50">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Castle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-200">塔楼样式</span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {popupEra.description.towers}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-stone-500">典型形状:</span>
                    <span className="px-2 py-0.5 bg-amber-900/40 rounded text-[10px] text-amber-300">
                      {TOWER_SHAPE_LABEL[popupEra.style.towerShape]}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-stone-800/50 rounded-lg border border-stone-700/50">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Shield className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-200">城垛设计</span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {popupEra.description.crenellations}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-stone-500">典型样式:</span>
                    <span className="px-2 py-0.5 bg-amber-900/40 rounded text-[10px] text-amber-300">
                      {CRENELLATION_LABEL[popupEra.style.crenellationStyle]}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-200">建筑创新</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popupEra.description.innovations.map((innovation, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-gradient-to-r from-amber-900/40 to-amber-800/20 border border-amber-700/30 rounded-full text-xs text-amber-200"
                    >
                      {innovation}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-stone-900 border-t border-stone-700/50 flex gap-2">
              <button
                onClick={() => handleJumpEra(popupEra)}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-lg text-sm font-semibold text-white transition-all shadow-lg shadow-amber-900/30"
              >
                跳转到此时期
              </button>
              <button
                onClick={closePopup}
                className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-sm font-medium text-stone-300 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center mt-2">
        <button
          onClick={() => {
            setPopupEra(currentEra);
            setShowPopup(true);
            setSelectedEraId(currentEra.id);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900/80 hover:bg-stone-800/80 rounded-full text-xs text-stone-400 hover:text-stone-200 transition-colors border border-stone-700/50"
        >
          <Info className="w-3.5 h-3.5" />
          <span>查看当前时期详情</span>
        </button>
      </div>
    </div>
  );
}
