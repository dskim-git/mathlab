export type ProbabilityMode = "coin" | "dice" | "custom";

export type SimulationInput = {
  mode: ProbabilityMode;
  n: number;
  repeats: number;
  p: number;
};

export type DistributionRow = {
  successCount: number;
  frequency: number;
  relativeFrequency: number;
  theoreticalProbability: number;
};

export type SimulationResult = {
  input: SimulationInput;
  distribution: DistributionRow[];
  observedMean: number;
  expectedMean: number;
  observedVariance: number;
  expectedVariance: number;
};

export function getDefaultProbability(mode: ProbabilityMode) {
  if (mode === "coin") {
    return 0.5;
  }

  if (mode === "dice") {
    return 1 / 6;
  }

  return 0.5;
}

export function getModeLabel(mode: ProbabilityMode) {
  if (mode === "coin") {
    return "동전 던지기";
  }

  if (mode === "dice") {
    return "주사위에서 특정 눈 나오기";
  }

  return "성공확률 직접 입력";
}

export function clampProbability(value: number) {
  if (Number.isNaN(value)) {
    return 0.5;
  }

  return Math.min(1, Math.max(0, value));
}

export function combination(n: number, r: number) {
  if (r < 0 || r > n) {
    return 0;
  }

  const k = Math.min(r, n - r);
  let result = 1;

  for (let i = 1; i <= k; i += 1) {
    result = (result * (n - k + i)) / i;
  }

  return result;
}

export function binomialProbability(n: number, k: number, p: number) {
  if (p === 0) {
    return k === 0 ? 1 : 0;
  }

  if (p === 1) {
    return k === n ? 1 : 0;
  }

  return combination(n, k) * p ** k * (1 - p) ** (n - k);
}

export function simulateBinomial(input: SimulationInput): SimulationResult {
  const n = Math.max(1, Math.floor(input.n));
  const repeats = Math.max(1, Math.floor(input.repeats));
  const p = clampProbability(input.p);

  const frequencies = Array.from({ length: n + 1 }, () => 0);

  for (let repeat = 0; repeat < repeats; repeat += 1) {
    let successCount = 0;

    for (let trial = 0; trial < n; trial += 1) {
      if (Math.random() < p) {
        successCount += 1;
      }
    }

    frequencies[successCount] += 1;
  }

  const distribution = frequencies.map((frequency, successCount) => ({
    successCount,
    frequency,
    relativeFrequency: frequency / repeats,
    theoreticalProbability: binomialProbability(n, successCount, p),
  }));

  const observedMean =
    distribution.reduce(
      (sum, row) => sum + row.successCount * row.frequency,
      0
    ) / repeats;

  const observedSecondMoment =
    distribution.reduce(
      (sum, row) => sum + row.successCount ** 2 * row.frequency,
      0
    ) / repeats;

  const observedVariance = observedSecondMoment - observedMean ** 2;

  return {
    input: {
      mode: input.mode,
      n,
      repeats,
      p,
    },
    distribution,
    observedMean,
    expectedMean: n * p,
    observedVariance,
    expectedVariance: n * p * (1 - p),
  };
}