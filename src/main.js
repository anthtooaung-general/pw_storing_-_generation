import "./style.css";
import { icon, brand, panelHeading } from "./ui.js";
import { derive, salt, encrypt, decrypt, generate } from "./crypto.js";
const accounts = ["anthtooaung2792005@gmail.com", "anthtooaung10@gmail.com"];
const app = document.querySelector("#app");
let session = null,
  page = "vault",
  query = "",
  category = "All items",
  generated = "",
  idle;
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const storageKey = (email) => `still:v1:${email}`;
const toast = (message) => {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("visible"), 3000);
};
async function persist(
  data = session.data,
  key = session.key,
  s = session.salt,
) {
  const record = { salt: s, ...(await encrypt(key, data)) };
  localStorage.setItem(storageKey(session.email), JSON.stringify(record));
  session.data = data;
  session.key = key;
  session.salt = s;
}
function resetIdle() {
  clearTimeout(idle);
  if (session) idle = setTimeout(lock, session.data.timeout * 60000);
}
function lock() {
  session = null;
  clearTimeout(idle);
  document.querySelector("dialog")?.remove();
  renderLogin();
}
["pointerdown", "keydown"].forEach((event) =>
  document.addEventListener(event, resetIdle),
);
async function copy(value) {
  try {
    await navigator.clipboard.writeText(value);
    toast("Copied to clipboard");
  } catch {
    toast("Clipboard access unavailable. Select and copy the password.");
  }
}
function togglePassword(input, button) {
  const visible = input.type === "password";
  input.type = visible ? "text" : "password";
  button.textContent = visible ? "Hide" : "Show";
  button.setAttribute(
    "aria-label",
    visible ? "Hide password" : "Show password",
  );
  button.setAttribute("aria-pressed", String(visible));
}
function renderLogin() {
  document.title = "Still — Unlock your vault";
  app.innerHTML = `
    <main class="login">
      <section class="login-story">
        ${brand()}
        <div class="story-copy">
          <span class="eyebrow">A LITTLE LESS TO REMEMBER</span>
          <h1>Your digital life.<br> A little more<br><em>peaceful.</em></h1>
          <p>A private space for your passwords. Keep the important things close, and make room for everything else.</p>
          <div class="vault-art" aria-hidden="true">
            <div class="orbit"></div><div class="orbit orbit-two"></div>
            <div class="art-key">${icon("lock")}</div>
            <div class="art-pill">${icon("check")} Encrypted. On your device.</div>
          </div>
        </div>
        <footer>${icon("shield")} A quiet place. Entirely yours.</footer>
      </section>
      <section class="login-form" aria-labelledby="login-title">
        <div class="login-top">${icon("device")} Your personal password space</div>
        <div class="login-box">
          <div class="welcome-icon">${icon("lock")}</div>
          <span class="overline">WELCOME TO STILL</span>
          <h2 id="login-title">Good to have you here.</h2>
          <p>Unlock your vault. Everything in its place.</p>
          <form id="login">
            <label for="email">Email address</label>
            <input id="email" name="email" type="email" autocomplete="username" placeholder="you@example.com" required>
            <label for="password">Vault password</label>
            <div class="password-field">
              <input id="password" name="password" type="password" autocomplete="current-password" placeholder="Enter your password" required>
              <button type="button" class="reveal" aria-label="Show password" aria-controls="password" aria-pressed="false">Show</button>
            </div>
            <p id="login-error" class="error" role="alert"></p>
            <button class="primary wide" type="submit">Unlock your vault ${icon("arrow")}</button>
          </form>
          <div class="demo-note">${icon("shield")}<div><strong>Your first visit?</strong><p>Use either of your two configured email addresses and <code>password</code> to get started. Set a unique password in Settings before adding real credentials.</p></div></div>
          <p class="local-note">Saved in this browser · No cloud sync</p>
        </div>
        <footer><span>Thoughtfully simple. Entirely yours.</span><span>Still / Personal vault</span></footer>
      </section>
    </main>`;
  document.querySelector(".reveal").onclick = (e) =>
    togglePassword(document.querySelector("#password"), e.currentTarget);
  document.querySelector("#login").onsubmit = async (e) => {
    e.preventDefault();
    const button = e.target.querySelector("[type=submit]");
    button.disabled = true;
    button.textContent = "Unlocking…";
    const email = e.target.email.value.trim().toLowerCase(),
      password = e.target.password.value;
    try {
      if (!accounts.includes(email))
        throw new Error("Use one of the two configured email addresses.");
      const saved = localStorage.getItem(storageKey(email));
      const record = saved ? JSON.parse(saved) : null;
      if (!record && password !== "password")
        throw new Error("Incorrect password. First-time password is password.");
      const s = record?.salt || salt(),
        key = await derive(password, s);
      let data;
      try {
        data = record
          ? await decrypt(key, record)
          : { items: [], name: "Anth Too Aung", timeout: 10 };
      } catch {
        throw new Error(
          "Unable to unlock. Check your password or restore your encrypted backup.",
        );
      }
      session = { email, key, salt: s, data };
      if (!record) await persist();
      page = "vault";
      query = "";
      category = "All items";
      render();
      resetIdle();
    } catch (error) {
      session = null;
      document.querySelector("#login-error").textContent = error.message;
      button.disabled = false;
      button.innerHTML = `Unlock your vault ${icon("arrow")}`;
    }
  };
}
function render() {
  const titles = {
    vault: "Your vault",
    generator: "Password generator",
    settings: "Account settings",
  };
  document.title = `${titles[page]} — Still`;
  const labels = {
    vault: "My vault",
    generator: "Generator",
    settings: "Settings",
  };
  app.innerHTML = `
    <div class="workspace">
      <aside class="sidebar">
        ${brand()}
        <div class="sidebar-label">PERSONAL WORKSPACE</div>
        <nav aria-label="Main navigation">
          ${Object.keys(labels)
            .map(
              (p) =>
                `<button aria-label="${labels[p]}" data-page="${p}" class="nav-item ${page === p ? "active" : ""}" ${page === p ? 'aria-current="page"' : ""}>${icon(p)}<span>${labels[p]}</span>${p === "vault" ? `<small>${session.data.items.length}</small>` : ""}</button>`,
            )
            .join("")}
        </nav>
        <div class="sidebar-bottom">
          <div class="encrypted">${icon("shield")}<strong>Private by design.</strong><p>Encrypted in your browser.<br>Your passwords stay with you.</p></div>
          <button id="lock" class="lock-button" aria-label="Lock vault">${icon("lock")}<span>Lock vault</span>${icon("arrow")}</button>
          <div class="profile"><div class="avatar">${escape(session.data.name.slice(0, 1).toUpperCase())}</div><div><strong>${escape(session.data.name)}</strong><small>Personal account</small></div><span class="online" aria-label="Unlocked"></span></div>
        </div>
      </aside>
      <main class="main" id="main-content">
        <header class="topbar"><span><span class="breadcrumb-root">Personal workspace</span><span class="breadcrumb-current"><span class="slash">/</span>${titles[page]}</span></span><span class="status">${icon("shield")} Vault unlocked</span></header>
        <div class="content">
          <div class="page-heading"><div>
            <span class="overline">${page === "vault" ? "YOUR DIGITAL LIFE, ORGANIZED" : page === "generator" ? "A FRESH START, EVERY TIME" : "MAKE YOURSELF AT HOME"}</span>
            <h1 tabindex="-1">${titles[page]}<span class="heading-dot">.</span></h1>
            <p>${page === "vault" ? "All your passwords. One peaceful place." : page === "generator" ? "Create something strong. Leave the remembering to us." : "A few small details to make this space your own."}</p>
          </div>${page === "vault" ? `<button id="add" aria-label="Add password" class="primary">${icon("plus")} Add password</button>` : ""}</div>
          <section id="page-content" aria-label="${titles[page]}"></section>
          <footer class="content-footer"><span>${icon("vault")} A quiet place for your passwords.</span><span>STORED LOCALLY · ENCRYPTED WITH AES-256</span></footer>
        </div>
      </main>
    </div>`;
  document.querySelectorAll("[data-page]").forEach(
    (b) =>
      (b.onclick = () => {
        page = b.dataset.page;
        render();
        document.querySelector(".page-heading h1").focus();
        window.scrollTo(0, 0);
      }),
  );
  document.querySelector("#lock").onclick = lock;
  document.querySelector(".brand").onclick = (e) => {
    e.preventDefault();
    page = "vault";
    render();
    document.querySelector(".page-heading h1").focus();
  };
  if (page === "vault") renderVault();
  if (page === "generator") renderGenerator();
  if (page === "settings") renderSettings();
}
function renderVault() {
  const items = session.data.items;
  document.querySelector("#page-content").innerHTML = `
    <div class="summary">
      <div class="summary-card">${icon("vault")}<span>All passwords</span><strong>${String(items.length).padStart(2, "0")}</strong><small>Everything, in one place</small></div>
      <div class="summary-card">${icon("star")}<span>Favorites</span><strong>${String(items.filter((i) => i.favorite).length).padStart(2, "0")}</strong><small>Your everyday essentials</small></div>
      <div class="summary-note">${icon("generator", "summary-mark")}<div><strong>A stronger password.<br> A lighter mind.</strong><button id="try-generator">Open password generator ${icon("arrow")}</button></div></div>
    </div>
    <div class="vault-panel">
      <div class="vault-toolbar">
        <div class="tabs" role="group" aria-label="Filter passwords">${["All items", "Favorites"].map((c) => `<button class="${category === c ? "selected" : ""}" data-filter="${c}" aria-pressed="${category === c}">${c}</button>`).join("")}</div>
        <div class="search-field">${icon("search")}<input id="search" aria-label="Search passwords" type="search" placeholder="Search your vault…" value="${escape(query)}"></div>
      </div>
      <div id="items"></div>
    </div>
    <div class="privacy-note">${icon("shield")}<span><strong>Yours, and yours alone.</strong> Passwords are encrypted before they’re saved to this browser.</span></div>`;
  document.querySelector("#add").onclick = () => itemDialog();
  document.querySelector("#try-generator").onclick = () => {
    page = "generator";
    render();
  };
  document.querySelector("#search").oninput = (e) => {
    query = e.target.value;
    renderItems();
  };
  document.querySelectorAll("[data-filter]").forEach(
    (b) =>
      (b.onclick = () => {
        category = b.dataset.filter;
        renderVault();
        document.querySelector(`[data-filter="${category}"]`).focus();
      }),
  );
  renderItems();
}
function renderItems() {
  const items = session.data.items.filter(
    (i) =>
      (category !== "Favorites" || i.favorite) &&
      `${i.title} ${i.username} ${i.url}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  document.querySelector("#items").innerHTML = items.length
    ? `<div class="table-label"><span>NAME / ACCOUNT</span><span>LAST UPDATED</span><span>ACTIONS</span></div><div class="item-list">${items.map((i) => `<article class="vault-item"><div class="item-identity"><div class="site-icon">${escape(i.title.slice(0, 1).toUpperCase())}</div><div><h2>${escape(i.title)}</h2><p>${escape(i.username)}</p></div></div><time>${new Date(i.updated).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time><div class="item-actions"><button data-favorite="${i.id}" aria-label="${i.favorite ? "Unfavorite" : "Favorite"} ${escape(i.title)}" aria-pressed="${i.favorite}">${icon("star")}</button><button data-copy="${i.id}" aria-label="Copy password for ${escape(i.title)}" title="Copy password">${icon("copy")}</button><button data-edit="${i.id}" aria-label="Edit ${escape(i.title)}" title="Edit password">${icon("edit")}</button></div></article>`).join("")}</div>`
    : `<div class="empty"><span class="empty-symbol">${icon(query ? "search" : "vault")}</span><span class="overline">${query ? "NOTHING HERE YET" : "A FRESH LITTLE SPACE"}</span><h2>${query ? "No matching passwords" : category === "Favorites" ? "Keep your essentials close." : "Your peace of mind starts here."}</h2><p>${query ? "Try a different name, email, or website." : category === "Favorites" ? "Star a password to find it here." : "Add your first password and give it a safe place to live."}</p>${!query && category !== "Favorites" ? `<button class="secondary" id="first-add">${icon("plus")} Add your first password</button>` : ""}</div>`;
  document
    .querySelector("#first-add")
    ?.addEventListener("click", () => itemDialog());
  document
    .querySelectorAll("[data-copy]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          copy(
            session.data.items.find((i) => i.id === b.dataset.copy).password,
          )),
    );
  document
    .querySelectorAll("[data-edit]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          itemDialog(session.data.items.find((i) => i.id === b.dataset.edit))),
    );
  document.querySelectorAll("[data-favorite]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          const data = structuredClone(session.data);
          const i = data.items.find((i) => i.id === b.dataset.favorite);
          i.favorite = !i.favorite;
          await persist(data);
          renderVault();
          document
            .querySelector(`[data-favorite="${CSS.escape(i.id)}"]`)
            ?.focus();
        } catch {
          toast("Could not save. Browser storage may be full.");
        }
      }),
  );
}
function itemDialog(item = null, password = "") {
  const dialog = document.createElement("dialog");
  dialog.className = "item-dialog";
  dialog.setAttribute("aria-label", item ? "Edit password" : "Add a password");
  dialog.innerHTML = `<form id="item-form"><div class="dialog-heading"><div><span class="overline">A PLACE FOR THE IMPORTANT THINGS</span><h2>${item ? "Edit password" : "Add a password"}</h2></div><button type="button" class="close" aria-label="Close dialog">${icon("close")}</button></div><label for="item-title">Name</label><input id="item-title" name="title" autofocus maxlength="100" placeholder="e.g. GitHub" required value="${escape(item?.title || "")}"><label for="item-username">Email or username</label><input id="item-username" name="username" maxlength="200" autocomplete="off" value="${escape(item?.username || "")}"><label for="item-password">Password</label><div class="password-field"><input id="item-password" name="password" type="password" autocomplete="new-password" required value="${escape(item?.password || password)}"><button type="button" class="reveal" aria-label="Show password" aria-controls="item-password" aria-pressed="false">Show</button></div><label for="item-url">Website (optional)</label><input id="item-url" name="url" maxlength="500" placeholder="https://example.com" value="${escape(item?.url || "")}"><label for="item-notes">Notes (optional)</label><textarea id="item-notes" name="notes" maxlength="2000">${escape(item?.notes || "")}</textarea><p class="error" role="alert"></p><div class="dialog-actions">${item ? '<button type="button" class="danger" id="delete">Delete password</button>' : "<span>Encrypted on this device</span>"}<button class="primary" type="submit">Save password ${icon("check")}</button></div></form>`;
  const opener = document.activeElement;
  const returnFocus = () => {
    const target = opener?.isConnected
      ? opener
      : document.querySelector("#add, #save-generated, #restore-backup");
    target?.focus();
  };
  document.body.append(dialog);
  dialog.addEventListener("close", returnFocus);
  dialog.showModal();
  const close = () => dialog.close();
  dialog.querySelector(".close").onclick = close;
  dialog.addEventListener("close", () => dialog.remove());
  dialog.querySelector(".reveal").onclick = (e) =>
    togglePassword(dialog.querySelector("[name=password]"), e.currentTarget);
  dialog.querySelector("#delete")?.addEventListener("click", async (e) => {
    if (e.target.dataset.confirm !== "yes") {
      e.target.dataset.confirm = "yes";
      e.target.textContent = "Click again to delete";
      return;
    }
    try {
      const data = structuredClone(session.data);
      data.items = data.items.filter((i) => i.id !== item.id);
      await persist(data);
      close();
      render();
      toast("Password deleted");
    } catch {
      dialog.querySelector(".error").textContent = "Unable to save changes.";
    }
  });
  dialog.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const title = f.get("title").trim();
    if (!title) {
      dialog.querySelector(".error").textContent = "Enter a name.";
      return;
    }
    const next = {
      id: item?.id || crypto.randomUUID(),
      favorite: item?.favorite || false,
      updated: Date.now(),
      title,
      username: f.get("username").trim(),
      password: f.get("password"),
      url: f.get("url").trim(),
      notes: f.get("notes"),
    };
    try {
      const data = structuredClone(session.data);
      data.items = item
        ? data.items.map((i) => (i.id === item.id ? next : i))
        : [next, ...data.items];
      await persist(data);
      close();
      render();
      toast("Password saved to your vault");
    } catch {
      dialog.querySelector(".error").textContent =
        "Could not save. Check available browser storage.";
    }
  };
}
function renderGenerator() {
  document.querySelector("#page-content").innerHTML =
    `<div class="generator-layout"><section class="panel generator-panel"><div class="section-heading"><span class="overline">MADE TO BE UNGUESSABLE</span>${icon("generator")}</div><div class="generator-display"><output id="generated" class="generated" aria-live="polite"></output><div class="strength"><span>● Strong & randomly generated</span><span id="char-count">20 characters</span></div></div><div class="generator-buttons"><button id="regenerate" class="secondary">${icon("refresh")} Generate again</button><button id="copy-generated" class="primary">${icon("copy")} Copy password</button></div><div class="generator-options"><div class="range-label"><label for="length">Password length</label><output id="length-value">20</output></div><input id="length" type="range" min="8" max="64" value="20">${[
      ["upper", "Uppercase letters", "A–Z"],
      ["lower", "Lowercase letters", "a–z"],
      ["numbers", "Numbers", "0–9"],
      ["symbols", "Symbols", "!@#$%"],
    ]
      .map(
        ([id, label, sample]) =>
          `<label class="option" for="${id}"><span>${label}<small>${sample}</small></span><input type="checkbox" id="${id}" checked></label>`,
      )
      .join(
        "",
      )}<p id="generator-error" class="error" role="alert"></p></div><button id="save-generated" class="text-button">${icon("plus")} Save this password to your vault</button></section><aside class="generator-aside"><div class="big-asterisk">${icon("generator")}</div><h2>Good passwords<br>don’t need a pattern.</h2><p>Let randomness do the work. Every password is made right here in your browser, using cryptographically secure randomness.</p><div class="tip"><span class="overline">A SMALL, HELPFUL HABIT</span><p>One account, one password. A unique password keeps the rest of your digital life separate.</p></div></aside></div>`;
  const groups = {
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lower: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*()-_=+[]{}?",
  };
  const update = () => {
    const length = Number(document.querySelector("#length").value);
    document.querySelector("#length-value").textContent = length;
    document.querySelector("#char-count").textContent = `${length} characters`;
    try {
      generated = generate(
        length,
        Object.entries(groups)
          .filter(([id]) => document.getElementById(id).checked)
          .map(([, s]) => s),
      );
      document.querySelector("#generated").textContent = generated;
      document.querySelector("#generator-error").textContent = "";
      document.querySelector(".strength").firstElementChild.textContent =
        `● ${length >= 16 ? "Strong" : "Use 16+ characters for more strength"} & randomly generated`;
      document.querySelector("#save-generated").disabled = false;
      document.querySelector("#copy-generated").disabled = false;
    } catch (error) {
      generated = "";
      document.querySelector(".strength").firstElementChild.textContent =
        "No password generated";
      document.querySelector("#generated").textContent =
        "Choose a character type";
      document.querySelector("#generator-error").textContent = error.message;
      document.querySelector("#save-generated").disabled = true;
      document.querySelector("#copy-generated").disabled = true;
    }
  };
  document
    .querySelectorAll(".generator-options input")
    .forEach((i) => (i.oninput = update));
  document.querySelector("#regenerate").onclick = update;
  document.querySelector("#copy-generated").onclick = () => copy(generated);
  document.querySelector("#save-generated").onclick = () =>
    itemDialog(null, generated);
  update();
}
function renderSettings() {
  document.querySelector("#page-content").innerHTML =
    `<div class="settings-grid"><section class="panel">${panelHeading("01", "Personal details", "The person behind the vault.")}<form id="profile-form"><label for="name">Display name</label><input name="name" id="name" maxlength="60" value="${escape(session.data.name)}" required><label for="account-email">Account email</label><input id="account-email" value="${escape(session.email)}" readonly><p class="field-note">This account’s vault is separate from your other account.</p><label for="timeout">Lock after inactivity</label><select id="timeout" name="timeout">${[1, 5, 10, 30].map((n) => `<option value="${n}" ${session.data.timeout === n ? "selected" : ""}>${n} minute${n === 1 ? "" : "s"}</option>`).join("")}</select><button class="primary" type="submit">Save preferences ${icon("check")}</button></form></section><section class="panel">${panelHeading("02", "Change vault password", "A stronger key to your personal space.")}<form id="change-password"><label for="current">Current password</label><input id="current" name="current" type="password" autocomplete="current-password" required><label for="new-password">New password</label><input id="new-password" name="newPassword" type="password" minlength="12" autocomplete="new-password" required><label for="confirm-password">Confirm new password</label><input id="confirm-password" name="confirm" type="password" minlength="12" autocomplete="new-password" required><p class="field-note">Use at least 12 characters. Your vault will be re-encrypted. There is no password recovery.</p><p class="error" role="alert"></p><button class="primary" type="submit">Update password ${icon("arrow")}</button></form></section><section class="panel backup-panel"><div><span class="overline">A LITTLE EXTRA REASSURANCE</span><h2>Your data stays here.</h2><p>Vaults are stored only in this browser. Clearing browser data removes them. Keep an encrypted backup and remember the password used when you exported it.</p></div><div class="backup-buttons"><button class="secondary" id="export">${icon("download")} Export encrypted backup</button><button type="button" class="secondary" id="restore-backup">${icon("upload")} Restore encrypted backup</button><input type="file" id="import" accept="application/json,.json" hidden></div></section></div>`;
  document.querySelector("#profile-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const name = f.get("name").trim();
    if (!name) {
      toast("Enter a display name");
      return;
    }
    try {
      await persist({
        ...session.data,
        name,
        timeout: Number(f.get("timeout")),
      });
      resetIdle();
      render();
      toast("Preferences saved");
    } catch {
      toast("Could not save preferences");
    }
  };
  document.querySelector("#change-password").onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target),
      error = e.target.querySelector(".error"),
      button = e.target.querySelector("button");
    error.textContent = "";
    if (f.get("newPassword") !== f.get("confirm")) {
      error.textContent = "New passwords do not match.";
      return;
    }
    button.disabled = true;
    try {
      const record = JSON.parse(
        localStorage.getItem(storageKey(session.email)),
      );
      await decrypt(await derive(f.get("current"), record.salt), record);
      const s = salt();
      await persist(session.data, await derive(f.get("newPassword"), s), s);
      e.target.reset();
      toast("Vault password updated");
    } catch {
      error.textContent =
        "Unable to update. Check your current password and browser storage.";
    } finally {
      button.disabled = false;
    }
  };
  document.querySelector("#export").onclick = () => {
    const record = localStorage.getItem(storageKey(session.email));
    const blob = new Blob(
      [
        JSON.stringify({
          format: "still-v1",
          email: session.email,
          record: JSON.parse(record),
        }),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "still-encrypted-backup.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Encrypted backup exported");
  };
  document.querySelector("#restore-backup").onclick = () =>
    document.querySelector("#import").click();
  document.querySelector("#import").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (file.size > 5000000) throw new Error("Backup is too large.");
      const backup = JSON.parse(await file.text());
      if (backup.format !== "still-v1" || backup.email !== session.email)
        throw new Error("Select a Still backup for this account.");
      backupDialog(backup);
    } catch (error) {
      toast(error.message);
    }
    e.target.value = "";
  };
}
function backupDialog(backup) {
  const dialog = document.createElement("dialog");
  dialog.className = "item-dialog";
  dialog.setAttribute("aria-label", "Restore your backup");
  dialog.innerHTML = `<form><div class="dialog-heading"><h2>Restore your backup</h2><button class="close" type="button" aria-label="Close dialog">${icon("close")}</button></div><p>This replaces the current vault on this browser. Export your current vault first if you want to keep it.</p><label for="backup-password">Password used for this backup</label><input id="backup-password" name="password" autofocus type="password" autocomplete="off" required><p class="error" role="alert"></p><button class="primary" type="submit">Replace vault & restore →</button></form>`;
  const opener = document.activeElement;
  const returnFocus = () => {
    const target = opener?.isConnected
      ? opener
      : document.querySelector("#add, #save-generated, #restore-backup");
    target?.focus();
  };
  document.body.append(dialog);
  dialog.addEventListener("close", returnFocus);
  dialog.showModal();
  dialog.querySelector(".close").onclick = () => dialog.close();
  dialog.onclose = () => dialog.remove();
  dialog.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    try {
      const key = await derive(
        new FormData(e.target).get("password"),
        backup.record.salt,
      );
      const data = await decrypt(key, backup.record);
      if (
        !Array.isArray(data.items) ||
        typeof data.name !== "string" ||
        ![1, 5, 10, 30].includes(data.timeout) ||
        data.items.some(
          (i) =>
            !["id", "title", "username", "password", "url", "notes"].every(
              (k) => typeof i[k] === "string",
            ) ||
            typeof i.favorite !== "boolean" ||
            !Number.isFinite(i.updated),
        )
      )
        throw new Error();
      await persist(data, key, backup.record.salt);
      dialog.close();
      resetIdle();
      render();
      toast("Backup restored");
    } catch {
      dialog.querySelector(".error").textContent =
        "Unable to restore. Check the backup file and its password.";
    }
  };
}
renderLogin();
