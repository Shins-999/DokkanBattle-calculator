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
    superAdjustTotal: 0,
    criticalRate: 0,
    reductionRate: 0,
    finalValues: [],

    init() {
        // DOM要素の取得
        this.selector = document.getElementById("statusSelector");
        this.allStatusDivs = document.querySelectorAll("[data-hide]");
        this.raritySelector = document.getElementById("raritySelect");
        this.finalOutput = document.getElementById("values");
        this.onActiveSkillCheckbox = document.getElementById("OnActiveSkillCheckbox");

        this.onActiveSkillCheckbox?.addEventListener("change", () => this.selectUpdate());

        this.rarityValues = {
            LR: { mainKiBonus: 2, followUpKiBonus: 1.5, mainSuperPower: 570, followUpSuperPower: 425 },
            フェスUR: { mainKiBonus: 1.5, followUpKiBonus: 1.5, mainSuperPower: 505, followUpSuperPower: 505 },
            通常UR: { mainKiBonus: 1.4, followUpKiBonus: 1.4, mainSuperPower: 430, followUpSuperPower: 430 },
            イベントUR: { mainKiBonus: 1.3, followUpKiBonus: 1.3, mainSuperPower: 430, followUpSuperPower: 430 },
            LR極限: { mainKiBonus: 2, followUpKiBonus: 1.5, mainSuperPower: 620, followUpSuperPower: 450 },
            フェスUR極限: { mainKiBonus: 1.5, followUpKiBonus: 1.5, mainSuperPower: 630, followUpSuperPower: 630 },
            通常UR極限: { mainKiBonus: 1.4, followUpKiBonus: 1.4, mainSuperPower: 530, followUpSuperPower: 530 },
            イベントUR極限: { mainKiBonus: 1.3, followUpKiBonus: 1.3, mainSuperPower: 530, followUpSuperPower: 530 },
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

        // saveButton
        const openBtn = document.getElementById("openSaveModal");
        const closeBtn = document.getElementById("closeSaveModal");
        const saveModal = document.getElementById("saveModal");

        openBtn?.addEventListener("click", e => {
            e.preventDefault();
            saveModal.classList.remove("hidden");
        })

        closeBtn?.addEventListener("click", () => {
            saveModal.classList.add("hidden");
        })

        saveModal?.addEventListener("click", (e) => {
            if (e.target === saveModal) {
                saveModal.classList.add("hidden");
            }
        })

        // save/load 処理
        document.querySelectorAll(".slot").forEach(slot => {
            const index = slot.dataset.slotIndex;
            const nameInput = slot.querySelector(".slot-name");
            const saveBtn = slot.querySelector(".save-btn");
            const loadBtn = slot.querySelector(".load-btn");

            // スロット名復元
            const savedName = localStorage.getItem(`save-slot-name-${index}`);
            if (savedName) nameInput.value = savedName;

            nameInput.addEventListener("change", () => {
                localStorage.setItem(`save-slot-name-${index}`, nameInput.value);
            });

            saveBtn.addEventListener("click", () => {
                const data = this.getSaveData();
                localStorage.setItem(`save-slot-${index}`, JSON.stringify(data));
                alert("セーブ完了");
            });

            loadBtn.addEventListener("click", () => {
                const raw = localStorage.getItem(`save-slot-${index}`);
                if (!raw) {
                    alert("データがありません");
                    return;
                }
                const data = JSON.parse(raw);
                this.loadSaveData(data);
                alert("ロード完了");
            });
        });

        // 入力ボックスの登録
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
        const isActive = this.onActiveSkillCheckbox?.checked;
        const selectedRarity = this.raritySelector?.value || "";

        this.allStatusDivs.forEach(div => {
            const hideTokens = (div.dataset.hide || "").split(/\s+/).filter(Boolean);
            const visibleFor =
                div.dataset.visibleFor ||
                div.querySelector("[data-visible-for]")?.dataset.visibleFor ||
                "";
            const isVisibleForRarity = !visibleFor || selectedRarity.includes(visibleFor);
            const shouldHide =
                hideTokens.includes(selected) ||
                (isActive && hideTokens.includes("Active")) ||
                (!isActive && hideTokens.includes("NonActive")) ||
                !isVisibleForRarity;

            if (shouldHide) {
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
        if (this.selector?.value === "DEF") return;

        const selectedRarity = this.raritySelector.value;

        // LR専用表示
        const lrOnlyInputs = document.querySelectorAll("[data-visible-for='LR']");
        lrOnlyInputs.forEach(input => {
            const parent = input.closest(".status") || input;
            if (selectedRarity.includes("LR")) {
                parent.classList.remove("hidden");
            } else {
                parent.classList.add("hidden");
            }
        });
    },

    applyRarityDefaults() {
        if (!this.raritySelector) return;
        if (this.selector?.value === "DEF") return;

        const selectedRarity = this.raritySelector.value;
        const raritySet = this.rarityValues[selectedRarity];
        if (!raritySet) return;

        document.querySelectorAll(".status input").forEach(input => {
            const key = input.dataset.rarityKey;
            if (!key || raritySet[key] === undefined) return;
            if (this.selector?.value === "ATK") {
                input.value = raritySet[key];
            }
        })
    },

    calculateFinal() {
        this.reset();

        const selectedRarity = this.raritySelector.value;

        document.querySelectorAll(".status input").forEach(input => {
            const key = input.dataset.key;
            const val = Number(input.value) || 0;

            /* ==========
                入力値集計
                ========== */
            switch (key) {
                case "baseStat":
                    this.baseStat += val;
                    break;

                case "leaderSkillMul":
                    this.leaderSkillMul += val / 100;
                    break;

                case "fieldSkillMul":
                    this.fieldSkillMul += val / 100;
                    break;

                case "addPassiveMul":
                    this.addPassiveMul += val / 100;
                    break;

                case "mulPassiveMul":
                    this.mulPassiveMul += val / 100;
                    break;

                case "linkSkillMul":
                    this.linkSkillMul += val / 100;
                    break;

                case "mainKiBonus":
                    this.mainKiBonus = val;
                    break;

                case "followUpKiBonus":
                    if (selectedRarity.includes("LR")) {
                        this.followUpKiBonus = val;
                    }
                    break;

                case "mainSuperPower":
                    this.mainSuperPower += val / 100;
                    break;

                case "followUpSuperPower":
                    if (selectedRarity.includes("LR")) {
                        this.followUpSuperPower += val / 100;
                    }
                    break;

                case "superAdjustTotal":
                    this.superAdjustTotal += val / 100;
                    break;

                case "mainSuperAddEffect":
                    this.mainSuperAddEffect += val / 100;
                    break;

                case "followUpSuperAddEffect":
                    if (selectedRarity.includes("LR")) {
                        this.followUpSuperAddEffect += val / 100;
                    }
                    break;

                case "activeSkillMul":
                    this.activeSkillMul += val / 100;
                    break;

                case "supportMemoryMul":
                    this.supportMul += val / 100;
                    break;

                case "supportItemMul":
                    this.supportMul += val / 100;
                    break;

                case "activeSkillPower":
                    if (this.onActiveSkillCheckbox?.checked) {
                        this.activeSkillMul += (val / 100) - 1
                    };
                    break;

                case "criticalRate":
                    this.criticalRate += val / 100;
                    break;

                case "reductionRate":
                    this.reductionRate += val / 100;
                    break;
            }
        });

        if (!selectedRarity.includes("LR")) {
            this.followUpKiBonus = this.mainKiBonus;
            this.followUpSuperPower = this.mainSuperPower;
            this.followUpSuperAddEffect = this.mainSuperAddEffect;
        }

        /* ==========
            追撃リスト生成
            ========== */
        const followUpInputs = document.querySelectorAll(
            'input[data-key="FollowUp"]'
        );

        this.followUpList = Array.from(followUpInputs).map(input => ({
            isSuper: input.checked
        }));
        /* ==========
            共通ベース値
            ========== */
        let baseNum = Math.floor(this.baseStat * this.leaderSkillMul)
        console.log("baseStat:", this.baseStat, "leaderSkillMul:", this.leaderSkillMul, "baseNum:", baseNum);
        baseNum = Math.floor(baseNum * this.fieldSkillMul);
        console.log("baseNum after fieldSkillMul:", baseNum, "fieldSkillMul:", this.fieldSkillMul);
        baseNum = Math.floor(baseNum * this.addPassiveMul);
        console.log("baseNum after addPassiveMul:", baseNum, "addPassiveMul:", this.addPassiveMul);
        baseNum = Math.floor(baseNum * this.mulPassiveMul);
        console.log("baseNum after mulPassiveMul:", baseNum, "mulPassiveMul:", this.mulPassiveMul);
        baseNum = Math.floor(baseNum * this.supportMul);
        console.log("baseNum after supportMul:", baseNum, "supportMul:", this.supportMul);
        baseNum = Math.floor(baseNum * this.activeSkillMul);
        console.log("baseNum after activeSkillMul:", baseNum, "activeSkillMul:", this.activeSkillMul);
        baseNum = Math.floor(baseNum * this.linkSkillMul);
        console.log("baseNum after linkSkillMul:", baseNum, "linkSkillMul:", this.linkSkillMul);
        const baseValue = baseNum;

        let currentKiBonus = 1;
        let currentSuperAdjust = this.superAdjustTotal;

        if (this.selector?.value === "ATK") {
            // 1発目
            currentKiBonus = this.mainKiBonus;
            currentSuperAdjust += this.mainSuperAddEffect;

            let finalSuperMul = this.mainSuperPower + currentSuperAdjust;

            this.pushFinalValue(baseValue, finalSuperMul, currentKiBonus);

            /* ==========
                追撃処理（順序通り）
                ========== */
            const selectedRarity = this.raritySelector?.value;
            this.followUpList.forEach(followUp => {

                let baseSuperMul

                if (followUp.isSuper) {
                    // 必殺追撃
                    currentKiBonus = this.followUpKiBonus;
                    currentSuperAdjust += this.followUpSuperAddEffect;
                    baseSuperMul = this.followUpSuperPower;
                } else {
                    // 通常追撃
                    currentKiBonus = this.followUpKiBonus;
                    baseSuperMul = 1;
                }

                finalSuperMul = baseSuperMul + currentSuperAdjust;

                this.pushFinalValue(baseValue, finalSuperMul, currentKiBonus);
            });
        } else if (this.selector?.value === "DEF") {
            const finalSuperMul = 1 + this.superAdjustTotal;

            this.pushFinalValue(baseValue, finalSuperMul, 1);
        }

        this.renderOutput();
    },

    pushFinalValue(baseValue, superMul, kiBonus) {
        let finalValue = Math.floor(baseValue * superMul);
        finalValue = Math.floor(finalValue * kiBonus);

        this.finalValues.push(finalValue);
    },

    renderOutput() {
        if (!this.finalOutput) return;

        this.finalOutput.innerHTML = this.finalValues.map((val, i) =>
            `${this.formatNumberWithUnits(val)}${i < this.finalValues.length - 1 ? ", <br>" : ""}`
        ).join("");

        if (this.selector?.value === "ATK") {
            const isEffective = document.getElementById("effectiveCheckbox")?.checked || false;
            let total = this.finalValues.reduce((a, b) => a + b, 0);

            this.criticalRate = Math.min(this.criticalRate, 1);

            if (isEffective) {
                total *= 1.5;
                total *= (1 + 0.25 * this.criticalRate);
            } else {
                total *= (1 + 0.875 * this.criticalRate);
            }

            const totalDamage = document.getElementById("totalDamage");
            if (totalDamage) totalDamage.innerHTML = this.formatNumberWithUnits(Math.round(total));
        }

        if (this.selector?.value === "DEF") {
            const enemyATK = (Number(document.getElementById("enemyATK")?.value) || 0) * 10000;
            const allGuard = document.getElementById("allGuard")?.checked || false;

            const baseValue = this.finalValues.reduce((a, b) => a + b, 0);

            let damage = enemyATK * (1 - this.reductionRate);
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

        this.criticalRate = 0;
        this.reductionRate = 0;

        this.finalValues = [];
    },

    selectUpdate() {
        this.updateRarity();
        this.updateVisibility();
        this.calculateFinal();
    },

    update() {
        this.calculateFinal();
    },

    firstUpdate() {
        this.updateRarity();
        this.updateVisibility();
        this.applyRarityDefaults();
        this.calculateFinal();
    },

    // save/load 機能

    getSaveData() {
        const groups = {};

        document.querySelectorAll(".status[data-input-group]").forEach(status => {
            const group = status.dataset.inputGroup;
            const values = [];

            status.querySelectorAll("input").forEach(input => {
                if (input.type === "checkbox") {
                    values.push(input.checked);
                } else {
                    values.push(input.value);
                }
            });

            groups[group] = values;
        });

        return {
            selector: this.selector?.value,
            rarity: this.raritySelector?.value,
            groups
        };
    },

    loadSaveData(data) {
        if (!data) return;

        this.selector.value = data.selector;
        this.raritySelector.value = data.rarity;

        this.firstUpdate(); // ← ここでDOM初期化

        Object.entries(data.groups).forEach(([group, values]) => {
            const status = document.querySelector(`.status[data-input-group="${group}"]`);
            if (!status) return;

            const form = status.querySelector("form");
            if (!form) return;

            // 最初の1個を残して削除
            const inputs = form.querySelectorAll(".input-box");
            inputs.forEach((box, i) => {
                if (i > 0) box.remove();
            });

            // 2個目以降を再生成
            for (let i = 1; i < values.length; i++) {
                // inputBox.js の関数を使う前提
                window.addInputBoxForSave?.(group);
            }

            // 値を流し込む
            form.querySelectorAll("input").forEach((input, i) => {
                if (input.type === "checkbox") {
                    input.checked = !!values[i];
                } else {
                    input.value = values[i];
                }
            });
        });

        this.calculateFinal();
    },

    getUniqueSelector(el) {
        if (el.id) return `#${el.id}`;

        const path = [];
        while (el && el.nodeType === 1 && el !== document.body) {
            let selector = el.tagName.toLowerCase();
            if (el.className) {
                selector += "." + [...el.classList].join(".");
            }
            path.unshift(selector);
            el = el.parentElement;
        }
        return path.join(" > ");
    }
};

export default App;

// ページロード時に初期化
window.addEventListener("DOMContentLoaded", () => {
    App.init();
    App.firstUpdate();
});
