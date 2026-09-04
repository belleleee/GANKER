document.addEventListener("DOMContentLoaded", function () {
  var game = document.querySelector("#stall-game");
  if (!game) return;

  var products = [
    { id: "soda", name: "汽水", icon: "🥤", price: 8, cost: 3 },
    { id: "popsicle", name: "棒冰", icon: "🍦", price: 5, cost: 2 },
    { id: "pencil", name: "铅笔", icon: "✏️", price: 2, cost: 1 },
    { id: "notebook", name: "本子", icon: "📓", price: 4, cost: 2 },
    { id: "towel", name: "毛巾", icon: "🧺", price: 6, cost: 3 }
  ];
  var orders = [
    { soda: 1, pencil: 1 }, { popsicle: 2 }, { notebook: 1, soda: 1 },
    { towel: 1, pencil: 1 }, { popsicle: 1, notebook: 1 }, { soda: 2 }
  ];
  var state = { day: 1, cash: 40, resolved: 0, served: 0, orderIndex: 0, stock: [], deliveries: [], customer: null, config: {}, customerTimer: null, patienceTimer: null, timers: [] };
  products.forEach(function (product) { state.config[product.id] = "normal"; });

  function productById(id) { return products.filter(function (product) { return product.id === id; })[0]; }
  function formatCash(value) { return (value < 0 ? "-¥" + Math.abs(value) : "¥" + value).toLocaleString("zh-CN"); }
  function deliveryTime(product) { return state.config[product.id] === "fast" ? 2000 : 4500; }
  function deliveryCost(product) { return product.cost + (state.config[product.id] === "fast" ? 2 : 0); }
  function updateHud() { game.querySelectorAll("[data-day]").forEach(function (node) { node.textContent = state.day; }); game.querySelectorAll("[data-cash]").forEach(function (node) { node.textContent = formatCash(state.cash); }); }
  function setFeedback(text) { game.querySelector("[data-customer-feedback]").textContent = text; }
  function renderConfig() {
    var box = game.querySelector("[data-restock-config]"); box.innerHTML = "";
    products.forEach(function (product) {
      var card = document.createElement("article"); card.className = "restock-item";
      card.innerHTML = "<span>" + product.icon + "</span><div><b>" + product.name + "</b><small>仓库成本 " + formatCash(product.cost) + "</small></div>";
      ["normal", "fast"].forEach(function (mode) {
        var button = document.createElement("button"); button.type = "button";
        button.className = state.config[product.id] === mode ? "selected" : "";
        button.textContent = mode === "normal" ? "常规 4.5秒" : "急送 2秒 +¥2";
        button.addEventListener("click", function () { state.config[product.id] = mode; renderConfig(); });
        card.appendChild(button);
      });
      box.appendChild(card);
    });
  }
  function renderStock() {
    var box = game.querySelector("[data-stock-windows]"); box.innerHTML = "";
    for (var index = 0; index < 6; index += 1) {
      var product = productById(state.stock[index]);
      var slot = document.createElement("button"); slot.type = "button";
      if (product) {
        slot.className = "stock-slot filled"; slot.innerHTML = "<span>" + product.icon + "</span><b>" + product.name + "</b>";
        slot.addEventListener("click", (function (slotIndex) { return function () { sellFromStock(slotIndex); }; })(index));
      } else { slot.className = "stock-slot"; slot.innerHTML = "<span>空</span><b>备货窗口</b>"; }
      box.appendChild(slot);
    }
  }
  function renderWarehouse() {
    var box = game.querySelector("[data-warehouse-items]"); box.innerHTML = "";
    products.forEach(function (product) {
      var button = document.createElement("button"); button.type = "button"; button.className = "warehouse-product";
      button.innerHTML = "<span>" + product.icon + "</span><b>调 " + product.name + "</b><small>" + (deliveryTime(product) / 1000) + " 秒 · 成本 " + formatCash(deliveryCost(product)) + "</small>";
      button.addEventListener("click", function () { requestProduct(product); });
      box.appendChild(button);
    });
  }
  function renderDeliveries() {
    var queue = game.querySelector("[data-delivery-queue]");
    if (!state.deliveries.length) { queue.textContent = "仓库暂时没有在途商品。"; return; }
    queue.innerHTML = "在途：" + state.deliveries.map(function (delivery) { var product = productById(delivery.id); return "<span>" + product.icon + product.name + "</span>"; }).join("");
  }
  function renderCustomer() {
    var customer = state.customer;
    var needs = game.querySelector("[data-customer-needs]");
    if (!customer) { game.querySelector("[data-customer-status]").textContent = "下一位顾客正在赶来"; game.querySelector("[data-customer-name]").textContent = "小摊刚开张"; needs.textContent = "先从仓库调货，留出窗口备好常卖商品。"; game.querySelector("[data-patience]").style.width = "0%"; return; }
    game.querySelector("[data-customer-status]").textContent = "顾客正在等待";
    game.querySelector("[data-customer-name]").textContent = "顾客要买：";
    needs.innerHTML = "";
    Object.keys(customer.needs).forEach(function (id) {
      var product = productById(id); var fulfilled = customer.fulfilled[id] || 0;
      var tag = document.createElement("span"); tag.className = fulfilled >= customer.needs[id] ? "done" : "";
      tag.textContent = product.icon + " " + product.name + " " + fulfilled + "/" + customer.needs[id]; needs.appendChild(tag);
    });
    game.querySelector("[data-patience]").style.width = customer.time / 14 * 100 + "%";
  }
  function requestProduct(product) {
    var cost = deliveryCost(product);
    state.cash -= cost;
    var delivery = { id: product.id, cost: cost };
    state.deliveries.push(delivery); updateHud(); renderDeliveries(); setFeedback(product.name + " 已从仓库调出，约 " + (deliveryTime(product) / 1000) + " 秒后到达。");
    var timer = window.setTimeout(function () {
      state.deliveries = state.deliveries.filter(function (entry) { return entry !== delivery; });
      if (state.stock.length < 6) { state.stock.push(product.id); setFeedback(product.name + " 到货，已放进备货窗口。"); }
      else { setFeedback(product.name + " 到货时窗口已满，只能废弃。进货成本 " + formatCash(cost) + " 无法收回。"); }
      renderStock(); renderDeliveries();
    }, deliveryTime(product));
    state.timers.push(timer);
  }
  function isOrderComplete() { return Object.keys(state.customer.needs).every(function (id) { return (state.customer.fulfilled[id] || 0) >= state.customer.needs[id]; }); }
  function clearCustomerTimers() { window.clearTimeout(state.customerTimer); window.clearInterval(state.patienceTimer); state.customerTimer = null; state.patienceTimer = null; }
  function scheduleCustomer(delay) {
    clearCustomerTimers();
    state.customerTimer = window.setTimeout(function () {
      var needs = orders[state.orderIndex % orders.length]; state.orderIndex += 1;
      state.customer = { needs: Object.assign({}, needs), fulfilled: {}, time: 14 };
      setFeedback("顾客已经来到摊前，请从备货窗口交货。 "); renderCustomer();
      state.patienceTimer = window.setInterval(function () {
        if (!state.customer) return;
        state.customer.time -= 1; renderCustomer();
        if (state.customer.time <= 0) customerLeaves();
      }, 1000);
    }, delay || 2200);
  }
  function resolveCustomer(success) {
    clearCustomerTimers(); state.customer = null; state.resolved += 1;
    renderCustomer(); renderStock(); updateHud();
    if (state.resolved >= 4) endDay(); else scheduleCustomer(1800);
  }
  function customerLeaves() {
    state.cash -= 12;
    setFeedback("顾客生气离开并投诉，赔付 " + formatCash(12) + "。下次要更早备货。 ");
    resolveCustomer(false);
  }
  function sellFromStock(index) {
    if (!state.customer) { setFeedback("顾客还没来，先用仓库调货备好窗口。 "); return; }
    var id = state.stock[index]; var need = state.customer.needs[id] || 0; var fulfilled = state.customer.fulfilled[id] || 0;
    if (fulfilled >= need) { setFeedback("这位顾客不需要这个商品，先看清需求。 "); return; }
    state.stock.splice(index, 1);
    state.customer.fulfilled[id] = fulfilled + 1;
    state.cash += productById(id).price;
    setFeedback(productById(id).name + " 已卖出，窗口空了一格，可以及时从仓库补货。 ");
    if (isOrderComplete()) { state.cash += 5; state.served += 1; setFeedback("顾客满意离开，本单额外获得 ¥5 好评。 "); resolveCustomer(true); }
    else { renderStock(); renderCustomer(); updateHud(); }
  }
  function enterStall() {
    game.querySelector("[data-hub-scene]").hidden = true;
    game.querySelector("[data-prep-scene]").hidden = true;
    game.querySelector("[data-stall-scene]").hidden = false;
    if (!state.stock.length) state.stock = ["soda", "popsicle", "pencil", "notebook"];
    renderStock(); renderWarehouse(); renderDeliveries(); renderCustomer(); updateHud(); scheduleCustomer();
  }
  function endDay() {
    clearCustomerTimers();
    game.querySelector("[data-day-end-title]").textContent = state.day >= 2 ? "两天经营结束" : "今天先到这里";
    game.querySelector("[data-day-end-copy]").textContent = state.day >= 2 ? "你学会了计算调货速度、库存窗口与顾客耐心的关系。" : "明天可以重新配置每种商品的仓库调货时间，再继续营业。";
    game.querySelector("[data-next-day]").textContent = state.day >= 2 ? "结算第一桶金" : "回到补货安排";
    game.querySelector("[data-day-end]").hidden = false;
  }
  function nextDay() {
    game.querySelector("[data-day-end]").hidden = true;
    if (state.day >= 2) { showResult(); return; }
    state.day += 1; state.resolved = 0;
    game.querySelector("[data-stall-scene]").hidden = true;
    game.querySelector("[data-hub-scene]").hidden = false;
    renderConfig(); updateHud();
  }
  function showResult() { game.querySelector("[data-result-cash]").textContent = formatCash(state.cash); game.querySelector("[data-result]").hidden = false; }
  function resetGame() {
    state.timers.forEach(function (timer) { window.clearTimeout(timer); }); clearCustomerTimers();
    state = { day: 1, cash: 40, resolved: 0, served: 0, orderIndex: 0, stock: [], deliveries: [], customer: null, config: {}, customerTimer: null, patienceTimer: null, timers: [] };
    products.forEach(function (product) { state.config[product.id] = "normal"; });
    game.querySelector("[data-result]").hidden = true; game.querySelector("[data-day-end]").hidden = true;
    game.querySelector("[data-stall-scene]").hidden = true; game.querySelector("[data-prep-scene]").hidden = true; game.querySelector("[data-hub-scene]").hidden = false;
    renderConfig(); updateHud();
  }
  game.querySelectorAll("[data-enter-stall]").forEach(function (button) { button.addEventListener("click", enterStall); });
  game.querySelector("[data-open-config]").addEventListener("click", function () { game.querySelector("[data-hub-scene]").hidden = true; game.querySelector("[data-prep-scene]").hidden = false; renderConfig(); });
  game.querySelector("[data-back-hub]").addEventListener("click", function () { game.querySelector("[data-prep-scene]").hidden = true; game.querySelector("[data-hub-scene]").hidden = false; });
  game.querySelector("[data-next-day]").addEventListener("click", nextDay);
  game.querySelector("[data-restart]").addEventListener("click", resetGame);
  document.addEventListener("prologue:complete", function () { game.hidden = false; resetGame(); }, { once: true });
});
