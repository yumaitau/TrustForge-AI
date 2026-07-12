# Trust scoring methodology

Version `2026.1` is the initial executable specification. It is a foundation for review, not a claim that the final weighting model is settled.

## Principles

1. Scores are deterministic and reproducible from retained inputs.
2. Every non-neutral component cites one or more evidence records.
3. Missing evidence is not silently interpreted as failure. It receives a neutral value and zero confidence.
4. Score and confidence are distinct. A high score with narrow evidence coverage must remain visibly uncertain.
5. Methodology versions are immutable. Recalculation creates a new score record.
6. Negative evidence, incidents, recency, and contradictory evidence will be modeled explicitly before production scoring launches.

## Current calculation

Each of 14 dimensions has a published weight totaling 1. Evidence contributions contain a 0–100 value and 0–1 confidence. A dimension uses the confidence-weighted mean of its evidence. Its contribution is the dimension score multiplied by the published weight.

Overall confidence currently equals the total weight of dimensions with evidence. This intentionally simple rule will be replaced only through a documented methodology revision with calibration data.

The executable source is `lib/trust/methodology.ts`; its tests are part of the methodology specification.
