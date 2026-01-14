"use strict";

const App = {
    selector: null,
    allStatusDivs: null,
    raritySelector: null,
    rarityValues: null,
    finalOutput: null,

    mainKiBonus: 1,
    followUpKiBonus: 1,
    mainSuperPower: 0,
    followUpSuperPower: 0,
    mainSuperAddEffect: 0,
    followUpSuperAddEffect: 0,
    baseStat: 0,
    leaderSkillMul: 1,
    addPassiveMul: 1,
    mulPassiveMul: 1,
    linkSkillMul: 1,
    activeSkillMul: 1,
    fieldSkillMul: 1,
    supportMul: 1,
    followUpList: [],
    currentKiBonus: 0,
    superAdjustTotal: 0,
    finalValues: [],

    init() {
        // DOM要素の取得
        this.selector = document.getElementById("statusSelector");
        this.allStatusDivs = document.querySelectorAll("[data-hide]");
        this.raritySelector = document.getElementById("raritySelect");
        this.finalOutput = document.getElementById("values");

        this.rarityValues = {
            LR: { maxVitalityBonus: 2, minVitalityBonus: 1.5, SuperSpecialMove: 570, StandardSpecialMove: 425 },
            フェスUR: { maxVitalityBonus: 1.5, minVitalityBonus: 1.5, SuperSpecialMove: 505, StandardSpecialMove: 505 },
            通常UR: { maxVitalityBonus: 1.4, minVitalityBonus: 1.4, SuperSpecialMove: 430, StandardSpecialMove: 430 },
            イベントUR: { maxVitalityBonus: 1.3, minVitalityBonus: 1.3, SuperSpecialMove: 430, StandardSpecialMove: 430 },
            LR極限: { maxVitalityBonus: 2, minVitalityBonus: 1.5, SuperSpecialMove: 620, StandardSpecialMove: 450 },
            フェスUR極限: { maxVitalityBonus: 1.5, minVitalityBonus: 1.5, SuperSpecialMove: 630, StandardSpecialMove: 630 },
            通常UR極限: { maxVitalityBonus: 1.4, minVitalityBonus: 1.4, SuperSpecialMove: 530, StandardSpecialMove: 530 },
            イベントUR極限: { maxVitalityBonus: 1.3, minVitalityBonus: 1.3, SuperSpecialMove: 530, StandardSpecialMove: 530 },
        };

        this.statusInitialHTML = new Map();

        document.querySelectorAll(".status").forEach(status => {
            this.statusInitialHTML.set(status, status.innerHTML);
        });

        // イベントリスナー
        this.selector?.addEventListener("change", () => this.firstUpdate());
        this.raritySelector?.addEventListener("change", () => this.firstUpdate());

        // helpButton
        const helpButton = document.getElementById("helpButton");
        if (helpButton) {
            helpButton.addEventListener("click", e => {
                e.preventDefault();
                window.open("help.html", "_blank");
            });
        }

        document.addEventListener("input", e => {
            if (e.target.matches(".status input")) {
                this.update();
            }
        });

        document.addEventListener("focusin", e => {
            if (e.target.matches(".status input")) {
                e.target.select();
            }
        });

        this.update(); // 初回計算
    },

    updateVisibility() {
        if (!this.selector) return;

        const selected = this.selector.value;

        this.allStatusDivs.forEach(div => {
            if (div.dataset.hide === selected) {
                div.classList.add("hidden");

                const initialHTML = this.statusInitialHTML.get(div);
                if (initialHTML !== undefined) {
                    div.innerHTML = initialHTML;
                }
            } else {
                div.classList.remove("hidden");
            }
        });
    },

    updateRarity() {
        if (!this.raritySelector) return;

        const selectedRarity = this.raritySelector.value;
        const raritySet = this.rarityValues[selectedRarity];

        // LR専用表示
        const lrOnlyInputs = document.querySelectorAll("[data-visible-for='LR']");
        lrOnlyInputs.forEach(input => {
            const parent = input.closest(".status") || input;
            if (selectedRarity === "LR" || selectedRarity === "LR極限") {
                parent.classList.remove("hidden");
            } else {
                parent.classList.add("hidden");
            }
        });

        // レアリティ値反映
        document.querySelectorAll(".status input").forEach(input => {
            const key = input.dataset.rarityKey;
            if (key && raritySet[key] !== undefined) {
                input.value = raritySet[key];
            }
        });
    },

    calculateFinal() {
        this.reset();

        document.querySelectorAll(".status input").forEach(input => {
            const key = input.dataset.key;
            const val = Number(input.value) || 0;

            /* ==========
                入力値集計
                ========== */
            switch (key) {
                case "Status": this.baseStat += val; break;
                case "LeaderSkill": this.leaderSkillMul += val / 100; break;
                case "FieldSkill": this.fieldSkillMul += val / 100; break;
                case "AdditionPassive": this.addPassiveMul += val / 100; break;
                case "MultiplicationPassive": this.mulPassiveMul += val / 100; break;
                case "LinkSkill": this.linkSkillMul += val / 100; break;
                case "maxVitalityBonus": this.mainKiBonus = val; break;
                case "minVitalityBonus": this.followUpKiBonus = val; break;
                case "SuperSpecialMove": this.mainSuperPower += val / 100; break;
                case "StandardSpecialMove": this.followUpSuperPower += val / 100; break;
                case "SpecialMoveAdjustment": this.superAdjustTotal += val / 100; break;
                case "StandardSpecialAdditionalEffect": this.followUpSuperAddEffect += val / 100; break;
                case "SuperSpecialMoveAdditionalEffect": this.mainSuperAddEffect += val / 100; break;
                case "ActionSkill": this.activeSkillMul += val / 100; break;
                case "SupportMemory": this.supportMul += val / 100; break;
                case "SupportItem": this.supportMul += val / 100; break;
            }
        });

        /* ==========
            追撃リスト生成
            ========== */
        const followUpInputs = document.querySelectorAll(
            'input[data-key="FollowUpType"]'
        );

        this.followUpList = Array.from(followUpInputs).map(input => ({
            isSuper: input.checked
        }));

        /* ==========
            共通ベース値
            ========== */
        const baseValue = Math.floor(
            this.baseStat
            * this.leaderSkillMul
            * this.fieldSkillMul
            * this.addPassiveMul
            * this.mulPassiveMul
            * this.supportMul
            * this.activeSkillMul
            * this.linkSkillMul
        );

        if (this.selector?.value === "ATK") {
            // 1発目
            this.currentKiBonus = this.mainKiBonus;
            this.superAdjustTotal += this.mainSuperAddEffect;

            let finalSuperMul =
                this.mainSuperPower + this.superAdjustTotal;

            this.pushFinalValue(baseValue, finalSuperMul, this.currentKiBonus);

            /* ==========
                追撃処理（順序通り）
                ========== */
            const selectedRarity = this.raritySelector?.value;
            this.followUpList.forEach(followUp => {

                let baseSuperPower;

                if (followUp.isSuper) {
                    // 必殺追撃
                    if (selectedRarity === "LR" || selectedRarity === "LR極限") {
                        this.currentKiBonus = this.followUpKiBonus;
                        this.superAdjustTotal += this.followUpSuperAddEffect;
                        baseSuperPower = this.followUpSuperPower;
                    } else {
                        this.currentKiBonus = this.mainKiBonus;
                        this.superAdjustTotal += this.mainSuperAddEffect;
                        baseSuperPower = this.mainSuperPower;
                    }
                } else {
                    // 通常追撃
                    this.currentKiBonus = this.mainKiBonus;
                    baseSuperPower = 1;
                }

                finalSuperMul = baseSuperPower + this.superAdjustTotal;

                this.pushFinalValue(baseValue, finalSuperMul, this.currentKiBonus);
            });
        } else if (this.selector?.value === "DEF") {
            const baseValue = Math.floor(
                this.baseStat
                * this.leaderSkillMul
                * this.fieldSkillMul
                * this.addPassiveMul
                * this.mulPassiveMul
                * this.supportMul
                * this.activeSkillMul
                * this.linkSkillMul
            );
            this.pushFinalValue(baseValue, 1, 1);
        }

        this.renderOutput();
    },

    pushFinalValue(baseValue, superMul, kiBonus) {
        const finalValue = Math.floor(
            baseValue
            * superMul
            * kiBonus
        );

        this.finalValues.push(finalValue);
    },

    renderOutput() {
        if (!this.finalOutput) return;

        this.finalOutput.innerHTML = this.finalValues.map((val, i) =>
            `${this.formatNumberWithUnits(val)}${i < this.finalValues.length - 1 ? ", <br>" : ""}`
        ).join("");

        if (this.selector?.value === "ATK") {
            const criticalRate = Number(document.getElementById("criticalRate")?.value || 0) / 100;
            const isEffective = document.getElementById("effectiveCheckbox")?.checked || false;
            let total = this.finalValues.reduce((a, b) => a + b, 0);

            if (isEffective) {
                total *= 1.5;
                total *= (1 + 0.25 * criticalRate);
            } else {
                total *= (1 + 0.875 * criticalRate);
            }

            const totalDamage = document.getElementById("totalDamage");
            if (totalDamage) totalDamage.innerHTML = this.formatNumberWithUnits(Math.round(total));
        }

        if (this.selector?.value === "DEF") {
            const enemyATK = (Number(document.getElementById("enemyATK")?.value) || 0) * 10000;
            const reductionRate = Number(document.getElementById("reductionRate")?.value) / 100;
            const allGuard = document.getElementById("allGuard")?.checked || false;

            const baseValue = this.finalValues.reduce((a, b) => a + b, 0);

            let damage = enemyATK * (1 - reductionRate);
            if (allGuard) damage *= 0.8;

            damage -= baseValue;
            if (allGuard) damage *= 0.5;

            if (damage <= 0) damage = 0;

            const damageTaken = document.getElementById("damageTaken");
            if (damageTaken) damageTaken.innerHTML = this.formatNumberWithUnits(Math.round(damage));
        }
    },

    formatNumberWithUnits(value) {
        if (isNaN(value)) return value;

        if (value >= 100000000) {
            const oku = Math.floor(value / 100000000);
            const man = Math.floor((value % 100000000) / 10000);
            const remainder = value % 10000;

            return `<span class="oku">${oku}</span><span class="oku">億</span>` +
                (man > 0 ? `<span class="man">${man}</span><span class="man">万</span>` : "") +
                (remainder > 0 ? `<span>${remainder}</span>` : "");
        } else if (value >= 10000) {
            const man = Math.floor(value / 10000);
            const remainder = value % 10000;
            return `${man}<span class="unit-man">万</span>${remainder > 0 ? remainder : ""}`;
        } else {
            return `<span>${value}</span>`;
        }
    },

    reset() {
        this.mainKiBonus = 1;
        this.followUpKiBonus = 1;
        this.mainSuperPower = 0;
        this.followUpSuperPower = 0;
        this.mainSuperAddEffect = 0;
        this.followUpSuperAddEffect = 0;

        this.baseStat = 0;
        this.leaderSkillMul = 1;
        this.addPassiveMul = 1;
        this.mulPassiveMul = 1;
        this.linkSkillMul = 1;
        this.activeSkillMul = 1;
        this.fieldSkillMul = 1;
        this.supportMul = 1;

        this.currentKiBonus = 1;
        this.superAdjustTotal = 0;
        this.followUpList = [];

        this.finalValues = [];
    },

    selectUpdate() {
        this.calculateFinal();
    },

    update() {
        this.calculateFinal();
    },

    firstUpdate() {
        this.updateVisibility();
        this.updateRarity();
        this.calculateFinal();
    }
};

export default App;

// ページロード時に初期化
window.addEventListener("DOMContentLoaded", () => {
    App.init();
});