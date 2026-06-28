/**
 * 個人差がない物理・生理定数（プログラム内固定）
 * 文献由来の普遍値であり、年齢・性別等では変動しない。
 */
export const PHYSICAL_CONSTANTS = {
  /** 大気圧 mmHg */
  PATM: 760,
  /** 水蒸気圧 mmHg */
  PH2O: 47,
  /** 吸入酸素濃度 */
  FIO2: 0.21,
  /** 呼吸商 R */
  RESPIRATORY_QUOTIENT: 0.8,
  /** 脂肪エネルギー密度 kcal/kg (Hall et al.) */
  RHO_FAT_KCAL_PER_KG: 7700,
  /** 標準動脈血圧 mmHg（MAP 基準） */
  MAP_REFERENCE: 90,
  /** 標準 PaCO2 mmHg */
  PACO2_REFERENCE: 40,
  /** Bergman モデル: インスリン作用コンパートメント減衰 p2 (min⁻¹) */
  BERGMAN_P2: 0.025,
  /** 腎 TGF フィードバック構造定数 */
  KIDNEY_TGF_STRUCTURAL_GAIN: 0.15,
  /** 腎濾過係数（モデル構造定数） */
  KIDNEY_FILTRATION_COEFF: 0.001,
  /** 腎圧感受性 kp（モデル構造定数） */
  KIDNEY_PRESSURE_SENSITIVITY: 0.005,
} as const;
