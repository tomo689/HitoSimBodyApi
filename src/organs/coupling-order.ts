/** 結合シミュレーションでの臓器実行順（依存関係に基づく） */
export const COUPLING_ORDER: Record<string, number> = {
  heart: 10,
  lung: 20,
  skeletal_muscle: 30,
  liver: 40,
  pancreas: 50,
  kidney: 60,
  brain: 70,
  adipose_tissue: 80,
  blood: 90,
};

export function sortByCouplingOrder(keys: string[]): string[] {
  return [...keys].sort(
    (a, b) => (COUPLING_ORDER[a] ?? 100) - (COUPLING_ORDER[b] ?? 100),
  );
}
