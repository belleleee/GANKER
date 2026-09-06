(function () {
  var USERS_KEY = "fortune-road-users-v1";
  var SESSION_KEY = "fortune-road-current-user-v1";

  function readJson(key, fallback) {
    try {
      var value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function users() {
    return readJson(USERS_KEY, []);
  }

  function saveUsers(list) {
    writeJson(USERS_KEY, list);
  }

  function normalize(value) {
    return String(value || "").trim();
  }

  function publicUser(user) {
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      unlockedLevel: user.unlockedLevel || 1,
      saves: user.saves || {}
    };
  }

  function findCurrent(list) {
    var id = window.localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    return list.filter(function (user) { return user.id === id; })[0] || null;
  }

  function setMessage(form, text, isError) {
    var message = form.querySelector(".form-message");
    if (!message) return;
    message.textContent = text;
    message.classList.toggle("error", Boolean(isError));
  }

  var api = {
    register: function (profile) {
      var name = normalize(profile.name);
      var email = normalize(profile.email).toLowerCase();
      var password = String(profile.password || "");
      if (name.length < 2) return { ok: false, message: "昵称至少需要 2 个字。" };
      if (!email || email.indexOf("@") < 1) return { ok: false, message: "请输入有效邮箱。" };
      if (password.length < 6) return { ok: false, message: "密码至少需要 6 位。" };
      var list = users();
      var exists = list.some(function (user) { return user.email === email || user.name === name; });
      if (exists) return { ok: false, message: "这个昵称或邮箱已经有档案了。" };
      var user = {
        id: "u-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7),
        name: name,
        email: email,
        password: password,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        unlockedLevel: 1,
        saves: {}
      };
      list.push(user);
      saveUsers(list);
      window.localStorage.setItem(SESSION_KEY, user.id);
      return { ok: true, user: publicUser(user), message: "档案创建成功，已经自动登录。" };
    },
    login: function (account, password) {
      var accountText = normalize(account).toLowerCase();
      var list = users();
      var user = list.filter(function (entry) {
        return entry.email === accountText || entry.name.toLowerCase() === accountText;
      })[0];
      if (!user || user.password !== String(password || "")) return { ok: false, message: "账号或密码不正确。" };
      user.lastLogin = new Date().toISOString();
      saveUsers(list);
      window.localStorage.setItem(SESSION_KEY, user.id);
      return { ok: true, user: publicUser(user), message: "登录成功，正在读取你的存档。" };
    },
    logout: function () {
      window.localStorage.removeItem(SESSION_KEY);
      window.dispatchEvent(new CustomEvent("fortune:user-change"));
    },
    currentUser: function () {
      return publicUser(findCurrent(users()));
    },
    requireUser: function () {
      var current = this.currentUser();
      if (current) return current;
      var result = this.register({ name: "临时玩家", email: "guest-" + Date.now() + "@fortune.local", password: "guest123" });
      return result.user;
    },
    getLevelSave: function (levelId) {
      var user = findCurrent(users());
      return user && user.saves ? user.saves[levelId] || null : null;
    },
    saveLevel: function (levelId, data) {
      var list = users();
      var user = findCurrent(list);
      if (!user) user = this.requireUser();
      list = users();
      user = findCurrent(list);
      user.saves = user.saves || {};
      user.saves[levelId] = Object.assign({}, data, { savedAt: new Date().toISOString() });
      saveUsers(list);
      window.dispatchEvent(new CustomEvent("fortune:save-change", { detail: { levelId: levelId } }));
    },
    clearLevel: function (levelId) {
      var list = users();
      var user = findCurrent(list);
      if (!user || !user.saves) return;
      delete user.saves[levelId];
      saveUsers(list);
      window.dispatchEvent(new CustomEvent("fortune:save-change", { detail: { levelId: levelId } }));
    },
    completeLevel: function (levelId, nextLevel, summary) {
      var list = users();
      var user = findCurrent(list);
      if (!user) return;
      user.unlockedLevel = Math.max(user.unlockedLevel || 1, nextLevel || 1);
      user.saves = user.saves || {};
      user.saves[levelId] = Object.assign({}, user.saves[levelId] || {}, summary || {}, {
        completed: true,
        savedAt: new Date().toISOString()
      });
      saveUsers(list);
      window.dispatchEvent(new CustomEvent("fortune:save-change", { detail: { levelId: levelId } }));
    }
  };

  function bindAuthForms() {
    var registerForm = document.querySelector("[data-register-form]");
    if (registerForm) {
      registerForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var result = api.register({
          name: document.querySelector("#name").value,
          email: document.querySelector("#email").value,
          password: document.querySelector("#new-password").value
        });
        setMessage(registerForm, result.message, !result.ok);
        if (result.ok) window.setTimeout(function () { window.location.href = "index.html"; }, 650);
      });
    }

    var loginForm = document.querySelector("[data-login-form]");
    if (loginForm) {
      loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var result = api.login(document.querySelector("#account").value, document.querySelector("#password").value);
        setMessage(loginForm, result.message, !result.ok);
        if (result.ok) window.setTimeout(function () { window.location.href = "index.html"; }, 650);
      });
    }

    document.querySelectorAll("[data-logout]").forEach(function (button) {
      button.addEventListener("click", function () {
        api.logout();
        window.location.href = "login.html";
      });
    });
  }

  function renderUserPanel() {
    var user = api.currentUser();
    document.querySelectorAll("[data-user-name]").forEach(function (node) {
      node.textContent = user ? user.name : "未登录";
    });
    document.querySelectorAll("[data-auth-link]").forEach(function (node) {
      node.textContent = user ? "我的存档" : "登录 / 注册";
      node.setAttribute("href", user ? "index.html#save-panel" : "login.html");
    });
    document.querySelectorAll("[data-user-only]").forEach(function (node) {
      node.hidden = !user;
    });
    document.querySelectorAll("[data-guest-only]").forEach(function (node) {
      node.hidden = Boolean(user);
    });
    document.querySelectorAll("[data-level-link]").forEach(function (node) {
      var level = Number(node.dataset.levelLink);
      var unlocked = level === 1 || (user && level <= (user.unlockedLevel || 1));
      if (!node.dataset.openText) node.dataset.openText = node.textContent;
      node.classList.toggle("locked", !unlocked);
      node.setAttribute("aria-disabled", unlocked ? "false" : "true");
      node.textContent = unlocked ? node.dataset.openText || node.textContent : "未解锁：先完成前一关";
      if (unlocked) node.setAttribute("href", "level-" + level + ".html");
      else node.removeAttribute("href");
    });
    var panel = document.querySelector("[data-save-panel]");
    if (!panel) return;
    var levelOne = user && user.saves ? user.saves.level1 : null;
    panel.querySelector("[data-save-player]").textContent = user ? user.name : "暂无玩家";
    panel.querySelector("[data-save-level]").textContent = levelOne ? "第一关 · " + (levelOne.completed ? "已通关" : "进行中") : "还没有第一关存档";
    panel.querySelector("[data-save-detail]").textContent = levelOne ? "现金 ¥" + Math.round(levelOne.cash || 0) + " · 声誉 " + (levelOne.reputation || 0) + " · 进度 " + Object.keys(levelOne.completedScenes || {}).length + "/7" : "登录后开始游戏，系统会自动保存进度。";
  }

  window.FortuneSave = api;
  document.addEventListener("DOMContentLoaded", function () {
    bindAuthForms();
    renderUserPanel();
  });
  window.addEventListener("fortune:save-change", renderUserPanel);
  window.addEventListener("fortune:user-change", renderUserPanel);
})();
