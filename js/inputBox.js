window.addInputBoxForSave = addInputBox;

const update = window.App.selectUpdate.bind(window.App);

function addInputBox(groupName) {
    const template = document.getElementById(`${groupName}-input-template`);
    const status = document.querySelector(`.status[data-input-group="${groupName}"]`);
    const form = status?.querySelector("form");

    if (!template || !form) return;

    const clone = template.content.firstElementChild.cloneNode(true);

    // form 内の最後に追加
    form.appendChild(clone);

    // 追加後の計算
    update();
}

// 表示切替では .status の中身を作り直すため、イベント委譲で
// 作り直された追加・削除ボタンにも常に対応する。
document.addEventListener("click", event => {
    const addBtn = event.target.closest(".add-btn");
    if (addBtn) {
        const group = addBtn.closest(".status")?.dataset.inputGroup;
        if (group) addInputBox(group);
        return;
    }

    const deleteBtn = event.target.closest(".delete-btn");
    const inputBox = deleteBtn?.closest(".input-box");
    if (inputBox?.closest(".status")) {
        inputBox.remove();
        update();
    }
});
