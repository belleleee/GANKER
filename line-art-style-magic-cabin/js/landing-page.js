'use strict';

const APP_USERS_KEY = 'magicCabin.users.v1';
const APP_SESSION_KEY = 'magicCabin.session.v1';

const MEMBER_PROFILES = {
    zhou: {
        name: '周维健',
        role: '网站编辑',
        intro: '来自山东的普通计科学生，爱玩游戏，正在努力学习 HTML、CSS 和 JS。负责把项目内容整理成可以被玩家看懂、能顺利进入体验的网页结构。',
        work: '展示页面、网站文字整理、入口内容编辑',
        tags: '山东、计科、游戏、前端学习',
        image: 'menber/周.jpg'
    },
    huang: {
        name: '黄梓严',
        role: '文本、日志记录',
        intro: 'MOBA 和自走棋类爱好者，平时爱打网球和羽毛球。项目中负责文本资料与过程记录，让作品介绍和开发痕迹更加完整。',
        work: '文本撰写、日志记录、资料归档',
        tags: 'MOBA、自走棋、网球、羽毛球',
        image: 'menber/黄.jpg'
    },
    kang: {
        name: '康羿盟',
        role: '程序员',
        intro: 'Deltarune 厨兼音游爱好者，有一年编程经验，正在努力生存中。主要负责把交互想法落到代码里，让场景功能可以真实运行。',
        work: '程序开发、交互实现、功能调试',
        tags: 'Deltarune、音游、编程、调试',
        image: 'menber/康.jpg'
    },
    he: {
        name: '何恬',
        role: '程序员',
        intro: '赛博泥瓦匠，闲暇时间听歌撸猫，人生目标是猫猫自由和 Bug free。项目中负责程序实现与问题修补，把看起来松散的系统砌成能玩的作品。',
        work: '程序开发、问题修复、体验完善',
        tags: '听歌、猫猫自由、Bug free、赛博泥瓦匠',
        image: 'menber/何.jpg'
    },
    jia: {
        name: '贾翌宸',
        role: '文本、CIO',
        intro: 'FPS 玩家，也喜欢看动画片。项目中负责文本相关内容和信息整理，帮助团队把作品说明、成员信息和展示内容组织起来。',
        work: '文本整理、信息管理、展示内容协作',
        tags: 'FPS、动画片、文本、CIO',
        image: 'menber/贾.jpg'
    },
    ren: {
        name: '任嘉佑',
        role: '队长',
        intro: '作为团队队长，负责统筹所有工作，安排所有人的任务，协调开发节奏并推动项目按计划完成。',
        work: '团队统筹、任务分配、进度协调、项目推进',
        tags: '队长、统筹、任务安排、团队协作',
        image: 'menber/任.jpg'
    }
};

const authMsg = document.getElementById('authMsg');
const logoutBtn = document.getElementById('logoutBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showLoginBtn = document.getElementById('showLoginBtn');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const membersModal = document.getElementById('membersModal');
const memberListView = document.getElementById('memberListView');
const memberDetailView = document.getElementById('memberDetailView');
const memberDetailName = document.getElementById('memberDetailName');
const memberDetailRole = document.getElementById('memberDetailRole');
const memberDetailText = document.getElementById('memberDetailText');
const memberDetailWork = document.getElementById('memberDetailWork');
const memberDetailTags = document.getElementById('memberDetailTags');
const memberPortrait = document.getElementById('memberPortrait');
const memberPortraitImg = document.getElementById('memberPortraitImg');

function readJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
        return fallback;
    }
}

function writeJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (err) {
        return false;
    }
}

function hashText(text) {
    let h = 5381;
    for (let i = 0; i < text.length; i++) h = ((h << 5) + h) ^ text.charCodeAt(i);
    return (h >>> 0).toString(36);
}

function boundedText(value, maxLen) {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, maxLen);
}

function loadUsers() {
    const users = readJson(APP_USERS_KEY, []);
    return Array.isArray(users) ? users : [];
}

function saveUsers(users) {
    return writeJson(APP_USERS_KEY, users);
}

function updateAuthMessage(text) {
    authMsg.textContent = text;
}

function switchAuth(mode) {
    const login = mode === 'login';
    loginForm.classList.toggle('hidden', !login);
    registerForm.classList.toggle('hidden', login);
    showLoginBtn.classList.toggle('on', login);
    showRegisterBtn.classList.toggle('on', !login);
}

function setCurrentUser(user) {
    if (user) writeJson(APP_SESSION_KEY, { id: user.id });
    updateAuthMessage(user ? '已登录：' + user.name + '，存档会绑定到这个账号。' : '未登录也可以游客进入，登录后会使用独立存档。');
    if (logoutBtn) logoutBtn.hidden = !user;
}

function loadSessionUser() {
    const session = readJson(APP_SESSION_KEY, null);
    if (!session || typeof session.id !== 'string') return null;
    return loadUsers().find(user => user.id === session.id) || null;
}

function logoutUser() {
    try {
        localStorage.removeItem(APP_SESSION_KEY);
    } catch (err) { }
    setCurrentUser(null);
}

function registerUser() {
    const name = boundedText(document.getElementById('registerName').value, 18);
    const memberId = boundedText(document.getElementById('registerId').value, 18);
    const password = document.getElementById('registerPass').value;
    if (name.length < 2 || password.length < 4) {
        updateAuthMessage('用户名至少 2 位，密码至少 4 位。');
        return;
    }
    const users = loadUsers();
    if (users.some(user => user.name === name)) {
        updateAuthMessage('这个用户名已经注册过了。');
        return;
    }
    const user = {
        id: 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
        name,
        memberId,
        pass: hashText(name + ':' + password),
        createdAt: new Date().toISOString()
    };
    users.push(user);
    if (!saveUsers(users)) {
        updateAuthMessage('浏览器拒绝写入本地数据，注册失败。');
        return;
    }
    setCurrentUser(user);
    switchAuth('login');
    updateAuthMessage('注册成功：' + user.name + '，可以进入游戏了。');
}

function loginUser() {
    const name = boundedText(document.getElementById('loginName').value, 18);
    const password = document.getElementById('loginPass').value;
    const user = loadUsers().find(item => item.name === name);
    if (!user || user.pass !== hashText(name + ':' + password)) {
        updateAuthMessage('用户名或密码不对。');
        return;
    }
    setCurrentUser(user);
}

function showMemberList() {
    memberListView.hidden = false;
    memberDetailView.hidden = true;
}

function openMembers() {
    showMemberList();
    membersModal.hidden = false;
    document.getElementById('closeMembersBtn').focus();
}

function closeMembers() {
    membersModal.hidden = true;
    showMemberList();
}

function showMemberDetail(key) {
    const member = MEMBER_PROFILES[key];
    if (!member) return;
    memberDetailName.textContent = member.name;
    memberDetailRole.textContent = member.role;
    memberDetailText.textContent = member.intro;
    memberDetailWork.textContent = member.work;
    memberDetailTags.textContent = member.tags;
    memberPortrait.dataset.initial = member.name.slice(0, 1);
    memberPortrait.classList.remove('fallback');
    memberPortraitImg.alt = member.name + '头像';
    memberPortraitImg.src = member.image;
    memberPortraitImg.onerror = () => memberPortrait.classList.add('fallback');
    memberListView.hidden = true;
    memberDetailView.hidden = false;
    document.getElementById('backToMembersBtn').focus();
}

function bindClick(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
}

bindClick('enterGameBtn', () => { window.location.href = 'game.html'; });
bindClick('continueGameBtn', () => { window.location.href = 'game.html?load=1'; });
bindClick('openMembersBtn', openMembers);
bindClick('closeMembersBtn', closeMembers);
bindClick('backToMembersBtn', showMemberList);
bindClick('showLoginBtn', () => switchAuth('login'));
bindClick('showRegisterBtn', () => switchAuth('register'));
bindClick('registerBtn', registerUser);
bindClick('loginBtn', loginUser);
bindClick('logoutBtn', logoutUser);

document.querySelectorAll('.memberAvatar[data-member]').forEach(card => {
    card.addEventListener('click', () => showMemberDetail(card.dataset.member));
});

membersModal.addEventListener('click', e => {
    if (e.target === membersModal) closeMembers();
});

for (const id of ['loginName', 'loginPass']) {
    document.getElementById(id).addEventListener('keydown', e => {
        if (e.key === 'Enter') loginUser();
    });
}

for (const id of ['registerName', 'registerId', 'registerPass']) {
    document.getElementById(id).addEventListener('keydown', e => {
        if (e.key === 'Enter') registerUser();
    });
}

addEventListener('keydown', e => {
    if (e.key === 'Escape' && !membersModal.hidden) closeMembers();
});

setCurrentUser(loadSessionUser());
if (window.location.hash === '#team') openMembers();
