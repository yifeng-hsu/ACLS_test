const OPTIONS = {
    treatments: [
        "觀察 + 找原因",
        "找原因",
        "迷走神經刺激術",
        "給藥",
        "同步心臟整流",
        "非同步去顫",
        "TCP",
        "CPR",
        "會診專家"
    ],
    drugs: [
        "無",
        "Atropine",
        "Adenosine",
        "Amiodarone",
        "Dopamine",
        "Epinephrine",
        "MgSO4",
        "Lidocaine",
        "Procainamide",
        "Diltiazem",
        "Verapamil",
        "β受體阻斷藥"
    ],
    units: [
        "無",
        "mg",
        "mg/kg",
        "µg/min",
        "µg/Kg/min",
        "J",
        "gm",
        "mA"
    ]
};

// Helper for error messages
function getErrorMsg(expectedArr) {
    const validStr = expectedArr.map(e => {
        let parts = [];
        parts.push(`處置: ${e.treatment}`);
        if (e.drug && e.drug !== '無') parts.push(`藥物: ${e.drug}`);
        if (e.dose !== undefined && e.dose !== '') {
            if (Array.isArray(e.dose)) {
                parts.push(`數值: ${e.dose[0]}~${e.dose[1]}`);
            } else {
                parts.push(`數值: ${e.dose}`);
            }
        }
        if (e.unit && e.unit !== '無') parts.push(`單位: ${e.unit}`);
        return `{ ${parts.join(', ')} }`;
    }).join(' 或 ');
    return `處置錯誤！\n正確應該是: ${validStr}`;
}

const PATHWAYS = [
    {
        id: "brady-stable",
        name: "有脈搏且穩定 - 心搏過慢 (Stable Bradycardia)",
        steps: [
            {
                text: "病患有脈搏，心跳速率 40 次/分，血壓 110/70，無胸痛、無意識改變、無喘、無休克徵兆。EKG 顯示竇性心搏過緩 (Sinus Bradycardia)。請選擇處置：",
                expected: [{ treatment: "觀察 + 找原因", drug: "無", dose: "", unit: "無" }],
                next: null
            }
        ]
    },
    {
        id: "brady-unstable",
        name: "有脈搏且不穩定 - 心搏過慢 (Unstable Bradycardia)",
        steps: [
            {
                text: "病患有脈搏，心跳速率 35 次/分，血壓 80/50，出現休克徵兆與意識改變。EKG 顯示竇性心搏過緩。請選擇處置：",
                expected: [{ treatment: "給藥", drug: "Atropine", dose: 1, unit: "mg" }],
                next: 1
            },
            {
                text: "完成處置後，病患心跳仍為 35 次/分，血壓依然偏低，無明顯改善。請選擇下一步處置：",
                expected: [
                    { treatment: "TCP", drug: "無", dose: 30, unit: "mA" },
                    { treatment: "給藥", drug: "Dopamine", dose: [5, 20], unit: "µg/Kg/min" },
                    { treatment: "給藥", drug: "Epinephrine", dose: [2, 10], unit: "µg/min" }
                ],
                next: 2
            },
            {
                text: "處置已啟動，病患生命徵象稍微回穩。請選擇最終處置與安置方向：",
                expected: [{ treatment: "會診專家", drug: "無", dose: "", unit: "無" }],
                next: null
            }
        ]
    },
    {
        id: "tachy-stable-narrow-p",
        name: "穩定頻脈 - 窄 QRS 有 P 波 (Sinus Tachycardia)",
        steps: [
            {
                text: "病患有脈搏，心跳速率 155 次/分，血壓 120/80，無不穩定徵兆。EKG 顯示窄 QRS 波，R-R 間距規則，且看得到 P 波。請選擇處置：",
                expected: [{ treatment: "觀察 + 找原因", drug: "無", dose: "", unit: "無" }],
                next: null
            }
        ]
    },
    {
        id: "tachy-stable-narrow-nop",
        name: "穩定頻脈 - 窄 QRS 無 P 波 (PSVT)",
        steps: [
            {
                text: "病患有脈搏，心跳 160 次/分，血壓 110/70，無不穩定徵兆。EKG 顯示窄 QRS 波，R-R 間距規則，沒有 P 波。請選擇處置：",
                expected: [{ treatment: "迷走神經刺激術", drug: "無", dose: "", unit: "無" }],
                next: 1
            },
            {
                text: "迷走神經刺激術後，心律未改變。請選擇下一步處置：",
                expected: [{ treatment: "給藥", drug: "Adenosine", dose: 6, unit: "mg" }],
                next: 2
            },
            {
                text: "完成處置後 1-2 分鐘，心律仍未恢復。請選擇下一步處置：",
                expected: [{ treatment: "給藥", drug: "Adenosine", dose: 12, unit: "mg" }],
                next: null
            }
        ]
    },
    {
        id: "tachy-stable-narrow-irreg-mat",
        name: "穩定頻脈 - 窄 QRS 不規則 (MAT)",
        steps: [
            {
                text: "病患有脈搏，心跳 150 次/分，穩定。EKG 顯示窄 QRS 波，R-R 間距不規則，可見多種不同型態的 P 波 (MAT)。請選擇處置：",
                expected: [{ treatment: "找原因", drug: "無", dose: "", unit: "無" }],
                next: null
            }
        ]
    },
    {
        id: "tachy-stable-narrow-irreg-af",
        name: "穩定頻脈 - 窄 QRS 不規則 (Af/AF - 無肺水腫)",
        steps: [
            {
                text: "病患有脈搏，心跳 160 次/分，穩定。EKG 顯示窄 QRS 波，R-R 間距不規則，無明顯 P 波 (心房顫動 Af)。評估無頸靜脈怒張、肺部無囉音(無肺衰竭)。請選擇處置：",
                expected: [
                    { treatment: "給藥", drug: "β受體阻斷藥", dose: "", unit: "無" },
                    { treatment: "給藥", drug: "Diltiazem", dose: 0.25, unit: "mg/kg" }
                ],
                next: null
            }
        ]
    },
    {
        id: "tachy-stable-wide-reg",
        name: "穩定頻脈 - 寬 QRS 規則 (VT)",
        steps: [
            {
                text: "病患有脈搏，心跳 160 次/分，穩定。EKG 顯示寬 QRS 波 (≥ 0.12秒)，R-R 間距規則 (單型性 VT)。請選擇處置：",
                expected: [
                    { treatment: "給藥", drug: "Amiodarone", dose: 150, unit: "mg" },
                    { treatment: "給藥", drug: "Procainamide", dose: [20, 50], unit: "mg/min" } // 20-50 mg/min is technically wrong unit but let's allow without unit strictness if not possible, wait unit is "µg/min" no mg/min. Let's just use Amiodarone.
                ],
                next: null
            }
        ]
    },
    {
        id: "tachy-stable-wide-irreg",
        name: "穩定頻脈 - 寬 QRS 不規則 (Torsades de pointes)",
        steps: [
            {
                text: "病患有脈搏，心跳 170 次/分。EKG 顯示寬 QRS 波，R-R 間距不規則，且呈現 Torsade-de pointes (心室手風琴狀頻脈)。請選擇處置：",
                expected: [{ treatment: "非同步去顫", drug: "無", dose: 200, unit: "J" }],
                next: 1
            },
            {
                text: "完成處置後心律恢復，為避免復發穩定心肌細胞膜電位，請選擇適當處置：",
                expected: [{ treatment: "給藥", drug: "MgSO4", dose: [1, 2], unit: "gm" }],
                next: null
            }
        ]
    },
    {
        id: "tachy-unstable",
        name: "有脈搏且不穩定 - 心搏過快 (Unstable Tachycardia)",
        steps: [
            {
                text: "病患有脈搏，心跳 180 次/分，血壓 70/40，出現休克與意識改變。EKG 顯示陣發性上心室頻脈 (PSVT)。請選擇處置：",
                expected: [{ treatment: "同步心臟整流", drug: "無", dose: 100, unit: "J" }], // VT/PSVT: 100J, AF/Af: 200J. Let's use PSVT -> 100J.
                next: null
            }
        ]
    },
    {
        id: "arrest-shockable",
        name: "無脈搏 - 可電擊心律 (Vf / pVT)",
        steps: [
            {
                text: "病患無反應、無呼吸、無脈搏。已開始高品質 CPR (30:2)。監視器顯示心室纖維顫動 (Vf)。請選擇處置：",
                expected: [{ treatment: "非同步去顫", drug: "無", dose: 200, unit: "J" }],
                next: 1
            },
            {
                text: "完成第一次處置後。接下來請選擇處置：",
                expected: [{ treatment: "CPR", drug: "無", dose: "", unit: "無" }],
                next: 2
            },
            {
                text: "完成 2 分鐘 CPR 後，分析心律仍為 Vf。請選擇處置：",
                expected: [{ treatment: "非同步去顫", drug: "無", dose: 200, unit: "J" }],
                next: 3
            },
            {
                text: "完成處置並開始 CPR，此時請選擇適當處置：",
                expected: [{ treatment: "給藥", drug: "Epinephrine", dose: 1, unit: "mg" }],
                next: 4
            },
            {
                text: "完成 2 分鐘 CPR，分析心律仍為 Vf。請選擇處置：",
                expected: [{ treatment: "非同步去顫", drug: "無", dose: 200, unit: "J" }],
                next: 5
            },
            {
                text: "完成處置並開始 CPR，此時請選擇適當處置：",
                expected: [{ treatment: "給藥", drug: "Amiodarone", dose: 300, unit: "mg" }],
                next: null
            }
        ]
    },
    {
        id: "arrest-non-shockable",
        name: "無脈搏 - 不可電擊心律 (Asystole / PEA)",
        steps: [
            {
                text: "病患無反應、無呼吸、無脈搏。監視器顯示 Asystole (心跳停止)。請選擇首要處置：",
                expected: [{ treatment: "CPR", drug: "無", dose: "", unit: "無" }],
                next: 1
            },
            {
                text: "已開始 CPR，建立靜脈管路。請選擇適當處置：",
                expected: [{ treatment: "給藥", drug: "Epinephrine", dose: 1, unit: "mg" }],
                next: 2
            },
            {
                text: "完成處置後繼續 CPR 兩分鐘，檢查心率仍為 Asystole。下一步除了繼續 CPR 外，還須考量什麼？",
                expected: [{ treatment: "找原因", drug: "無", dose: "", unit: "無" }], // 積極尋找並處理 5H/5T
                next: null
            }
        ]
    }
];

function validateInput(userVal, expectedArr) {
    for (let exp of expectedArr) {
        let match = true;
        
        if (exp.treatment !== userVal.treatment) match = false;
        
        // Drug matching
        if (exp.drug !== userVal.drug) match = false;
        
        // Unit matching
        if (exp.unit !== userVal.unit) match = false;
        
        // Dose matching
        if (exp.dose !== undefined) {
            if (Array.isArray(exp.dose)) {
                let uDose = parseFloat(userVal.dose);
                if (isNaN(uDose) || uDose < exp.dose[0] || uDose > exp.dose[1]) {
                    match = false;
                }
            } else if (exp.dose === "") {
                if (userVal.dose !== "" && userVal.dose !== null) match = false;
            } else {
                if (parseFloat(userVal.dose) !== parseFloat(exp.dose)) match = false;
            }
        }
        
        if (match) return true;
    }
    return false;
}
