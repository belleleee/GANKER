(function () {
  var WIDTH = 1280;
  var HEIGHT = 720;
  var BACKGROUND = "assets/images/宗庆后/摊子.png";

  var products = [
    { id: "soda", name: "汽水", icon: "🥤", price: 8, cost: 3, weight: 5, station: "cold", duration: 3.2 },
    { id: "popsicle", name: "棒冰", icon: "🍦", price: 5, cost: 2, weight: 5, station: "cold", duration: 4.2 },
    { id: "pencil", name: "铅笔", icon: "✏️", price: 2, cost: 1, weight: 4, station: "pack", duration: 2.4 },
    { id: "notebook", name: "本子", icon: "📓", price: 4, cost: 2, weight: 4, station: "pack", duration: 2.8 },
    { id: "towel", name: "毛巾", icon: "🧺", price: 6, cost: 3, weight: 2, station: "textile", duration: 5.2 }
  ];

  var stations = [
    { id: "cold", name: "冰桶", icon: "🧊", capacity: 2, x: 108, y: 486, w: 282, h: 82 },
    { id: "pack", name: "文具台", icon: "📦", capacity: 2, x: 500, y: 486, w: 282, h: 82 },
    { id: "textile", name: "杂货台", icon: "🧺", capacity: 1, x: 890, y: 486, w: 282, h: 82 }
  ];

  var settings = {
    startingCash: 10,
    targetCash: 110,
    targetOrders: 6,
    stockSlots: 6,
    maxCustomers: 3,
    roundSeconds: 95,
    spawnEvery: 5.2,
    firstSpawn: 1,
    minPatience: 18,
    maxPatience: 30,
    complaintCost: 10,
    orderBonus: 5,
    initialStock: ["soda", "popsicle", "pencil", "notebook"]
  };

  function render(options) {
    var game = options.game;
    var scene = options.scene;
    var state = options.state;
    var updateHud = options.updateHud;
    var formatCash = options.formatCash;
    var finishScene = options.finishScene;
    var body = game.querySelector("[data-stage-body]");
    var feedback = game.querySelector("[data-stage-feedback]");
    state.cash = Math.max(state.cash, settings.startingCash);
    updateHud();
    var openingCash = state.cash;
    var background = new Image();
    var lastTime = 0;
    var rafId = null;

    var mini = {
      started: false,
      ended: false,
      completedOrders: 0,
      failedOrders: 0,
      remaining: settings.roundSeconds,
      spawnIn: settings.firstSpawn,
      inventory: settings.initialStock.map(makeStock),
      customers: [],
      jobs: [],
      hover: null,
      retryReady: false,
      showHelp: false,
      message: "先点击商品预制几件高频货，再点击开始营业。"
    };

    body.innerHTML = "" +
      "<div class='stall-canvas-wrap'>" +
        "<canvas class='stall-canvas' data-stall-canvas width='" + WIDTH + "' height='" + HEIGHT + "'></canvas>" +
      "</div>";

    var canvas = body.querySelector("[data-stall-canvas]");
    var ctx = canvas.getContext("2d");

    feedback.hidden = true;
    feedback.textContent = "";
    background.onload = draw;
    background.src = BACKGROUND;

    function makeStock(id) {
      return { id: id, uid: uniqueId("stock") };
    }

    function uniqueId(prefix) {
      return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    }

    function productById(id) {
      return products.filter(function (product) { return product.id === id; })[0];
    }

    function stationById(id) {
      return stations.filter(function (station) { return station.id === id; })[0];
    }

    function productCost(product) {
      return product.cost;
    }

    function productDuration(product) {
      return product.duration;
    }

    function setCash(value) {
      state.cash = Math.max(0, Math.round(value));
      updateHud();
    }

    function setMessage(value) {
      mini.message = value;
    }

    function weightedProduct() {
      var total = products.reduce(function (sum, product) { return sum + product.weight; }, 0);
      var roll = Math.random() * total;
      for (var index = 0; index < products.length; index += 1) {
        roll -= products[index].weight;
        if (roll <= 0) return products[index];
      }
      return products[0];
    }

    function generateOrder() {
      var roll = Math.random();
      var size = roll > 0.8 ? 3 : roll > 0.36 ? 2 : 1;
      var order = [];
      while (order.length < size) {
        order.push({ id: weightedProduct().id, status: "未开始" });
      }
      return order;
    }

    function addCustomer() {
      if (!mini.started || mini.ended || mini.customers.length >= settings.maxCustomers) return;
      var patience = settings.minPatience + Math.floor(Math.random() * (settings.maxPatience - settings.minPatience + 1));
      mini.customers.push({
        id: uniqueId("customer"),
        name: ["学生", "工人", "家长", "邻居", "路人"][Math.floor(Math.random() * 5)],
        avatar: ["#c7623e", "#356489", "#6d9047", "#81543d", "#b85b78"][Math.floor(Math.random() * 5)],
        needs: generateOrder(),
        patience: patience,
        maxPatience: patience
      });
      setMessage("新顾客到了，先处理耐心最低或快完成的订单。");
    }

    function createJob(product) {
      if (mini.ended) return;
      var cost = productCost(product);
      if (state.cash < cost) {
        setMessage("现金不够，暂时不能制作 " + product.name + "。");
        return;
      }
      setCash(state.cash - cost);
      mini.jobs.push({
        id: uniqueId("job"),
        productId: product.id,
        station: product.station,
        duration: productDuration(product),
        elapsed: 0,
        status: "queued"
      });
      markNeed(product.id, "制作中");
      setMessage(product.name + " 已加入制作队列。");
      pumpStations();
    }

    function pumpStations() {
      stations.forEach(function (station) {
        var active = mini.jobs.filter(function (job) { return job.station === station.id && job.status === "working"; }).length;
        mini.jobs.filter(function (job) { return job.station === station.id && job.status === "queued"; })
          .slice(0, station.capacity - active)
          .forEach(function (job) {
            job.status = "working";
            job.elapsed = 0;
          });
      });
    }

    function markNeed(id, status) {
      var needs = openNeeds().filter(function (entry) {
        return entry.need.id === id && entry.need.status === "未开始";
      });
      if (needs[0]) needs[0].need.status = status;
    }

    function markReady(id) {
      var needs = openNeeds().filter(function (entry) {
        return entry.need.id === id && entry.need.status === "制作中";
      });
      if (needs[0]) needs[0].need.status = "已完成";
    }

    function openNeeds() {
      var list = [];
      mini.customers
        .slice()
        .sort(function (a, b) { return customerPriority(b) - customerPriority(a); })
        .forEach(function (customer) {
          customer.needs.forEach(function (need) {
            if (need.status !== "已交付") list.push({ customer: customer, need: need });
          });
        });
      return list;
    }

    function customerPriority(customer) {
      var remaining = customer.needs.filter(function (need) { return need.status !== "已交付"; }).length;
      var value = customer.needs.reduce(function (sum, need) { return sum + productById(need.id).price; }, 0);
      return 70 / Math.max(1, customer.patience) + 18 / Math.max(1, remaining) + value / 18;
    }

    function serveNeed(customer, need) {
      if (!mini.started || mini.ended || need.status === "已交付") return;
      var slot = mini.inventory.findIndex(function (item) { return item.id === need.id; });
      if (slot < 0) {
        setMessage("没有现成的 " + productById(need.id).name + "，需要先制作。");
        return;
      }
      var item = mini.inventory.splice(slot, 1)[0];
      need.status = "已交付";
      setCash(state.cash + productById(item.id).price);
      if (customer.needs.every(function (entry) { return entry.status === "已交付"; })) {
        completeCustomer(customer);
      } else {
        setMessage("已交付 " + productById(item.id).name + "，这个顾客还差别的商品。");
      }
    }

    function completeCustomer(customer) {
      mini.completedOrders += 1;
      mini.customers = mini.customers.filter(function (entry) { return entry !== customer; });
      setCash(state.cash + settings.orderBonus);
      setMessage(customer.name + " 满意离开，额外奖励 " + formatCash(settings.orderBonus) + "。");
      if (!mini.ended) addCustomer();
      maybeFinish();
    }

    function failCustomer(customer) {
      mini.failedOrders += 1;
      mini.customers = mini.customers.filter(function (entry) { return entry !== customer; });
      setCash(state.cash - settings.complaintCost);
      setMessage(customer.name + " 等太久投诉，赔付 " + formatCash(settings.complaintCost) + "。");
      if (!mini.ended) addCustomer();
    }

    function beginTrading() {
      if (mini.started || mini.ended) return;
      mini.started = true;
      setMessage("开张！点击商品制作，点击顾客气泡里的需求交付。");
      addCustomer();
    }

    function maybeFinish() {
      if (mini.ended) return;
      if (state.cash >= settings.targetCash) {
        mini.ended = true;
        cleanup();
        finishScene(scene, "第一桶金攒够了。你用调度、备货和交付撑起了小摊。", { cash: 1, reputation: 4 });
      } else if (mini.started && mini.remaining <= 0) {
        mini.ended = true;
        mini.retryReady = true;
        setMessage("时间到了但现金还没达标。点击重新摆摊再试一次。");
      }
    }

    function update(dt) {
      if (mini.ended) return;
      mini.jobs.forEach(function (job) {
        if (job.status !== "working") return;
        job.elapsed += dt;
        if (job.elapsed >= job.duration) {
          var product = productById(job.productId);
          job.status = "done";
          if (mini.inventory.length < settings.stockSlots) {
            mini.inventory.push(makeStock(product.id));
            markReady(product.id);
            setMessage(product.name + " 做好了，已放入备货窗口。");
          } else {
            setMessage(product.name + " 做好了，但窗口满了，只能废弃。");
          }
        }
      });
      mini.jobs = mini.jobs.filter(function (job) { return job.status !== "done"; });
      pumpStations();
      if (!mini.started) return;
      mini.remaining = Math.max(0, mini.remaining - dt);
      mini.spawnIn -= dt;
      if (mini.spawnIn <= 0) {
        addCustomer();
        mini.spawnIn = settings.spawnEvery + Math.random() * 2.2;
      }
      mini.customers.slice().forEach(function (customer) {
        customer.patience -= dt;
        if (customer.patience <= 0) failCustomer(customer);
      });
      maybeFinish();
    }

    function handlePointerMove(event) {
      mini.hover = hitTest(getCanvasPoint(event));
      canvas.style.cursor = mini.hover ? "pointer" : "default";
    }

    function handlePointerLeave() {
      mini.hover = null;
      canvas.style.cursor = "default";
    }

    function handlePointerDown(event) {
      var target = hitTest(getCanvasPoint(event));
      if (!target) return;
      event.preventDefault();
      mini.hover = target;
      activateTarget(target);
    }

    function getCanvasPoint(event) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * WIDTH / rect.width,
        y: (event.clientY - rect.top) * HEIGHT / rect.height
      };
    }

    function hitTest(point) {
      if (inside(point, 26, 20, 176, 34)) return { type: "help" };
      if ((!mini.started || mini.retryReady) && inside(point, 1010, 624, 142, 58)) return { type: "start" };
      for (var productIndex = 0; productIndex < products.length; productIndex += 1) {
        var productBox = productButtonRect(productIndex);
        if (inside(point, productBox.x, productBox.y, productBox.w, productBox.h)) {
          return { type: "product", index: productIndex };
        }
      }
      if (mini.started) {
        var needs = customerNeedRects();
        for (var needIndex = 0; needIndex < needs.length; needIndex += 1) {
          var entry = needs[needIndex];
          if (inside(point, entry.x, entry.y, entry.w, entry.h)) {
            return { type: "need", customer: entry.customer, need: entry.need };
          }
        }
      }
      return null;
    }

    function inside(point, x, y, w, h) {
      return point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h;
    }

    function activateTarget(target) {
      if (target.type === "help") {
        mini.showHelp = !mini.showHelp;
      } else if (target.type === "start") {
        if (mini.retryReady) {
          cleanup();
          state.cash = openingCash;
          updateHud();
          render(options);
        } else {
          beginTrading();
        }
      } else if (target.type === "product") {
        createJob(products[target.index]);
      } else if (target.type === "need") {
        serveNeed(target.customer, target.need);
      }
    }

    function loop(now) {
      var dt = Math.min((now - lastTime) / 1000 || 0, 0.08);
      lastTime = now;
      update(dt);
      draw();
      if (!mini.ended || mini.retryReady) rafId = requestAnimationFrame(loop);
    }

    function cleanup() {
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      if (rafId) cancelAnimationFrame(rafId);
      feedback.hidden = false;
    }

    function drawBackground() {
      if (!background.complete || !background.naturalWidth) {
        fill(0, 0, WIDTH, HEIGHT, "#1b302f");
        return;
      }
      var scale = Math.max(WIDTH / background.naturalWidth, HEIGHT / background.naturalHeight);
      var w = background.naturalWidth * scale;
      var h = background.naturalHeight * scale;
      ctx.drawImage(background, (WIDTH - w) / 2, (HEIGHT - h) / 2, w, h);
      fill(0, 0, WIDTH, HEIGHT, "rgba(21, 15, 10, .18)");
      fill(0, 520, WIDTH, 200, "rgba(36, 20, 11, .32)");
    }

    function draw() {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      drawBackground();
      drawHud();
      drawCustomers();
      drawStations();
      drawStock();
      drawProduction();
      drawMessage();
      if (mini.showHelp) drawHelp();
    }

    function drawHud() {
      panel(310, 12, 660, 70, "#f5cf7a");
      drawText("1987 · 小摊实时经营", 344, 38, 18, "#714126", "left");
      drawText(mini.started ? "剩余 " + Math.ceil(mini.remaining) + " 秒" : "准备中", 640, 38, 25, "#243936", "center");
      drawText("现金 " + formatCash(state.cash) + "/" + formatCash(settings.targetCash), 936, 38, 17, "#714126", "right");
      drawText("完成 " + mini.completedOrders + "/" + settings.targetOrders + " 单", 510, 64, 15, "#714126", "center");
      drawText("投诉 " + mini.failedOrders, 770, 64, 15, "#714126", "center");
      panel(26, 20, 176, 34, "#203a35", isHovered("help"));
      drawText("点击帮助", 114, 38, 15, "#fff0bf", "center");
    }

    function drawCustomers() {
      var list = displayedCustomers();
      var positions = [270, 640, 1010];
      list.slice(0, 3).forEach(function (customer, index) {
        drawPerson(positions[index], 325, customer.avatar || "#c7623e", customer.name);
        drawOrderBubble(customer, positions[index] - 72, 112, index);
      });
    }

    function displayedCustomers() {
      return mini.started ? mini.customers.slice().sort(function (a, b) { return customerPriority(b) - customerPriority(a); }) : previewCustomers();
    }

    function previewCustomers() {
      return [
        { name: "学生", avatar: "#b85b78", patience: 1, maxPatience: 1, needs: [{ id: "soda", status: "未开始" }] },
        { name: "工人", avatar: "#356489", patience: 1, maxPatience: 1, needs: [{ id: "popsicle", status: "未开始" }] },
        { name: "邻居", avatar: "#6d9047", patience: 1, maxPatience: 1, needs: [{ id: "pencil", status: "未开始" }] }
      ];
    }

    function drawPerson(x, y, color, name) {
      fill(x - 18, y - 94, 36, 36, "#17242d");
      fill(x - 12, y - 88, 24, 24, "#e5a06f");
      fill(x - 28, y - 58, 56, 74, "#17242d");
      fill(x - 22, y - 52, 44, 62, color);
      fill(x - 4, y - 81, 4, 4, "#221611");
      fill(x + 10, y - 81, 4, 4, "#221611");
      panel(x - 36, y + 19, 72, 24, "#fff0bf");
      drawText(name, x, y + 32, 15, "#17242d", "center");
    }

    function drawOrderBubble(customer, x, y) {
      panel(x, y, 144, 150, "#fff7d6");
      var patienceRate = customer.patience / customer.maxPatience;
      fill(x + 10, y + 14, 8, 120, "#594236");
      fill(x + 10, y + 14 + 120 * (1 - patienceRate), 8, 120 * patienceRate, patienceRate < 0.32 ? "#c84f3b" : "#4fbd5f");
      drawText(mini.started ? "还差 " + remainingNeeds(customer) + " 件" : "未开张", x + 78, y + 21, 14, "#8d4631", "center");
      customer.needs.forEach(function (need, index) {
        var product = productById(need.id);
        var itemY = y + 42 + index * 33;
        var focused = isFocusedNeed(customer, need);
        panel(x + 28, itemY, 98, 27, statusColor(need.status), focused);
        drawText(product.icon + " " + product.name, x + 77, itemY + 15, 17, "#17242d", "center");
      });
    }

    function isFocusedNeed(customer, need) {
      return Boolean(mini.hover && mini.hover.type === "need" && mini.hover.customer === customer && mini.hover.need === need);
    }

    function remainingNeeds(customer) {
      return customer.needs.filter(function (need) { return need.status !== "已交付"; }).length;
    }

    function drawStations() {
      stations.forEach(function (station) {
        var active = mini.jobs.filter(function (job) { return job.station === station.id && job.status === "working"; });
        var queued = mini.jobs.filter(function (job) { return job.station === station.id && job.status === "queued"; });
        panel(station.x, station.y, station.w, station.h, "#2d4b40");
        drawText(station.icon + " " + station.name + " " + active.length + "/" + station.capacity, station.x + 18, station.y + 18, 17, "#fff0bf", "left");
        active.forEach(function (job, index) {
          var product = productById(job.productId);
          var bx = station.x + 18 + index * 126;
          var by = station.y + 38;
          panel(bx, by, 112, 28, "#f6d98a");
          fill(bx + 6, by + 20, Math.max(0, 100 * job.elapsed / job.duration), 5, "#4fbd5f");
          drawText(product.icon + " " + product.name, bx + 56, by + 14, 15, "#17242d", "center");
        });
        if (!active.length) drawText(queued.length ? "排队 " + queued.length + " 件" : "空闲", station.x + station.w - 20, station.y + 59, 15, "#e9cd7d", "right");
      });
    }

    function drawStock() {
      drawSectionTitle("备货窗口", 80, 604);
      for (var index = 0; index < settings.stockSlots; index += 1) {
        var x = 80 + index * 76;
        var item = mini.inventory[index];
        panel(x, 624, 64, 58, item ? "#b9d76c" : "rgba(255, 240, 191, .78)");
        drawText(item ? productById(item.id).icon : "+", x + 32, 647, 23, "#17242d", "center");
        drawText(item ? productById(item.id).name : "空", x + 32, 671, 12, "#17242d", "center");
      }
    }

    function drawProduction() {
      drawSectionTitle("制作指令", 608, 604);
      products.forEach(function (product, index) {
        var box = productButtonRect(index);
        var focused = mini.hover && mini.hover.type === "product" && mini.hover.index === index;
        panel(box.x, box.y, box.w, box.h, "#f0c765", focused);
        drawText(product.icon, box.x + 35, 643, 23, "#17242d", "center");
        drawText(product.name, box.x + 35, 665, 12, "#17242d", "center");
      });
      var retry = mini.retryReady;
      var focusedStart = isHovered("start");
      panel(1010, 624, 142, 58, "#c7623e", focusedStart);
      drawText(retry ? "重新摆摊" : mini.started ? "营业中" : "开始营业", 1081, 653, 16, "#fff0bf", "center");
    }

    function productButtonRect(index) {
      return { x: 552 + index * 82, y: 624, w: 70, h: 58 };
    }

    function customerNeedRects() {
      var positions = [270, 640, 1010];
      var rects = [];
      displayedCustomers().slice(0, 3).forEach(function (customer, customerIndex) {
        var bubbleX = positions[customerIndex] - 72;
        customer.needs.forEach(function (need, needIndex) {
          if (need.status === "已交付") return;
          rects.push({
            x: bubbleX + 28,
            y: 154 + needIndex * 33,
            w: 98,
            h: 27,
            customer: customer,
            need: need
          });
        });
      });
      return rects;
    }

    function isHovered(type) {
      return Boolean(mini.hover && mini.hover.type === type);
    }

    function drawMessage() {
      panel(290, 690, 700, 24, "#203a35");
      drawText(mini.message, 640, 703, 14, "#fff0bf", "center");
    }

    function drawHelp() {
      panel(390, 202, 500, 184, "rgba(255, 247, 214, .94)");
      drawText("操作说明", 640, 232, 24, "#17242d", "center");
      drawText("点击底部商品：把商品加入对应工位制作", 640, 272, 18, "#17242d", "center");
      drawText("点击顾客气泡内的商品：从备货窗口交付", 640, 304, 18, "#17242d", "center");
      drawText("点击开始营业：顾客开始并行出现并倒计时", 640, 336, 18, "#17242d", "center");
      drawText("再次点击左上角帮助，隐藏这张说明", 640, 368, 18, "#17242d", "center");
    }

    function drawSectionTitle(value, x, y) {
      drawText(value, x, y, 16, "#fff0bf", "left");
    }

    function statusColor(status) {
      if (status === "已完成") return "#b9d76c";
      if (status === "制作中") return "#e7a852";
      if (status === "已交付") return "#7f8d86";
      return "#f0c765";
    }

    function panel(x, y, w, h, color, focused) {
      fill(x + 5, y + 5, w, h, "rgba(0, 0, 0, .35)");
      fill(x, y, w, h, "#17242d");
      fill(x + 4, y + 4, w - 8, h - 8, color);
      if (focused) {
        ctx.strokeStyle = "#fff0bf";
        ctx.lineWidth = 4;
        ctx.strokeRect(Math.round(x - 4), Math.round(y - 4), Math.round(w + 8), Math.round(h + 8));
      }
    }

    function fill(x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }

    function drawText(value, x, y, size, color, align) {
      ctx.fillStyle = color;
      ctx.font = "700 " + size + "px 'Courier New', 'Songti SC', serif";
      ctx.textAlign = align || "left";
      ctx.textBaseline = "middle";
      ctx.fillText(value, Math.round(x), Math.round(y));
    }

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    canvas.addEventListener("pointerdown", handlePointerDown);
    state.stageCleanup = cleanup;
    rafId = requestAnimationFrame(loop);
  }

  window.FortuneStallMiniGame = {
    products: products,
    stations: stations,
    settings: settings,
    render: render
  };
})();
