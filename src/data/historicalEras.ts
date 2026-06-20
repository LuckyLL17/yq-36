export type TowerShape = 'square' | 'round' | 'polygonal' | 'd_shaped';
export type CrenellationStyle = 'simple' | 'decorated' | 'machicolated' | 'cross_shaped';

export interface CastleEraStyle {
  wallThicknessMultiplier: number;
  wallHeightMultiplier: number;
  towerShape: TowerShape;
  towerRadiusMultiplier: number;
  towerHeightMultiplier: number;
  crenellationStyle: CrenellationStyle;
  crenellationHeightMultiplier: number;
  hasMoat: boolean;
  buildingCountMultiplier: number;
}

export interface HistoricalEra {
  id: string;
  name: string;
  centuryStart: number;
  centuryEnd: number;
  yearStart: number;
  yearEnd: number;
  style: CastleEraStyle;
  description: {
    title: string;
    overview: string;
    walls: string;
    towers: string;
    crenellations: string;
    innovations: string[];
  };
}

export const HISTORICAL_ERAS: HistoricalEra[] = [
  {
    id: '9th',
    name: '9世纪',
    centuryStart: 9,
    centuryEnd: 9,
    yearStart: 800,
    yearEnd: 899,
    style: {
      wallThicknessMultiplier: 0.7,
      wallHeightMultiplier: 0.75,
      towerShape: 'square',
      towerRadiusMultiplier: 0.8,
      towerHeightMultiplier: 0.8,
      crenellationStyle: 'simple',
      crenellationHeightMultiplier: 0.7,
      hasMoat: false,
      buildingCountMultiplier: 0.6,
    },
    description: {
      title: '维京时代早期城堡',
      overview: '9世纪的城堡主要是木造或土造的简易防御工事，以应对维京人的入侵。这些早期防御结构通常建在山丘或 strategic 位置。',
      walls: '城墙较薄，通常由夯土和木材建造，高度较低。防御主要依靠陡峭的地形和外围的栅栏。',
      towers: '塔楼多为方形木结构，尺寸较小，主要用作瞭望塔。角楼是主要的防御支撑点。',
      crenellations: '城垛简单朴素，仅具备基本的防御功能，垛口和堞的比例较小。',
      innovations: [
        '土岗-城郭式防御 (Motte-and-Bailey)',
        '木制 palisade 围栏',
        '夯土城墙技术',
      ],
    },
  },
  {
    id: '10th',
    name: '10世纪',
    centuryStart: 10,
    centuryEnd: 10,
    yearStart: 900,
    yearEnd: 999,
    style: {
      wallThicknessMultiplier: 0.85,
      wallHeightMultiplier: 0.85,
      towerShape: 'square',
      towerRadiusMultiplier: 0.9,
      towerHeightMultiplier: 0.9,
      crenellationStyle: 'simple',
      crenellationHeightMultiplier: 0.8,
      hasMoat: false,
      buildingCountMultiplier: 0.8,
    },
    description: {
      title: '石头城堡的萌芽',
      overview: '10世纪开始出现石造城堡，贵族和领主开始用石头替代木材建造更坚固的防御工事。封建制度在欧洲逐渐确立。',
      walls: '城墙开始采用石材建造，厚度增加，但高度仍然有限。部分城墙仍混合使用夯土和石材。',
      towers: '方形石塔成为主流，部分塔楼开始出现拱顶结构。塔楼数量有所增加，但主要集中在角部。',
      crenellations: '城垛样式有所改进，堞的高度增加，防御视野更好。',
      innovations: [
        '石砌城墙技术普及',
        '方形石塔 (Keep) 出现',
        '拱券结构应用于防御建筑',
      ],
    },
  },
  {
    id: '11th',
    name: '11世纪',
    centuryStart: 11,
    centuryEnd: 11,
    yearStart: 1000,
    yearEnd: 1099,
    style: {
      wallThicknessMultiplier: 1.0,
      wallHeightMultiplier: 1.0,
      towerShape: 'square',
      towerRadiusMultiplier: 1.0,
      towerHeightMultiplier: 1.0,
      crenellationStyle: 'simple',
      crenellationHeightMultiplier: 1.0,
      hasMoat: true,
      buildingCountMultiplier: 1.0,
    },
    description: {
      title: '诺曼征服时期',
      overview: '11世纪诺曼征服后，石造城堡在欧洲大规模普及。典型的诺曼式城堡以高大的方形主楼(Keep)为核心，护城河成为标配。',
      walls: '城墙厚实坚固，采用规整的石块砌筑。高度显著增加，配备完善的防御走道。',
      towers: '方形塔楼大量建造，诺曼式主楼(Keep)高大雄伟，成为城堡的核心防御和象征。',
      crenellations: '城垛标准化设计，垛口和堞比例协调，防御走道宽阔。',
      innovations: [
        '诺曼式主楼 (Norman Keep)',
        '护城河与吊桥系统',
        '城堡宫殿化倾向',
      ],
    },
  },
  {
    id: '12th',
    name: '12世纪',
    centuryStart: 12,
    centuryEnd: 12,
    yearStart: 1100,
    yearEnd: 1199,
    style: {
      wallThicknessMultiplier: 1.1,
      wallHeightMultiplier: 1.05,
      towerShape: 'd_shaped',
      towerRadiusMultiplier: 1.05,
      towerHeightMultiplier: 1.05,
      crenellationStyle: 'decorated',
      crenellationHeightMultiplier: 1.0,
      hasMoat: true,
      buildingCountMultiplier: 1.1,
    },
    description: {
      title: '十字军时代',
      overview: '12世纪十字军东征带来了东方防御技术，城堡设计更加复杂。D形塔楼和多边形塔楼开始出现，取代部分方形塔楼。',
      walls: '城墙进一步加厚，部分采用同心城墙设计。墙顶走道加宽，便于调动防御兵力。',
      towers: 'D形塔楼开始普及，结合了方形塔楼的建造便利和圆形塔楼的防御优势。部分城堡开始尝试多边形塔楼。',
      crenellations: '城垛装饰性增强，出现带有雕刻装饰的堞，部分城垛开始具备射击孔。',
      innovations: [
        'D形塔楼设计',
        '同心城墙 (Concentric Castles)',
        '射击孔 (Arrow Loops) 普及',
      ],
    },
  },
  {
    id: '13th',
    name: '13世纪',
    centuryStart: 13,
    centuryEnd: 13,
    yearStart: 1200,
    yearEnd: 1299,
    style: {
      wallThicknessMultiplier: 1.2,
      wallHeightMultiplier: 1.1,
      towerShape: 'round',
      towerRadiusMultiplier: 1.1,
      towerHeightMultiplier: 1.15,
      crenellationStyle: 'decorated',
      crenellationHeightMultiplier: 1.1,
      hasMoat: true,
      buildingCountMultiplier: 1.2,
    },
    description: {
      title: '同心城堡黄金时代',
      overview: '13世纪是中世纪城堡的巅峰时期，圆形塔楼和同心城墙设计完美结合。以爱德华一世在威尔士建造的城堡为代表。',
      walls: '城墙极为厚重，外城墙较低但坚固，内城墙高大雄伟。双层城墙形成纵深防御。',
      towers: '圆形塔楼成为主流，有效抵御攻城槌和地道破坏。塔楼高大突出，构成多层次交叉火力网。',
      crenellations: '城垛装饰华丽，堞和垛口比例经过精心设计，部分城垛顶部增加弧形顶盖。',
      innovations: [
        '圆形塔楼成为标准',
        '爱德华式城堡体系',
        '投石器平台 (Hoarding)',
      ],
    },
  },
  {
    id: '14th',
    name: '14世纪',
    centuryStart: 14,
    centuryEnd: 14,
    yearStart: 1300,
    yearEnd: 1399,
    style: {
      wallThicknessMultiplier: 1.15,
      wallHeightMultiplier: 1.15,
      towerShape: 'polygonal',
      towerRadiusMultiplier: 1.15,
      towerHeightMultiplier: 1.2,
      crenellationStyle: 'machicolated',
      crenellationHeightMultiplier: 1.15,
      hasMoat: true,
      buildingCountMultiplier: 1.3,
    },
    description: {
      title: '百年战争时期',
      overview: '14世纪百年战争推动了城堡技术革新，多边形塔楼和雉堞射击孔(machicolation)广泛应用。城堡同时具备防御和居住功能。',
      walls: '城墙厚度略有缩减但更高，墙体上开设更多箭窗和射击孔。防御走道增加遮雨棚。',
      towers: '多边形塔楼盛行，兼具圆形塔楼的防御优势和方形塔楼的内部空间利用率。',
      crenellations: '投石器口(Machicolation)成为城垛标准配置，可从上方投掷石块和沸水攻击敌人。',
      innovations: [
        '多边形塔楼普及',
        '投石器口 (Machicolation)',
        '城堡居住舒适性提升',
      ],
    },
  },
  {
    id: '15th',
    name: '15世纪',
    centuryStart: 15,
    centuryEnd: 15,
    yearStart: 1400,
    yearEnd: 1499,
    style: {
      wallThicknessMultiplier: 0.95,
      wallHeightMultiplier: 1.2,
      towerShape: 'polygonal',
      towerRadiusMultiplier: 1.2,
      towerHeightMultiplier: 1.3,
      crenellationStyle: 'cross_shaped',
      crenellationHeightMultiplier: 1.2,
      hasMoat: true,
      buildingCountMultiplier: 1.5,
    },
    description: {
      title: '文艺复兴前夜',
      overview: '15世纪火器开始出现，城堡设计逐渐从纯军事防御转向居住舒适性和装饰性。十字形城垛和华丽塔楼是这一时期的标志。',
      walls: '城墙相对变薄但更加高耸，装饰性增强。墙上开设更多窗户，显示出居住功能的重要性上升。',
      towers: '多边形塔楼更加高大华丽，装饰丰富。塔楼顶部出现装饰性尖顶和小尖塔。',
      crenellations: '十字形城垛和装饰性堀口成为流行样式，城垛兼具防御功能和美学表现。',
      innovations: [
        '十字形城垛 (Cross-shaped Crenellations)',
        '城堡装饰性增强',
        '火药时代前夕的过渡设计',
      ],
    },
  },
];

export function getEraByYear(year: number): HistoricalEra {
  const century = Math.floor(year / 100) + 1;
  const normalizedCentury = Math.min(15, Math.max(9, century));
  return HISTORICAL_ERAS.find((e) => e.centuryStart === normalizedCentury) || HISTORICAL_ERAS[0];
}

export function getInterpolatedStyle(year: number): CastleEraStyle {
  const eras = HISTORICAL_ERAS;
  const yearStart = eras[0].yearStart;
  const yearEnd = eras[eras.length - 1].yearEnd;
  const t = Math.max(0, Math.min(1, (year - yearStart) / (yearEnd - yearStart)));
  const totalCenturies = eras.length - 1;
  const exactIndex = t * totalCenturies;
  const index = Math.floor(exactIndex);
  const fraction = exactIndex - index;

  if (index >= totalCenturies) {
    return eras[totalCenturies].style;
  }

  const eraA = eras[index];
  const eraB = eras[index + 1];
  const styleA = eraA.style;
  const styleB = eraB.style;

  const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

  const towerShapePriority: TowerShape[] = ['square', 'd_shaped', 'round', 'polygonal'];
  const towerShape =
    fraction < 0.5
      ? styleA.towerShape
      : styleB.towerShape;
  void towerShapePriority;

  const crenellationPriority: CrenellationStyle[] = ['simple', 'decorated', 'machicolated', 'cross_shaped'];
  const crenellationStyle =
    fraction < 0.5
      ? styleA.crenellationStyle
      : styleB.crenellationStyle;
  void crenellationPriority;

  return {
    wallThicknessMultiplier: lerp(styleA.wallThicknessMultiplier, styleB.wallThicknessMultiplier, fraction),
    wallHeightMultiplier: lerp(styleA.wallHeightMultiplier, styleB.wallHeightMultiplier, fraction),
    towerShape,
    towerRadiusMultiplier: lerp(styleA.towerRadiusMultiplier, styleB.towerRadiusMultiplier, fraction),
    towerHeightMultiplier: lerp(styleA.towerHeightMultiplier, styleB.towerHeightMultiplier, fraction),
    crenellationStyle,
    crenellationHeightMultiplier: lerp(styleA.crenellationHeightMultiplier, styleB.crenellationHeightMultiplier, fraction),
    hasMoat: fraction < 0.5 ? styleA.hasMoat : styleB.hasMoat,
    buildingCountMultiplier: lerp(styleA.buildingCountMultiplier, styleB.buildingCountMultiplier, fraction),
  };
}
