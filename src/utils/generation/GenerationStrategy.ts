import { CastleParams, GenerationAlgorithm, LSystemConfig, CellularAutomataConfig, EvolutionConfig, DEFAULT_LSYSTEM_CONFIG, DEFAULT_CELLULAR_AUTOMATA_CONFIG, DEFAULT_EVOLUTION_CONFIG } from '@/types/castle';
import { LSystemEngine } from './LSystemEngine';
import { CellularAutomataEngine } from './CellularAutomataEngine';
import { EvolutionEngine, EvolutionResult } from './EvolutionEngine';

export interface GenerationResult {
  params: Partial<CastleParams>;
  algorithm: GenerationAlgorithm;
  metadata: {
    lsystemLayout?: ReturnType<LSystemEngine['generateLayout']>;
    caGrid?: boolean[][];
    evolutionResult?: EvolutionResult;
  };
}

export class GenerationStrategy {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  generate(
    algorithm: GenerationAlgorithm,
    baseParams: CastleParams,
    lsystemConfig: LSystemConfig = DEFAULT_LSYSTEM_CONFIG,
    caConfig: CellularAutomataConfig = DEFAULT_CELLULAR_AUTOMATA_CONFIG,
    evolutionConfig: EvolutionConfig = DEFAULT_EVOLUTION_CONFIG
  ): GenerationResult {
    switch (algorithm) {
      case 'rule_based':
        return this.ruleBasedGenerate(baseParams);
      case 'lsystem':
        return this.lsystemGenerate(baseParams, lsystemConfig);
      case 'cellular_automata':
        return this.cellularAutomataGenerate(baseParams, caConfig);
      case 'evolutionary':
        return this.evolutionaryGenerate(baseParams, evolutionConfig);
      default:
        return this.ruleBasedGenerate(baseParams);
    }
  }

  private ruleBasedGenerate(baseParams: CastleParams): GenerationResult {
    const updates: Partial<CastleParams> = { seed: Math.floor(Math.random() * 100000) };
    return {
      params: updates,
      algorithm: 'rule_based',
      metadata: {},
    };
  }

  private lsystemGenerate(baseParams: CastleParams, config: LSystemConfig): GenerationResult {
    const engine = new LSystemEngine(this.seed, config);
    const lstring = engine.generate();
    const layout = engine.generateLayout(lstring);
    const params = engine.generateParams(baseParams);

    return {
      params,
      algorithm: 'lsystem',
      metadata: {
        lsystemLayout: layout,
      },
    };
  }

  private cellularAutomataGenerate(baseParams: CastleParams, config: CellularAutomataConfig): GenerationResult {
    const engine = new CellularAutomataEngine(this.seed, config);
    const result = engine.run();
    const params = engine.generateParams(baseParams);

    return {
      params,
      algorithm: 'cellular_automata',
      metadata: {
        caGrid: result.grid.cells,
      },
    };
  }

  private evolutionaryGenerate(baseParams: CastleParams, config: EvolutionConfig): GenerationResult {
    const engine = new EvolutionEngine(this.seed, config);
    const result = engine.run(baseParams);

    return {
      params: result.bestIndividual.params,
      algorithm: 'evolutionary',
      metadata: {
        evolutionResult: result,
      },
    };
  }

  static getDefaultConfig(algorithm: GenerationAlgorithm) {
    switch (algorithm) {
      case 'lsystem':
        return DEFAULT_LSYSTEM_CONFIG;
      case 'cellular_automata':
        return DEFAULT_CELLULAR_AUTOMATA_CONFIG;
      case 'evolutionary':
        return DEFAULT_EVOLUTION_CONFIG;
      default:
        return null;
    }
  }
}
