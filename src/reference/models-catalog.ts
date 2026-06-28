/** 論文・文献参照 */
export interface PaperReference {
  id: string;
  authors: string;
  title: string;
  journal: string;
  year: number;
  doi?: string;
  url?: string;
}

/** 数理モデルの定義 */
export interface MathematicalModelReference {
  modelKey: string;
  organKey: string;
  organNameJa: string;
  modelName: string;
  modelNameJa: string;
  equations: string[];
  description: string;
  parameters: { symbol: string; meaning: string; typicalValue?: string }[];
  paperIds: string[];
}

export const PAPERS: PaperReference[] = [
  {
    id: 'bergman_1981',
    authors: 'Bergman R.N., Ider Y.Z., Bowden C.R., et al.',
    title: 'Quantitative estimation of insulin sensitivity',
    journal: 'American Journal of Physiology - Endocrinology and Metabolism',
    year: 1979,
    doi: '10.1152/ajpendo.1979.236.6.E667',
    url: 'https://pubmed.ncbi.nlm.nih.gov/443421/',
  },
  {
    id: 'cobelli_1981',
    authors: 'Bergman R.N., Phillips L.S., Cobelli C.',
    title: 'Physiologic evaluation of factors controlling glucose tolerance in man',
    journal: 'Journal of Clinical Investigation',
    year: 1981,
    doi: '10.1172/JCI110374',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC370779/',
  },
  {
    id: 'westerhof_2009',
    authors: 'Westerhof N., Lankhaar J.W., Westerhof B.E.',
    title: 'The arterial windkessel',
    journal: 'Medical & Biological Engineering & Computing',
    year: 2009,
    doi: '10.1007/s11517-009-0453-2',
    url: 'https://pubmed.ncbi.nlm.nih.gov/19288197/',
  },
  {
    id: 'frank_starling_1918',
    authors: 'Patterson S.W., Starling E.H.',
    title: 'On the mechanical factors which determine the output of the ventricles',
    journal: 'Journal of Physiology',
    year: 1914,
    url: 'https://physoc.onlinelibrary.wiley.com/doi/10.1113/jphysiol.1914.sp001523',
  },
  {
    id: 'west_respiratory',
    authors: 'West J.B.',
    title: 'Respiratory Physiology: The Essentials',
    journal: 'Lippincott Williams & Wilkins (Textbook)',
    year: 2012,
    url: 'https://shop.lww.com/Respiratory-Physiology/p/9781461122334',
  },
  {
    id: 'hall_2011_lancet',
    authors: 'Hall K.D., Sacks G., Chandramohan D., et al.',
    title: 'Quantification of the effect of energy imbalance on bodyweight',
    journal: 'The Lancet',
    year: 2011,
    doi: '10.1016/S0140-6736(11)60812-X',
    url: 'https://pubmed.ncbi.nlm.nih.gov/21872751/',
  },
  {
    id: 'hall_2012_ajcn',
    authors: 'Hall K.D., Butte N.F., Swinburn B.A., et al.',
    title: 'Dynamics of childhood growth and obesity',
    journal: 'American Journal of Clinical Nutrition',
    year: 2012,
    doi: '10.3945/ajcn.111.020875',
    url: 'https://pubmed.ncbi.nlm.nih.gov/22760573/',
  },
  {
    id: 'roy_parker_2006',
    authors: 'Roy A., Parker R.S.',
    title: 'Dynamic modeling of free fatty acid, glucose, and insulin',
    journal: 'IEEE Transactions on Biomedical Engineering',
    year: 2006,
    doi: '10.1109/TBME.2006.871886',
    url: 'https://pubmed.ncbi.nlm.nih.gov/16686425/',
  },
  {
    id: 'sgouralis_layton_2013',
    authors: 'Sgouralis I., Layton A.T.',
    title: 'Control and modulation of fluid flow, oxygen solutes in the microvasculature',
    journal: 'Mathematical Biosciences',
    year: 2013,
    doi: '10.1016/j.mbs.2013.04.001',
    url: 'https://pubmed.ncbi.nlm.nih.gov/23602809/',
  },
  {
    id: 'sgouralis_layton_2014_review',
    authors: 'Sgouralis I., Layton A.T.',
    title: 'Mathematical Modeling of Renal Hemodynamics in Physiology and Pathophysiology',
    journal: 'Mathematical Biosciences and Engineering',
    year: 2014,
    doi: '10.3934/mbe.2014.11.1577',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4426241/',
  },
  {
    id: 'phillips_1997',
    authors: 'Phillips S.M., Tipton K.D., Aarsland A., et al.',
    title: 'Mixed muscle protein synthesis and breakdown after resistance exercise in humans',
    journal: 'American Journal of Physiology',
    year: 1997,
    doi: '10.1152/ajpendo.1997.273.1.E99',
    url: 'https://pubmed.ncbi.nlm.nih.gov/9252485/',
  },
  {
    id: 'aubert_costalat_2007',
    authors: 'Aubert A., Costalat R.',
    title: 'A model of the coupling between brain electrical activity, metabolism, and hemodynamics',
    journal: 'Journal of Theoretical Biology',
    year: 2007,
    doi: '10.1016/j.jtbi.2007.07.020',
    url: 'https://pubmed.ncbi.nlm.nih.gov/17716670/',
  },
  {
    id: 'buxton_2004',
    authors: 'Buxton R.B., Uludağ K., Dubowitz D.J., et al.',
    title: 'Modeling the hemodynamic response to brain activation',
    journal: 'NeuroImage',
    year: 2004,
    doi: '10.1016/j.neuroimage.2003.09.046',
    url: 'https://pubmed.ncbi.nlm.nih.gov/15050547/',
  },
  {
    id: 'keener_sneyd_2009',
    authors: 'Keener J., Sneyd J.',
    title: 'Mathematical Physiology I: Cellular Physiology',
    journal: 'Springer Interdisciplinary Applied Mathematics (Textbook)',
    year: 2009,
    doi: '10.1007/978-0-387-75847-3',
    url: 'https://link.springer.com/book/10.1007/978-0-387-75847-3',
  },
  {
    id: 'batzel_chung_2009',
    authors: 'Batzel J.J., Bachar M., Kappel F. (eds.)',
    title: 'Mathematical Modeling and Validation in Physiology',
    journal: 'Springer Lecture Notes in Mathematics',
    year: 2013,
    doi: '10.1007/978-3-642-32882-4',
    url: 'https://link.springer.com/book/10.1007/978-3-642-32882-4',
  },
];

export const MATHEMATICAL_MODELS: MathematicalModelReference[] = [
  {
    modelKey: 'windkessel_three_element',
    organKey: 'heart',
    organNameJa: '心臓',
    modelName: 'Three-Element Windkessel Model',
    modelNameJa: '三要素 Windkessel モデル',
    equations: [
      'P(t) = R·Q(t) + C·dP/dt',
      'Q = SV × HR',
      'SV = SV₀(1 + α·Exercise + β·Sleep)',
    ],
    description:
      '動脈系を抵抗 R・コンプライアンス C・特性インピーダンス Z で近似し、Frank-Starling 則に基づく stroke volume から心拍出量を算出する循環数理モデル。',
    parameters: [
      { symbol: 'R', meaning: '総末梢血管抵抗', typicalValue: '0.8–1.2 mmHg·s/mL' },
      { symbol: 'C', meaning: '動脈コンプライアンス', typicalValue: '1.0–1.5 mL/mmHg' },
      { symbol: 'SV', meaning: '1回拍出量', typicalValue: '60–80 mL' },
      { symbol: 'HR', meaning: '心拍数', typicalValue: '60–100 bpm' },
    ],
    paperIds: ['westerhof_2009', 'frank_starling_1918', 'keener_sneyd_2009'],
  },
  {
    modelKey: 'alveolar_gas_exchange',
    organKey: 'lung',
    organNameJa: '肺',
    modelName: 'Alveolar Gas Equation & Minute Ventilation Model',
    modelNameJa: '肺胞気方程式・分時換気量モデル',
    equations: [
      'VE = RR × VT',
      'PAO₂ = FiO₂(Patm - PH₂O) - PaCO₂/R',
      'VO₂ ≈ VE × k · (FiO₂ - FeO₂)',
    ],
    description:
      'West の呼吸生理学に基づき、換気量と肺胞気方程式から酸素摂取量 VO₂ を推定するモデル。',
    parameters: [
      { symbol: 'VE', meaning: '分時換気量', typicalValue: '5–8 L/min (安静時)' },
      { symbol: 'RR', meaning: '呼吸数', typicalValue: '12–16 /min' },
      { symbol: 'VT', meaning: '1回換気量', typicalValue: '400–600 mL' },
      { symbol: 'R', meaning: '呼吸商', typicalValue: '0.8' },
    ],
    paperIds: ['west_respiratory', 'keener_sneyd_2009'],
  },
  {
    modelKey: 'bergman_minimal',
    organKey: 'pancreas',
    organNameJa: '膵臓（内分泌）',
    modelName: 'Bergman Minimal Model',
    modelNameJa: 'Bergman 最小モデル',
    equations: [
      'dG/dt = -p₁(G - Gb) - X·G + Ra',
      'dX/dt = -p₂·X + p₃(I - Ib)',
      'SI = 1 / (p₁ + p₃·n)',
    ],
    description:
      'Mathematical Medicine の代表モデル。プラズマグルコース G とインスリン作用 X の 2 コンパートメント ODE で糖代謝を記述し、インスリン感受性 SI を定量化する。',
    parameters: [
      { symbol: 'G', meaning: 'プラズマグルコース', typicalValue: '70–100 mg/dL' },
      { symbol: 'p₁', meaning: 'グルコース効率', typicalValue: '0.01–0.03 min⁻¹' },
      { symbol: 'p₂', meaning: 'インスリン作用減衰', typicalValue: '0.02–0.05 min⁻¹' },
      { symbol: 'SI', meaning: 'インスリン感受性', typicalValue: '個体依存' },
    ],
    paperIds: ['bergman_1981', 'cobelli_1981', 'batzel_chung_2009'],
  },
  {
    modelKey: 'hepatic_glucose_production',
    organKey: 'liver',
    organNameJa: '肝臓',
    modelName: 'Hepatic Glucose Production (HGP) Model',
    modelNameJa: '肝糖新生モデル',
    equations: [
      'HGP = HGP₀ + α_ex·Exercise - α_ins·(I - Ib)',
      'dGlycogen/dt = Intake - HGP - Utilization',
    ],
    description:
      'Roy & Parker のエネルギー恒常モデルと Hall フレームワークに基づき、肝臓の糖産生とグリコーゲン動態を記述する。',
    parameters: [
      { symbol: 'HGP₀', meaning: 'ベースライン肝糖新生', typicalValue: '8–10 μmol/kg/min' },
      { symbol: 'α_ex', meaning: '運動による HGP 抑制係数', typicalValue: '0.02–0.06' },
      { symbol: 'α_ins', meaning: 'インスリンによる HGP 抑制', typicalValue: '0.01–0.03' },
    ],
    paperIds: ['roy_parker_2006', 'hall_2011_lancet', 'bergman_1981'],
  },
  {
    modelKey: 'renal_autoregulation_gfr',
    organKey: 'kidney',
    organNameJa: '腎臓',
    modelName: 'Renal Autoregulation & GFR Model',
    modelNameJa: '腎自己調節・GFR モデル',
    equations: [
      'GFR = GFR₀ · (1 - k_p·ΔMAP) · (1 + TGF)',
      'dV/dt = Q_in - Q_out - k_f·GFR',
      'TGF = γ · (MD_NaCl - setpoint)',
    ],
    description:
      'Sgouralis & Layton の腎血流動態レビューに基づく、糸球体濾過率と tubuloglomerular feedback (TGF) を含む簡略腎モデル。',
    parameters: [
      { symbol: 'GFR₀', meaning: 'ベースライン GFR', typicalValue: '90–120 mL/min/1.73m²' },
      { symbol: 'TGF', meaning: 'Tubuloglomerular feedback', typicalValue: '0.1–0.2 gain' },
      { symbol: 'k_f', meaning: '濾過係数', typicalValue: 'モデル依存' },
    ],
    paperIds: ['sgouralis_layton_2013', 'sgouralis_layton_2014_review'],
  },
  {
    modelKey: 'muscle_protein_turnover',
    organKey: 'skeletal_muscle',
    organNameJa: '骨格筋',
    modelName: 'Muscle Protein Turnover Model',
    modelNameJa: '筋タンパク質動態モデル',
    equations: [
      'dM/dt = k_s · (1 + β_ex·Exercise + β_pro·Protein) · (M_eq - M) - k_d · M',
      'NetBalance = ∫(k_s - k_d) dt',
    ],
    description:
      'Phillips らの筋タンパク質合成研究に基づき、運動刺激とタンパク質摂取が筋量 M に与える影響を記述する。',
    parameters: [
      { symbol: 'k_s', meaning: 'タンパク質合成率', typicalValue: '0.015–0.025 day⁻¹' },
      { symbol: 'k_d', meaning: 'タンパク質分解率', typicalValue: '0.015–0.020 day⁻¹' },
      { symbol: 'β_ex', meaning: '運動刺激係数', typicalValue: '0.5–1.0' },
    ],
    paperIds: ['phillips_1997', 'keener_sneyd_2009'],
  },
  {
    modelKey: 'cerebral_metabolic_rate',
    organKey: 'brain',
    organNameJa: '脳',
    modelName: 'Cerebral Metabolic Rate of Oxygen (CMRO2) Model',
    modelNameJa: '脳酸素代謝率モデル',
    equations: [
      'CMRO₂ = CMRO₂₀ · (CBF/CBF₀) · NeuralActivity · SleepFactor',
      'CBF = CBF₀ + γ · (MAP - MAP₀)',
    ],
    description:
      'Aubert & Costalat の脳エネルギー代謝モデルと Buxton の neurovascular coupling に基づき、睡眠・ストレス・運動が CMRO₂ に与える影響を推定する。',
    parameters: [
      { symbol: 'CMRO₂₀', meaning: 'ベースライン脳酸素代謝率', typicalValue: '3–4 mL O₂/100g/min' },
      { symbol: 'CBF', meaning: '脳血流', typicalValue: '50 mL/100g/min' },
      { symbol: 'γ', meaning: '血圧-血流結合係数', typicalValue: '0.3–0.6' },
    ],
    paperIds: ['aubert_costalat_2007', 'buxton_2004'],
  },
  {
    modelKey: 'hall_energy_balance',
    organKey: 'adipose_tissue',
    organNameJa: '脂肪組織',
    modelName: 'Hall Energy Balance Model',
    modelNameJa: 'Hall エネルギー平衡モデル',
    equations: [
      'dF/dt = (E_intake - E_expenditure) / ρ_fat',
      'ρ_fat ≈ 7700 kcal/kg',
      'ΔWeight = ΔFat + ΔLean',
    ],
    description:
      'Hall らの Mathematical Medicine におけるエネルギー平衡モデル。エネルギー収支から体脂肪量 F の時系列変化を予測する。',
    parameters: [
      { symbol: 'ρ_fat', meaning: '脂肪エネルギー密度', typicalValue: '7700 kcal/kg' },
      { symbol: 'E_intake', meaning: 'エネルギー摂取', typicalValue: '1500–3000 kcal/day' },
      { symbol: 'E_expenditure', meaning: 'エネルギー消費', typicalValue: '1500–3500 kcal/day' },
    ],
    paperIds: ['hall_2011_lancet', 'hall_2012_ajcn', 'roy_parker_2006'],
  },
];

export interface ModelCatalogEntry extends MathematicalModelReference {
  papers: PaperReference[];
}

export function getModelCatalog(): ModelCatalogEntry[] {
  const paperMap = new Map(PAPERS.map((p) => [p.id, p]));
  return MATHEMATICAL_MODELS.map((model) => ({
    ...model,
    papers: model.paperIds
      .map((id) => paperMap.get(id))
      .filter((p): p is PaperReference => p !== undefined),
  }));
}

export function getPaperIndex(): PaperReference[] {
  return PAPERS;
}

export function getModelByKey(modelKey: string): ModelCatalogEntry | undefined {
  return getModelCatalog().find((m) => m.modelKey === modelKey);
}
