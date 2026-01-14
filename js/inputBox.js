import App from "./script.js";

const update = App.selectUpdate.bind(App);

function addInputBox(groupName) {
    const template = document.getElementById(`${groupName}-input-template`);
    const status = document.querySelector(`.status[data-input-group="${groupName}"]`);

    if (!template || !status) return;

    const clone = template.content.firstElementChild.cloneNode(true);

    // 削除ボタン
    const deleteBtn = clone.querySelector('.delete-btn');

    deleteBtn?.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.code === "Space") {
            e.preventDefault();
        }
    });

    deleteBtn?.addEventListener("click", () => {
        clone.remove();
        update();
    });

    // 追加した input にイベントを登録
    clone.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', update);
        input.addEventListener('focus', e => e.target.select());
    });

    // form 内の最後に追加
    status.querySelector('form').appendChild(clone);

    // 追加後の計算
    update();
}

// 追加ボタンにイベント登録（汎用）
document.querySelectorAll(".add-btn").forEach(btn => {

    btn.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.code === "Space") {
            e.preventDefault();
        }
    });

    btn.addEventListener("click", () => {
        const group = btn.closest(".status").dataset.inputGroup;
        addInputBox(group);
    });
});