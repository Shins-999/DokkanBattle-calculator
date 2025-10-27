"use strict";
window.addEventListener("DOMContentLoaded", () => {
    const inputs = document.querySelectorAll(".status input");

    const selector = document.getElementById("statusSelector");
    const allStatusDivs = document.querySelectorAll("[data-hide]");

    const raritySelector = document.getElementById("raritySelect");
    const rarityValues = {
        LR: { maxVitalityBonus: 2, minVitalityBonus: 1 },
        fesUR: { maxVitalityBonus: 1.5, minVitalityBonus: 1 },
        normalUR: { maxVitalityBonus: 1.4, minVitalityBonus: 1 },
        eventUR: { maxVitalityBonus: 1.3, minVitalityBonus: 1 }
    };


    let maxVitalityBonus = 1;
    let minVitalityBonus = 1;
    let SuperSpecialMove = 1;
    let StandardSpecialMove = 1;
    let StandardSpecialAdditionalEffect = 0;
    let SuperSpecialMoveAdditionalEffect = 0;

    let Status = 0;
    let LeaderSkill = 1;
    let AdditionPassive = 1;
    let MultiplicationPassive = 1;
    let LinkSkill = 0;
    let VitalityBonus = 0;
    let SpecialMoveAdjustment = 0;
    let ActionSkill = 0;
    let FieldSkill = 0;
    let SupportMemoryItem = 0;
    let FollowUpCount = 0;

    let finalValues = [];

    const finalOutput = document.getElementById("values");

    function updateVisibility() {
        const selected = selector.value;

        allStatusDivs.forEach(div => {
            if (div.dataset.hide === selected) {
                div.classList.add("hidden");

                const inputs = div.querySelectorAll("input");
                inputs.forEach(input => {
                    input.value = input.getAttribute("value");
                })

                const checkboxes = div.querySelectorAll("input[type=checkbox]");
                checkboxes.forEach(cb => cb.checked = false);
            } else {
                div.classList.remove("hidden");
            }
        });
    }

    function updateRarity() {
        const selectedRarity = raritySelect.value;
        const raritySet = rarityValues[selectedRarity];

        // 「LR専用」の項目を非表示にする
        const lrOnlyInputs = document.querySelectorAll("[data-visible-for='LR']");
        lrOnlyInputs.forEach(input => {
            const parent = input.closest(".status") || input;
            if (selectedRarity === "LR") {
                parent.classList.remove("hidden");
            } else {
                parent.classList.add("hidden");
            }
        });

        if (selectedRarity !== "LR") {
            const allInputs = document.querySelectorAll("input");
            allInputs.forEach(input => {
                input.value = input.getAttribute("value");
            });
        }

        // ▼ 値の自動更新
        inputs.forEach(input => {
            const rarityKey = input.dataset.rarityValue;
            if (rarityKey && raritySet[rarityKey] !== undefined) {
                input.value = raritySet[rarityKey];
            }
        });
    }

    updateVisibility();

    selector.addEventListener("change", () => {
        reset();
        updateVisibility();

        const criticalRateInput = document.getElementById("criticalRate");
        if (criticalRateInput) criticalRateInput.value = 0;
        const allGuard = document.getElementById("allGuard");
        if (allGuard) allGuard.checked = false;
        const effectiveCheckbox = document.getElementById("effectiveCheckbox");
        if (effectiveCheckbox) effectiveCheckbox.checked = false;

        calculateFinal();

    });

    raritySelector.addEventListener("change", () => {
        updateRarity();
        calculateFinal();
    });

    function calculateFinal() {
        reset();

        inputs.forEach(input => {
            const key = input.dataset.key;
            const val = Number(input.value) || 0;

            switch (key) {
                case "Status":
                    Status = val;
                    break;
                case "LeaderSkill":
                    LeaderSkill = 1 + val / 100;
                    break;
                case "FieldSkill":
                    FieldSkill = 1 + val / 100;
                    break;
                case "AdditionPassive":
                    AdditionPassive = 1 + val / 100;
                    break;
                case "MultiplicationPassive":
                    MultiplicationPassive = 1 + val / 100;
                    break;
                case "LinkSkill":
                    LinkSkill = 1 + val / 100;
                    break;
                case "maxVitalityBonus":
                    maxVitalityBonus = val;
                    break;
                case "minVitalityBonus":
                    minVitalityBonus = val;
                    break;
                case "SuperSpecialMove":
                    SuperSpecialMove = val / 100;
                    break;
                case "StandardSpecialMove":
                    StandardSpecialMove = val / 100;
                    break;
                case "SpecialMoveAdjustment":
                    SpecialMoveAdjustment = val / 100;
                    break;
                case "StandardSpecialAdditionalEffect":
                    StandardSpecialAdditionalEffect = val / 100;
                    break;
                case "SuperSpecialMoveAdditionalEffect":
                    SuperSpecialMoveAdditionalEffect = val / 100;
                    break;
                case "ActionSkill":
                    ActionSkill = 1 + val / 100;
                    break;
                case "SupportMemory":
                    SupportMemoryItem = 1 + val / 100;
                    break;
                case "SupportItem":
                    SupportMemoryItem += val / 100;
                    break;
                case "FollowUpCount":
                    FollowUpCount = 1 + val;
                    break;
            }
        });

        finalOutput.innerHTML = "";

        for (let i = 0; i < FollowUpCount; i++) {
            let finalSpecialMoveAdjustment
            if (i === 0) {
                VitalityBonus = maxVitalityBonus;
                console.log(SpecialMoveAdjustment);
                SpecialMoveAdjustment += SuperSpecialMoveAdditionalEffect;
                console.log(SpecialMoveAdjustment);
                finalSpecialMoveAdjustment = SuperSpecialMove + SpecialMoveAdjustment;
            } else {
                VitalityBonus = minVitalityBonus;
                SpecialMoveAdjustment += StandardSpecialAdditionalEffect;
                finalSpecialMoveAdjustment = StandardSpecialMove + SpecialMoveAdjustment;
            }

            let finalValue = Math.floor(Status * LeaderSkill);
            finalValue = Math.floor(finalValue * FieldSkill);
            finalValue = Math.floor(finalValue * AdditionPassive);
            finalValue = Math.floor(finalValue * MultiplicationPassive)
            finalValue = Math.floor(finalValue * SupportMemoryItem);
            finalValue = Math.floor(finalValue * ActionSkill);
            finalValue = Math.floor(finalValue * LinkSkill);
            finalValue = Math.floor(finalValue * VitalityBonus);
            finalValue = Math.round(finalValue * finalSpecialMoveAdjustment);

            finalValues.push(finalValue);

            finalOutput.innerHTML += formatNumberWithUnits(finalValue) + (i < FollowUpCount - 1 ? ", <br>" : "");
        }

        if (selector.value === "ATK") {
            const criticalRateInput = document.getElementById("criticalRate");
            const effectiveCheckbox = document.getElementById("effectiveCheckbox");
            const totalDamageOutput = document.getElementById("totalDamage");

            const criticalRate = Number(criticalRateInput.value) / 100;
            const isEffective = effectiveCheckbox.checked;

            let total = finalValues.reduce((a, b) => a + b, 0);

            if (isEffective) {
                total *= 1.5;
                total *= (1 + 0.25 * criticalRate);
            } else {
                total *= (1 + 0.875 * criticalRate);
            }

            total = Math.round(total);

            totalDamageOutput.innerHTML = formatNumberWithUnits(total);
        }

        if (selector.value === "DEF") {
            const enemyATK = (Number(document.getElementById("enemyATK").value) || 0) * 10000;
            const reductionRate = Number(document.getElementById("reductionRate").value) / 100;
            const allGuard = document.getElementById("allGuard").checked;
            const baseValue = finalValues.reduce((a, b) => a + b, 0); // 実数値の合計


            let damage = enemyATK * (1 - reductionRate);

            if (allGuard) damage *= 0.8;

            damage -= baseValue;

            if (allGuard) damage *= 0.5;

            damage = Math.round(damage);
            if (damage <= 0) damage = 0

            document.getElementById("damageTaken").innerHTML = formatNumberWithUnits(damage);
        }

    }

    function formatNumberWithUnits(value) {
        if (isNaN(value)) return value;

        if (value >= 100000000) {
            const oku = Math.floor(value / 100000000);
            const man = Math.floor((value % 100000000) / 10000);
            const remainder = value % 10000;

            return `<span class="oku">${oku}</span><span class="oku">億</span>` +
                (man > 0 ? `<span class="man">${man}</span><span class="man">万</span>` : "") +
                (remainder > 0 ? `<span>${remainder}</span>` : "");
        }
        else if (value >= 10000) {
            const man = Math.floor(value / 10000);
            const remainder = value % 10000;
            return `${man}<span class="unit-man">万</span>${remainder > 0 ? remainder : ""}`;
        }
        else {
            return `<span>${value}</span>`;
        }
    };

    function reset() {
        maxVitalityBonus = 0;
        minVitalityBonus = 0;
        SuperSpecialMove = 0;
        StandardSpecialMove = 0;
        StandardSpecialAdditionalEffect = 0;
        SuperSpecialMoveAdditionalEffect = 0;

        Status = 0;
        LeaderSkill = 0;
        AdditionPassive = 0;
        MultiplicationPassive = 0;
        LinkSkill = 0;
        VitalityBonus = 0;
        SpecialMoveAdjustment = 0;
        ActionSkill = 0;
        FieldSkill = 0;
        SupportMemoryItem = 0;
        FollowUpCount = 0;

        finalValues = [];
    }

    inputs.forEach(input => {
        // 値が変わったら計算
        input.addEventListener("input", calculateFinal);

        // クリックやTabでフォーカスしたら値を全選択
        input.addEventListener("focus", (e) => {
            e.target.select();
        });
    });

    calculateFinal();

    const saveSlots = [{}, {}, {}, {}, {}];

    function saveToSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= saveSlots.length) return;

        const slotData = {};

        // すべての input 値を保存
        inputs.forEach(input => {
            const key = input.dataset.key;
            if (key) {
                slotData[key] = input.value; // 入力されたままの文字列を保存
            }
        });

        // セレクトの値も保存
        slotData.selectorValue = selector.value;

        saveSlots[slotIndex] = slotData;

        console.log("Saved:", slotData);
        alert(`Slot ${slotIndex + 1} にセーブしました`);
    }

    function loadFromSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= saveSlots.length) return;

        const data = saveSlots[slotIndex];
        if (!data) return;

        // input を復元
        inputs.forEach(input => {
            const key = input.dataset.key;
            if (key && key in data) {
                input.value = data[key];
            }
        });

        // セレクトを復元
        selector.value = data.selectorValue || selector.value;

        // 画面の表示・計算を更新
        updateVisibility();
        calculateFinal();

        console.log("Loaded:", data);
        alert(`Slot ${slotIndex + 1} をロードしました`);
    }


    const modal = document.getElementById("saveModal");
    const openModalBtn = document.getElementById("openSaveModal");
    const closeModalBtn = document.getElementById("closeSaveModal");

    openModalBtn.addEventListener("click", () => {
        modal.classList.remove("hidden");
    });
    closeModalBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
    });
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.add("hidden");
        }
    });

    // セーブ・ロードボタンにイベントを付ける
    document.querySelectorAll(".slot").forEach(slot => {
        const index = Number(slot.dataset.slotIndex);

        const saveBtn = slot.querySelector(".save-btn");
        const loadBtn = slot.querySelector(".load-btn");

        saveBtn.addEventListener("click", () => {
            saveToSlot(index);
            modal.classList.add("hidden");
        });

        loadBtn.addEventListener("click", () => {
            loadFromSlot(index);
            modal.classList.add("hidden");
        });
    });

    const helpButton = document.getElementById("helpButton");

    helpButton.addEventListener("click", () => {
        window.open("help.html", "_blank");
    });
});