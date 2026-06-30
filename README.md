# HitoSim Body API

人体デジタルツインを構築する iPhone アプリ向けバックエンド API です。  
NestJS で実装し、Cloudflare Workers 上で動作します。OpenAI API で目的分析・おすすめアクション生成を行い、**シミュレーションは Mathematical Medicine の数理モデル**（Bergman 最小モデル、Windkessel、Hall エネルギー平衡など）で実行します。

## 技術スタック

- **NestJS 11** + **TypeScript**
- **Cloudflare Workers**（`@mridang/nestjs-platform-cloudflare` アダプター）
- **OpenAI API**（`gpt-4o-mini`、JSON モード）
- **Wrangler 4**

## セットアップ

```bash
npm install
cp .dev.vars.example .dev.vars
# .dev.vars に API_KEY と OPENAI_API_KEY を設定
```

### シークレット

| 変数 | 説明 |
|------|------|
| `API_KEY` | クライアントがリクエスト時に送信する API キー |
| `OPENAI_API_KEY` | OpenAI API キー |

本番デプロイ時:

```bash
wrangler secret put API_KEY
wrangler secret put OPENAI_API_KEY
```

## 開発・デプロイ

```bash
# ローカル開発（TypeScript ビルド → wrangler dev）
npm run dev

# Cloudflare へデプロイ
npm run deploy
```

## 認証

すべてのエンドポイントで API キーが必要です。以下のいずれかで送信してください。

```
X-API-Key: <your-api-key>
```

```
Authorization: Bearer <your-api-key>
```

## エンドポイント

### `POST /purpose`

ユーザーの目的に基づき、影響を受ける **5 つのアウトプット** と、入力→出力変換に関与する **5 つの臓器** を選出します。

**リクエスト**

```json
{
  "purpose": "筋力を上げて体脂肪率を下げたい"
}
```

**レスポンス**

```json
{
  "purpose": "筋力を上げて体脂肪率を下げたい",
  "outputs": [
    {
      "id": "muscle_mass",
      "name": "筋肉量",
      "description": "筋力向上の直接的な指標",
      "unit": "kg"
    }
  ],
  "organs": [
    {
      "id": "skeletal_muscle",
      "name": "骨格筋",
      "role": "運動による筋蛋白合成と力発揮"
    }
  ]
}
```

### `POST /simulate`

指定タイムスケールで **臓器数理モデル** を実行し、アウトプット値を算出します。

**パラメータ決定フロー**
1. 年齢・性別・体格等からデフォルトパラメータを算出
2. OpenAI がユーザーデータをもとに個人化パラメータを推定（失敗時はデフォルトを使用）
3. 普遍定数（大気圧、FiO2、脂肪エネルギー密度 7700 kcal/kg 等）は `src/organs/constants.ts` に固定
4. **血液（`blood`）は AI 選定に関わらず常にシミュレーション**（`isDefaultOrgan: true` で返却）

**臓器間フィードバック**: 心臓→腎臓（MAP）、膵臓↔肝臓（血糖・インスリン・HGP）、骨格筋→膵臓（グルコース取り込み）、肺・心臓→血液（酸素輸送）など、結合ステップで状態を共有します。レスポンスの `couplingEnabled: true` で有効化を確認できます。

**タイムスケール**: `hourly` | `daily` | `weekly` | `monthly`

**リクエスト**

```json
{
  "purpose": "筋力を上げて体脂肪率を下げたい",
  "userProfile": {
    "age": 35,
    "gender": "male",
    "heightCm": 175,
    "weightKg": 72,
    "bodyFatPercent": 18,
    "restingHeartRate": 62,
    "additionalData": [
      { "key": "既往歴", "value": "なし" }
    ]
  },
  "timescale": "daily",
  "inputs": [
    { "name": "運動時間", "value": 45, "unit": "minutes" },
    { "name": "睡眠時間", "value": 7, "unit": "hours" },
    { "name": "タンパク質摂取", "value": 120, "unit": "g" }
  ],
  "outputs": [
    { "id": "muscle_mass", "name": "筋肉量", "unit": "kg" }
  ],
  "organs": [
    { "id": "skeletal_muscle", "name": "骨格筋" }
  ]
}
```

**レスポンス**（抜粋）

```json
{
  "parameterSource": "ai",
  "parameterRationale": "35歳男性、BMI正常、体脂肪18%を反映し...",
  "modelsUsed": ["muscle_protein_turnover"],
  "outputs": [
    {
      "outputId": "muscle_mass",
      "outputName": "筋肉量",
      "unit": "kg",
      "dataPoints": [
        { "label": "1日目", "value": 62.1 },
        { "label": "2日目", "value": 62.3 }
      ],
      "summary": "運動と栄養摂取により緩やかに増加傾向",
      "trend": "increasing"
    }
  ],
  "organs": [
    {
      "organId": "skeletal_muscle",
      "organName": "骨格筋",
      "functionLevel": 78,
      "metrics": [
        { "name": "合成率", "value": 1.2, "unit": "%/day" }
      ],
      "summary": "適度な刺激により機能レベルは良好"
    }
  ]
}
```

### `POST /recommendations`

シミュレーション結果をもとに、**おすすめアクション 3 件** を生成します。

**リクエスト**

```json
{
  "purpose": "筋力を上げて体脂肪率を下げたい",
  "timescale": "daily",
  "outputs": [ "...simulate の outputs..." ],
  "organs": [ "...simulate の organs..." ]
}
```

**レスポンス**

```json
{
  "purpose": "...",
  "recommendations": [
    {
      "title": "就寝前のタンパク質摂取",
      "description": "就寝1時間前に20g程度のタンパク質を摂取する",
      "expectedImpact": "夜間の筋蛋白合成を促進し筋肉量の維持・増加に寄与",
      "targetOutputs": ["muscle_mass"],
      "priority": 1
    }
  ]
}
```

## 典型的な利用フロー

```
1. POST /purpose        → アウトプット・臓器を決定
2. POST /simulate       → タイムスケール付きシミュレーション
3. POST /recommendations → シミュレーション結果からアクション提案
```

## シミュレーションアルゴリズム

シミュレーションの実行フロー・タイムスケール・臓器別数理モデル・設計上の制約については **[docs/SIMULATION_ALGORITHM.md](docs/SIMULATION_ALGORITHM.md)** を参照してください。

## 臓器モデル (`src/organs/`)

| 臓器 | modelKey | 数理モデル |
|------|----------|-----------|
| 心臓 | `windkessel_three_element` | 三要素 Windkessel + Frank-Starling |
| 肺 | `alveolar_gas_exchange` | 肺胞気方程式・分時換気量 |
| 膵臓 | `bergman_minimal` | Bergman 最小モデル（糖代謝 ODE） |
| 肝臓 | `hepatic_glucose_production` | 肝糖新生 (HGP) |
| 腎臓 | `renal_autoregulation_gfr` | 腎自己調節・GFR + TGF |
| 骨格筋 | `muscle_protein_turnover` | タンパク質合成/分解動態 |
| 脳 | `cerebral_metabolic_rate` | CMRO2 + 脳血流 |
| 脂肪組織 | `hall_energy_balance` | Hall エネルギー平衡 |

## 参考文献 (`src/reference/`)

数理モデルと引用論文の一覧は **`GET /reference`** で取得できます。

主な引用文献:
- Bergman R.N. et al. (1981) — Bergman 最小モデル
- Westerhof N. et al. (2009) — Windkessel モデル
- Hall K.D. et al. (2011) Lancet — エネルギー平衡
- Sgouralis I. & Layton A.T. (2014) — 腎血流動態
- Phillips S.M. et al. (1997) — 筋タンパク質合成

## プロジェクト構成

```
src/
├── main.ts                 # Worker エントリポイント
├── app.module.ts
├── auth/api-key.guard.ts   # API キー認証
├── config/env.service.ts
├── openai/openai.service.ts
├── organs/                 # 臓器数理モデル（シミュレーションで使用）
│   ├── models/             # 各臓器の ODE / 代数モデル
│   ├── simulation-engine.ts
│   └── registry.ts
├── reference/              # 数理モデル・論文カタログ
├── purpose/                # /purpose
├── simulation/             # /simulate
└── recommendations/        # /recommendations
```

## curl 例

```bash
curl -X POST http://localhost:8787/purpose \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"purpose":"マラソン完走を目指したい"}'
```
