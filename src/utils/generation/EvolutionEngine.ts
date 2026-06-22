import { SeededRandom } from '@/utils/seededRandom';
import { EvolutionConfig, CastleParams, DEFAULT_EVOLUTION_CONFIG } from '@/types/castle';

export const EVO_RANDOMIZABLE_PARAMS: Record<string, { min: number; max: number; step?: number }> = {
  plotWidth: { min: 20, max: 80, step: 1 },
  plotDepth: { min: 15, max: 60, step: 1 },
  wallHeight: { min: 4, max: 20, step: 0.5 },
  wallThickness: { min: 1, max: 5, step: 0.5 },
  towerCount: { min: 4, max: 12, step: 1 },
  towerHeight: { min: 8, max: 25, step: 1 },
  towerRadius: { min: 2, max: 6, step: 0.5 },
  moatWidth: { min: 2, max: 10, step: 0.5 },
  moatDepth: { min: 1, max: 8, step: 0.5 },
  gateWidth: { min: 2, max: 10, step: 0.5 },
  gateHeight: { min: 3, max: 12, step: 0.5 },
  buildingHeight: { min: 3, max: 15, step: 0.5 },
  terrainAmplitude: { min: 0, max: 15, step: 0.2 },
  terrainFrequency: { min: 0.5, max: 6, step: 0.1 },
  terrainScale: { min: 0.01, max: 0.1, step: 0.005 },
  timeOfDay: { min: 0, max: 24, step: 0.1 },
  residentCount: { min: 3, max: 50, step: 1 },
  drawbridgeAngle: { min: 0, max: 90, step: 1 },
  portcullisPosition: { min: 0, max: 1, step: 0.02 },
  barLatchPosition: { min: 0, max: 1, step: 0.02 },
};

export const EVO_RANDOMIZABLE_ENUMS: Record<string, string[]> = {
  terrainType: ['plain', 'hills', 'mountain'],
  weather: ['sunny', 'rainy', 'snowy', 'foggy'],
  wallStyle: ['medieval', 'roman', 'norman', 'gothic', 'crusader', 'renaissance'],
  towerType: ['basic', 'square_fort', 'polygon_tower', 'spiral_stair', 'gatehouse'],
};

export interface Individual {
  genes: Record<string, number>;
  fitness: number;
  params: Partial<CastleParams>;
}

export interface EvolutionResult {
  bestIndividual: Individual;
  population: Individual[];
  generation: number;
  bestFitnessHistory: number[];
  avgFitnessHistory: number[];
}

function randomInRange(min: number, max: number, step: number = 1): number {
  const range = max - min;
  const steps = Math.floor(range / step);
  const randomStep = Math.floor(Math.random() * (steps + 1));
  return Math.round((min + randomStep * step) * 1000) / 1000;
}

export class EvolutionEngine {
  private config: EvolutionConfig;
  private rng: SeededRandom;
  private paramRanges: Record<string, { min: number; max: number; step?: number }>;
  private enumOptions: Record<string, string[]>;
  private fitnessHistory: number[] = [];
  private avgHistory: number[] = [];

  constructor(seed: number, config: EvolutionConfig = DEFAULT_EVOLUTION_CONFIG) {
    this.config = config;
    this.rng = new SeededRandom(seed);
    this.paramRanges = EVO_RANDOMIZABLE_PARAMS;
    this.enumOptions = { ...EVO_RANDOMIZABLE_ENUMS };
  }

  private createRandomIndividual(): Individual {
    const genes: Record<string, number> = {};
    for (const [key, range] of Object.entries(this.paramRanges)) {
      genes[key] = randomInRange(range.min, range.max, range.step);
    }
    for (const key of Object.keys(this.enumOptions)) {
      genes[key] = this.rng.next();
    }
    genes['seed'] = Math.floor(this.rng.range(0, 100000));
    genes['hasMoat'] = this.rng.next() > 0.3 ? 1 : 0;
    genes['hasPortcullis'] = this.rng.next() > 0.3 ? 1 : 0;
    genes['hasDrawbridge'] = this.rng.next() > 0.3 ? 1 : 0;
    genes['hasGatehouse'] = this.rng.next() > 0.3 ? 1 : 0;
    genes['hasBarLatch'] = this.rng.next() > 0.4 ? 1 : 0;

    return { genes, fitness: 0, params: {} };
  }

  private genesToParams(genes: Record<string, number>): Partial<CastleParams> {
    const params: any = {};
    for (const [key, range] of Object.entries(this.paramRanges)) {
      const value = genes[key] ?? randomInRange(range.min, range.max, range.step);
      this.setNestedValue(params, key, value);
    }
    for (const [key, options] of Object.entries(this.enumOptions)) {
      const idx = Math.floor((genes[key] ?? 0) * options.length);
      this.setNestedValue(params, key, options[Math.min(idx, options.length - 1)]);
    }
    params.hasMoat = (genes['hasMoat'] ?? 0.7) > 0.5;
    params.hasPortcullis = (genes['hasPortcullis'] ?? 0.7) > 0.5;
    params.hasDrawbridge = (genes['hasDrawbridge'] ?? 0.7) > 0.5;
    params.hasGatehouse = (genes['hasGatehouse'] ?? 0.7) > 0.5;
    params.hasBarLatch = (genes['hasBarLatch'] ?? 0.6) > 0.5;
    params.seed = Math.floor(genes['seed'] ?? 12345);
    return params as Partial<CastleParams>;
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }

  evaluateFitness(individual: Individual): number {
    const params = individual.params;
    const w = this.config.fitnessWeights;

    let defenseScore = 0;
    if ((params as any).hasMoat) defenseScore += 0.2;
    if ((params as any).hasPortcullis) defenseScore += 0.2;
    if ((params as any).hasGatehouse) defenseScore += 0.2;
    if ((params as any).hasDrawbridge) defenseScore += 0.15;
    if ((params as any).hasBarLatch) defenseScore += 0.1;
    defenseScore += Math.min(1, ((params as any).wallHeight ?? 8) / 20) * 0.15;
    defenseScore += Math.min(1, ((params as any).towerCount ?? 4) / 12) * 0.15;
    defenseScore = Math.min(1, defenseScore);

    let aestheticsScore = 0;
    const towerHeight = (params as any).towerHeight ?? 12;
    const wallHeight = (params as any).wallHeight ?? 8;
    const heightRatio = towerHeight / Math.max(1, wallHeight);
    if (heightRatio > 1.2 && heightRatio < 2.5) aestheticsScore += 0.3;
    else aestheticsScore += 0.1;
    const plotW = (params as any).plotWidth ?? 40;
    const plotD = (params as any).plotDepth ?? 30;
    const plotRatio = plotW / Math.max(1, plotD);
    if (plotRatio > 1.0 && plotRatio < 2.0) aestheticsScore += 0.3;
    else aestheticsScore += 0.1;
    if ((params as any).towerCount >= 4 && (params as any).towerCount <= 8) aestheticsScore += 0.2;
    aestheticsScore += Math.min(1, ((params as any).terrainAmplitude ?? 2) / 8) * 0.2;
    aestheticsScore = Math.min(1, aestheticsScore);

    let resourceScore = 0;
    const wallThick = (params as any).wallThickness ?? 2;
    const moatWidth = (params as any).moatWidth ?? 4;
    const totalMaterial = wallHeight * wallThick * (plotW + plotD) * 2;
    const optimalMaterial = 800;
    const materialDiff = Math.abs(totalMaterial - optimalMaterial) / optimalMaterial;
    resourceScore += Math.max(0, 1 - materialDiff) * 0.5;
    if ((params as any).hasMoat) {
      const moatVolume = moatWidth * ((params as any).moatDepth ?? 3) * (plotW + plotD) * 2;
      if (moatVolume < 1500) resourceScore += 0.3;
      else resourceScore += 0.1;
    } else {
      resourceScore += 0.15;
    }
    const buildingDist = (params as any).buildingTypeDistribution;
    if (buildingDist) {
      const totalBuildings = Object.values(buildingDist as Record<string, number>).reduce((s: number, v) => s + v, 0);
      if (totalBuildings >= 3 && totalBuildings <= 10) resourceScore += 0.2;
    }
    resourceScore = Math.min(1, resourceScore);

    let integrityScore = 0;
    if (wallThick >= 2) integrityScore += 0.3;
    else integrityScore += wallThick / 2 * 0.3;
    if (wallHeight / Math.max(0.1, wallThick) < 6) integrityScore += 0.3;
    else integrityScore += 0.1;
    const terrainAmp = (params as any).terrainAmplitude ?? 2;
    if (terrainAmp < 5) integrityScore += 0.2;
    else integrityScore += 0.05;
    if (plotW < 60 && plotD < 50) integrityScore += 0.2;
    integrityScore = Math.min(1, integrityScore);

    return (
      w.defense * defenseScore +
      w.aesthetics * aestheticsScore +
      w.resourceEfficiency * resourceScore +
      w.structuralIntegrity * integrityScore
    );
  }

  private tournamentSelect(population: Individual[]): Individual {
    const tournamentSize = Math.min(this.config.tournamentSize, population.length);
    let best: Individual | null = null;
    for (let i = 0; i < tournamentSize; i++) {
      const idx = Math.floor(this.rng.next() * population.length);
      const candidate = population[idx];
      if (!best || candidate.fitness > best.fitness) {
        best = candidate;
      }
    }
    return best!;
  }

  private crossover(parent1: Individual, parent2: Individual): Individual {
    const childGenes: Record<string, number> = {};
    for (const key of Object.keys(parent1.genes)) {
      if (this.rng.next() < 0.5) {
        childGenes[key] = parent1.genes[key];
      } else {
        childGenes[key] = parent2.genes[key];
      }
    }
    const child: Individual = { genes: childGenes, fitness: 0, params: {} };
    child.params = this.genesToParams(childGenes);
    return child;
  }

  private mutate(individual: Individual): Individual {
    const genes = { ...individual.genes };
    for (const [key, range] of Object.entries(this.paramRanges)) {
      if (this.rng.next() < this.config.mutationRate) {
        const current = genes[key];
        const mutationStrength = (range.max - range.min) * 0.15;
        const delta = (this.rng.next() - 0.5) * 2 * mutationStrength;
        genes[key] = Math.max(range.min, Math.min(range.max, current + delta));
        if (range.step) {
          genes[key] = Math.round(genes[key] / range.step) * range.step;
        }
      }
    }
    for (const key of Object.keys(this.enumOptions)) {
      if (this.rng.next() < this.config.mutationRate * 0.5) {
        genes[key] = this.rng.next();
      }
    }
    for (const boolKey of ['hasMoat', 'hasPortcullis', 'hasDrawbridge', 'hasGatehouse', 'hasBarLatch']) {
      if (this.rng.next() < this.config.mutationRate * 0.3) {
        genes[boolKey] = genes[boolKey] > 0.5 ? 0 : 1;
      }
    }
    const result: Individual = { genes, fitness: 0, params: {} };
    result.params = this.genesToParams(genes);
    return result;
  }

  run(baseParams: CastleParams): EvolutionResult {
    let population: Individual[] = [];

    for (let i = 0; i < this.config.populationSize; i++) {
      const individual = this.createRandomIndividual();
      individual.params = this.genesToParams(individual.genes);
      population.push(individual);
    }

    const baseGenes = this.paramsToGenes(baseParams);
    const seedIndividual: Individual = { genes: baseGenes, fitness: 0, params: { ...baseParams } };
    population[0] = seedIndividual;

    this.fitnessHistory = [];
    this.avgHistory = [];

    for (let gen = 0; gen < this.config.generations; gen++) {
      for (const individual of population) {
        individual.fitness = this.evaluateFitness(individual);
      }

      population.sort((a, b) => b.fitness - a.fitness);

      const bestFitness = population[0].fitness;
      const avgFitness = population.reduce((s, ind) => s + ind.fitness, 0) / population.length;
      this.fitnessHistory.push(bestFitness);
      this.avgHistory.push(avgFitness);

      const nextPopulation: Individual[] = [];

      for (let i = 0; i < this.config.eliteCount && i < population.length; i++) {
        nextPopulation.push({ ...population[i] });
      }

      while (nextPopulation.length < this.config.populationSize) {
        const parent1 = this.tournamentSelect(population);
        const parent2 = this.tournamentSelect(population);

        let child: Individual;
        if (this.rng.next() < this.config.crossoverRate) {
          child = this.crossover(parent1, parent2);
        } else {
          child = { genes: { ...parent1.genes }, fitness: 0, params: {} };
          child.params = this.genesToParams(child.genes);
        }

        child = this.mutate(child);
        nextPopulation.push(child);
      }

      population = nextPopulation;
    }

    for (const individual of population) {
      individual.fitness = this.evaluateFitness(individual);
    }
    population.sort((a, b) => b.fitness - a.fitness);

    return {
      bestIndividual: population[0],
      population,
      generation: this.config.generations,
      bestFitnessHistory: this.fitnessHistory,
      avgFitnessHistory: this.avgHistory,
    };
  }

  private paramsToGenes(params: CastleParams): Record<string, number> {
    const genes: Record<string, number> = {};
    for (const [key, range] of Object.entries(this.paramRanges)) {
      const value = this.getNestedValue(params, key);
      if (typeof value === 'number') {
        genes[key] = Math.max(range.min, Math.min(range.max, value));
      } else {
        genes[key] = randomInRange(range.min, range.max, range.step);
      }
    }
    for (const [key, options] of Object.entries(this.enumOptions)) {
      const value = this.getNestedValue(params, key);
      const idx = options.indexOf(String(value));
      genes[key] = idx >= 0 ? idx / options.length : this.rng.next();
    }
    genes['hasMoat'] = params.hasMoat ? 1 : 0;
    genes['hasPortcullis'] = params.hasPortcullis ? 1 : 0;
    genes['hasDrawbridge'] = params.hasDrawbridge ? 1 : 0;
    genes['hasGatehouse'] = params.hasGatehouse ? 1 : 0;
    genes['hasBarLatch'] = params.hasBarLatch ? 1 : 0;
    genes['seed'] = params.seed;
    return genes;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }
}
