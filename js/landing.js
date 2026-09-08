(function () {
  /* v1.0.1 */
  var header = document.getElementById("site-header");
  var toggle = header.querySelector(".menu-toggle");
  var bg = document.querySelector("[data-parallax='bg']");
  var teamBg = document.querySelector("[data-parallax='team']");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var desktop = window.matchMedia("(min-width: 981px)");
  var ticking = false;

  if (!reduce.matches) document.documentElement.classList.add("js-motion");

  function setOpen(open) {
    header.classList.toggle("is-open", open);
    document.body.classList.toggle("is-nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  }

  toggle.addEventListener("click", function () {
    setOpen(!header.classList.contains("is-open"));
  });

  header.querySelectorAll(".header-panel a").forEach(function (link) {
    link.addEventListener("click", function () {
      setOpen(false);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && header.classList.contains("is-open")) setOpen(false);
  });

  var parallaxImgs = document.querySelectorAll("[data-parallax-img]");
  var parallaxLayers = document.querySelectorAll("[data-parallax-layer]");

  function update() {
    var y = window.scrollY || 0;
    header.classList.toggle("is-scrolled", y > 24);

    var doc = document.documentElement;
    var max = Math.max(1, doc.scrollHeight - window.innerHeight);
    doc.style.setProperty("--p", (y / max).toFixed(4));

    if (bg && !reduce.matches && desktop.matches) {
      bg.style.transform = "translate3d(0, " + (y * 0.42) + "px, 0) scale(1.18)";
    } else if (bg) {
      bg.style.transform = "";
    }

    if (teamBg) {
      if (reduce.matches || !desktop.matches) {
        teamBg.style.transform = "";
      } else {
        var heroShot = teamBg.closest(".contacts-hero");
        var top = heroShot ? heroShot.getBoundingClientRect().top : 0;
        teamBg.style.transform = "translate3d(0, " + (top * -0.28) + "px, 0) scale(1.22)";
      }
    }

    if (!reduce.matches) {
      var vh = window.innerHeight || 1;
      parallaxImgs.forEach(function (img) {
        var amount = parseFloat(img.getAttribute("data-parallax-img")) || 36;
        var box = img.getBoundingClientRect();
        var mid = box.top + box.height / 2;
        img.style.setProperty("--fx-y", (((mid - vh / 2) / vh) * amount).toFixed(1) + "px");
      });
      parallaxLayers.forEach(function (layer) {
        var amount = parseFloat(layer.getAttribute("data-parallax-layer")) || 0.12;
        var box = (layer.parentElement || layer).getBoundingClientRect();
        var mid = box.top + box.height / 2;
        layer.style.setProperty("--fx-y", ((mid - vh / 2) * amount).toFixed(1) + "px");
      });
    }

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  reduce.addEventListener("change", onScroll);
  desktop.addEventListener("change", onScroll);
  update();

  var reveals = document.querySelectorAll("[data-reveal]");
  if (reveals.length) {
    if (reduce.matches || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) {
        el.classList.add("is-in");
      });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
      reveals.forEach(function (el) {
        io.observe(el);
      });
      reveals.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) el.classList.add("is-in");
      });
    }
  }

  var scheme = document.querySelector(".scheme");
  var schemeSvg = scheme && scheme.querySelector(".scheme-lines");
  var schemeNs = "http://www.w3.org/2000/svg";

  function schemePoint(el, box) {
    var r = el.getBoundingClientRect();
    return {
      x: r.left - box.left + r.width / 2,
      y: r.top - box.top + r.height / 2
    };
  }

  function schemeNode(name, attrs) {
    var el = document.createElementNS(schemeNs, name);
    Object.keys(attrs).forEach(function (key) {
      el.setAttribute(key, attrs[key]);
    });
    return el;
  }

  function insetPoint(from, to, pad) {
    var dx = to.x - from.x;
    var dy = to.y - from.y;
    var len = Math.hypot(dx, dy) || 1;
    var t = Math.min(pad / len, 0.45);
    return { x: to.x - dx * t, y: to.y - dy * t };
  }

  function drawScheme() {
    if (!scheme || !schemeSvg) return;
    while (schemeSvg.firstChild) schemeSvg.removeChild(schemeSvg.firstChild);
    if (!window.matchMedia("(min-width: 981px)").matches) return;

    var box = scheme.getBoundingClientRect();
    var w = Math.round(box.width);
    var h = Math.round(box.height);
    var core = scheme.querySelector(".scheme-core");
    if (!core || w < 40 || h < 40) return;

    schemeSvg.setAttribute("viewBox", "0 0 " + w + " " + h);

    var center = schemePoint(core, box);
    var gems = scheme.querySelectorAll(".scheme-orbit .channel-gem");
    var poly = [];

    gems.forEach(function (gem) {
      var p = schemePoint(gem, box);
      poly.push(p.x + "," + p.y);
      var a = insetPoint(p, center, 18);
      var b = insetPoint(center, p, 10);
      schemeSvg.appendChild(schemeNode("line", {
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        class: "scheme-spoke"
      }));
      if (!reduce.matches) {
        var bead = schemeNode("circle", {
          r: "2.8",
          class: "scheme-bead"
        });
        bead.appendChild(schemeNode("animateMotion", {
          dur: (1.6 + poly.length * 0.18).toFixed(2) + "s",
          repeatCount: "indefinite",
          path: "M" + a.x + " " + a.y + " L" + b.x + " " + b.y
        }));
        schemeSvg.appendChild(bead);
      }
    });

    if (poly.length) {
      schemeSvg.insertBefore(schemeNode("polygon", {
        points: poly.join(" "),
        class: "scheme-hex"
      }), schemeSvg.firstChild);
    }
  }

  drawScheme();
  window.addEventListener("resize", drawScheme);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(drawScheme);
  }

  var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var cursor = document.querySelector(".cursor");
  if (cursor && fine.matches && !reduce.matches) {
    document.documentElement.classList.add("has-cursor");
    var cursorX = window.innerWidth / 2;
    var cursorY = window.innerHeight / 2;
    var cursorDrawX = cursorX;
    var cursorDrawY = cursorY;
    var cursorRaf = 0;
    var gold = document.querySelector(".guarantee");

    function overGold() {
      if (!gold) return false;
      var r = gold.getBoundingClientRect();
      return cursorX >= r.left && cursorX <= r.right && cursorY >= r.top && cursorY <= r.bottom;
    }

    function syncCursorTone() {
      cursor.classList.toggle("is-ink", overGold());
    }

    var trailEls = cursor.querySelectorAll(".cursor-trail");
    var trails = Array.prototype.map.call(trailEls, function () {
      return { x: cursorX, y: cursorY };
    });

    function loopCursor() {
      cursorDrawX += (cursorX - cursorDrawX) * 0.22;
      cursorDrawY += (cursorY - cursorDrawY) * 0.22;
      cursor.style.setProperty("--cursor-x", cursorDrawX + "px");
      cursor.style.setProperty("--cursor-y", cursorDrawY + "px");
      var prevX = cursorDrawX;
      var prevY = cursorDrawY;
      trails.forEach(function (trail, i) {
        var ease = 0.1 - i * 0.02;
        trail.x += (prevX - trail.x) * ease;
        trail.y += (prevY - trail.y) * ease;
        trailEls[i].style.setProperty("--trail-x", trail.x + "px");
        trailEls[i].style.setProperty("--trail-y", trail.y + "px");
        prevX = trail.x;
        prevY = trail.y;
      });
      cursorRaf = window.requestAnimationFrame(loopCursor);
    }

    document.addEventListener("pointermove", function (e) {
      cursorX = e.clientX;
      cursorY = e.clientY;
      syncCursorTone();
    });

    window.addEventListener("scroll", syncCursorTone, { passive: true });

    document.addEventListener("pointerover", function (e) {
      var hot = e.target.closest("a, button, .btn, .call-fab, .versus-row, .quiz-card, .channel, .slider-btn, .voice, .voice-more-btn, .voices-rating--link, .process-node, .fear-see li, .faq-list summary, .pledge, .trust-cast li");
      cursor.classList.toggle("is-hot", Boolean(hot));
    });

    loopCursor();
  }

  var process = document.querySelector(".process");
  if (process) {
    var nodes = Array.prototype.slice.call(process.querySelectorAll(".process-node"));
    var stage = process.querySelector(".process-stage");
    var stagePhoto = process.querySelector(".process-stage-photo img");
    var stageNum = process.querySelector(".process-stage-num");
    var stageTitle = process.querySelector(".process-stage-title");
    var stageCap = process.querySelector(".process-stage-cap");
    var processImages = {};
    var active = 0;
    var primed = false;
    var processScrollRaf = 0;

    nodes.forEach(function (node) {
      var src = node.getAttribute("data-image");
      if (!src || processImages[src]) return;
      var img = new Image();
      img.decoding = "async";
      img.src = src;
      processImages[src] = img;
    });

    function playProcessSwap() {
      if (!primed || !stage || reduce.matches) return;
      stage.classList.remove("is-swap");
      void stage.offsetWidth;
      stage.classList.add("is-swap");
    }

    function sameProcessImage(image) {
      if (!stagePhoto || !image) return false;
      var current = stagePhoto.getAttribute("src") || stagePhoto.src || "";
      return current === image || current.endsWith("/" + image) || stagePhoto.src.endsWith("/" + image);
    }

    function setProcessPhoto(image, alt) {
      if (!stagePhoto || !image || sameProcessImage(image)) return;

      var applyPhoto = function () {
        stagePhoto.src = image;
        if (alt) stagePhoto.alt = alt;
        playProcessSwap();
      };

      var cached = processImages[image];
      if (cached && cached.complete) {
        applyPhoto();
        return;
      }

      var loader = cached || new Image();
      loader.decoding = "async";
      loader.addEventListener("load", function onProcessPhotoLoad() {
        processImages[image] = loader;
        applyPhoto();
      }, { once: true });
      if (!cached) {
        loader.src = image;
        processImages[image] = loader;
      }
    }

    function setProcessStep(index) {
      if (!nodes.length) return;
      var next = Math.max(0, Math.min(nodes.length - 1, index));
      if (primed && next === active) return;
      active = next;
      var node = nodes[active];
      nodes.forEach(function (el, i) {
        el.classList.toggle("is-on", i === active);
        if (i === active) el.setAttribute("aria-current", "step");
        else el.removeAttribute("aria-current");
      });
      process.style.setProperty("--process-p", String(nodes.length > 1 ? active / (nodes.length - 1) : 1));
      if (stageNum) stageNum.textContent = node.getAttribute("data-num") || "";
      if (stageTitle) stageTitle.textContent = node.getAttribute("data-title") || "";
      if (stageCap) stageCap.textContent = node.getAttribute("data-cap") || "";
      setProcessPhoto(node.getAttribute("data-image"), node.getAttribute("data-alt") || "");
      primed = true;
    }

    function stepFromScroll() {
      var rect = process.getBoundingClientRect();
      var range = Math.max(1, process.offsetHeight - window.innerHeight);
      var passed = Math.min(range, Math.max(0, -rect.top));
      var p = passed / range;
      var index = Math.min(nodes.length - 1, Math.floor(p * nodes.length));
      if (p >= 0.97) index = nodes.length - 1;
      setProcessStep(index);
    }

    function onProcessScroll() {
      if (processScrollRaf) return;
      processScrollRaf = window.requestAnimationFrame(function () {
        processScrollRaf = 0;
        stepFromScroll();
      });
    }

    nodes.forEach(function (node, i) {
      node.addEventListener("click", function () {
        setProcessStep(i);
      });
    });

    process.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        setProcessStep(active + 1);
        nodes[active].focus();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setProcessStep(active - 1);
        nodes[active].focus();
      }
    });

    if (reduce.matches) {
      setProcessStep(0);
    } else {
      window.addEventListener("scroll", onProcessScroll, { passive: true });
      window.addEventListener("resize", onProcessScroll);
      stepFromScroll();
    }
  }

  var scenes = document.querySelectorAll("[data-scene]");
  if (scenes.length) {
    function countProof(el) {
      var to = parseInt(el.getAttribute("data-count"), 10);
      if (isNaN(to)) return;
      if (reduce.matches) {
        el.textContent = String(to);
        return;
      }
      var start = performance.now();
      var dur = 780;
      function tick(now) {
        var t = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(to * eased));
        if (t < 1) window.requestAnimationFrame(tick);
      }
      el.textContent = "0";
      window.requestAnimationFrame(tick);
    }

    function runSceneCounts(scene) {
      if (scene.dataset.counted === "1") return;
      scene.dataset.counted = "1";
      scene.querySelectorAll("[data-count]").forEach(countProof);
    }

    scenes.forEach(function (scene) {
      if (scene.classList.contains("is-in")) {
        runSceneCounts(scene);
        return;
      }
      if (!("MutationObserver" in window)) return;
      var watch = new MutationObserver(function () {
        if (scene.classList.contains("is-in")) {
          runSceneCounts(scene);
          watch.disconnect();
        }
      });
      watch.observe(scene, { attributes: true, attributeFilter: ["class"] });
    });
  }

  var form = document.getElementById("quiz-form");
  if (form) {
    var steps = form.querySelectorAll(".quiz-step");
    var label = document.getElementById("quiz-step-label");
    var dots = document.querySelectorAll(".quiz-dots li");
    var back = document.getElementById("quiz-back");
    var resultTitle = document.getElementById("quiz-result-title");
    var resultText = document.getElementById("quiz-result-text");
    var done = document.getElementById("quiz-done");
    var current = 1;

    var advanceTimer;
    var mapStage = form.querySelector("[data-quiz-map]");
    var yandexMap = null;
    var districtGeo = {};
    var selectedDistrict = "";
    var DISTRICT_COORDS = {
      "Центр": [52.0862, 23.6885],
      "Восток": [52.1018, 23.7615],
      "Ковалево": [52.0728, 23.7513],
      "Речица": [52.1035, 23.648],
      "Дубровка": [52.1145, 23.668],
      "Граевка": [52.1072, 23.6987],
      "Вулька": [52.0725, 23.7112],
      "Катин Бор": [52.139, 23.638],
      "Березовка": [52.1165, 23.7165],
      "Задворцы": [52.1298, 23.7785],
      "Плоска": [52.1267, 23.7067],
      "Киевка": [52.0975, 23.7133]
    };
    var DISTRICT_QUERY = {
      "Центр": "Беларусь, Брест, проспект Машерова",
      "Восток": "Беларусь, Брест, микрорайон Восток",
      "Ковалево": "Беларусь, Брест, улица Суворова",
      "Речица": "Беларусь, Брест, улица Дачная",
      "Дубровка": "Беларусь, Брест, улица Лейтенанта Рябцева",
      "Граевка": "Беларусь, Брест, улица Фортечная",
      "Вулька": "Беларусь, Брест, улица Сальникова",
      "Катин Бор": "Беларусь, Брест, улица Катин Бор",
      "Березовка": "Беларусь, Брест, улица Радужная",
      "Задворцы": "Беларусь, Брест, улица Задворская",
      "Плоска": "Беларусь, Брест, улица Вересковая",
      "Киевка": "Беларусь, Брест, улица Сикорского"
    };

    function show(n) {
      current = n;
      var board = form.closest(".quiz-board");
      if (board) {
        board.style.setProperty("--quiz-p", n >= 6 ? "1" : ((n - 1) / 4).toFixed(3));
      }
      steps.forEach(function (step) {
        step.classList.toggle("is-on", step.getAttribute("data-step") === String(n));
      });
      if (n < 6) {
        label.textContent = "Шаг " + n + " из 5";
      } else {
        label.textContent = "Ваш результат";
      }
      dots.forEach(function (dot, i) {
        var stepNum = i + 1;
        dot.classList.toggle("is-on", n < 6 ? stepNum === n : false);
        dot.classList.toggle("is-done", n === 6 || stepNum < n);
      });
      if (back) back.hidden = n === 1;
      if (n === 1 && yandexMap) {
        window.setTimeout(fitDistricts, 60);
      }
    }

    function paintDistrict(name) {
      var hot = name && name !== "Другой район" ? name : "";
      Object.keys(districtGeo).forEach(function (key) {
        var item = districtGeo[key];
        var on = key === hot;
        item.placemark.options.set({
          preset: on ? "islands#redCircleDotIcon" : "islands#circleDotIcon",
          iconColor: on ? "#c4a265" : "#6b4f9a",
          zIndex: on ? 700 : 400
        });
        if (item.placemark.hint) {
          if (on) item.placemark.hint.open();
          else item.placemark.hint.close();
        }
      });
    }

    function setDistrictHot(value) {
      form.querySelectorAll(".quiz-card--pin").forEach(function (card) {
        card.classList.toggle("is-hot", Boolean(value) && card.getAttribute("data-value") === value);
      });
      if (!selectedDistrict) paintDistrict(value);
    }

    function pickCard(btn) {
      var group = btn.parentNode;
      group.querySelectorAll(".quiz-card").forEach(function (b) {
        b.classList.remove("is-on");
        if (b.hasAttribute("aria-checked")) b.setAttribute("aria-checked", "false");
      });
      btn.classList.add("is-on");
      if (btn.hasAttribute("aria-checked")) btn.setAttribute("aria-checked", "true");
      var field = btn.getAttribute("data-field");
      var value = btn.getAttribute("data-value");
      if (field && value) {
        var input = document.getElementById(field);
        if (input) input.value = value;
      }
      if (btn.classList.contains("quiz-card--pin")) {
        selectedDistrict = value;
        paintDistrict(value);
      }
      if (btn.getAttribute("data-review") === "1") {
        resultTitle.textContent = "Разберём, почему квартира не продаётся";
        resultText.textContent = "Риэлтер покажет, что изменить в цене, подаче или продвижении, и даст предварительную оценку";
      } else if (btn.closest('[data-step="5"]')) {
        resultTitle.textContent = "Куда отправить расчёт?";
        resultText.textContent = "Результат: предварительный диапазон стоимости + рекомендуемая стратегия продажи";
      }
      var step = btn.closest(".quiz-step");
      var next = Number(step.getAttribute("data-step")) + 1;
      window.clearTimeout(advanceTimer);
      var wait = reduce.matches ? 0 : 340;
      advanceTimer = window.setTimeout(function () {
        if (next <= steps.length) show(next);
      }, wait);
    }

    function bindDistrictObject(name, object) {
      object.events.add("mouseenter", function () {
        setDistrictHot(name);
        if (!selectedDistrict) paintDistrict(name);
      });
      object.events.add("mouseleave", function () {
        setDistrictHot("");
        paintDistrict(selectedDistrict);
      });
      object.events.add("click", function () {
        var card = form.querySelector('.quiz-card--pin[data-value="' + name + '"]');
        if (card) pickCard(card);
      });
    }

    function nearStreet(coords, fallback) {
      if (!coords || !fallback) return false;
      var dLat = (coords[0] - fallback[0]) * 111320;
      var dLon = (coords[1] - fallback[1]) * 111320 * Math.cos(fallback[0] * Math.PI / 180);
      return Math.sqrt(dLat * dLat + dLon * dLon) < 1200;
    }

    function placeDistrict(name, coords) {
      var placemark = new window.ymaps.Placemark(coords, {
        hintContent: name,
        iconCaption: name
      }, {
        preset: "islands#circleDotIcon",
        iconColor: "#6b4f9a",
        cursor: "pointer",
        iconCaptionMaxWidth: 140,
        hasBalloon: false
      });
      districtGeo[name] = { placemark: placemark };
      yandexMap.geoObjects.add(placemark);
      bindDistrictObject(name, placemark);
    }

    function fitDistricts() {
      if (!yandexMap) return;
      yandexMap.container.fitToViewport();
      var bounds = yandexMap.geoObjects.getBounds();
      if (bounds) {
        yandexMap.setBounds(bounds, {
          checkZoomRange: true,
          zoomMargin: [48, 48, 48, 48]
        });
      }
    }

    function initYandexMap() {
      var el = document.getElementById("quiz-yandex-map");
      if (!mapStage || yandexMap || !window.ymaps || !el) return;
      if (!mapStage.offsetHeight) {
        mapStage.style.minHeight = "420px";
      }

      yandexMap = new window.ymaps.Map(el, {
        center: [52.0938, 23.6852],
        zoom: 12,
        controls: ["zoomControl"]
      }, {
        suppressMapOpenBlock: true,
        yandexMapDisablePoiInteractivity: true
      });
      yandexMap.controls.get("zoomControl").options.set({ size: "small", position: { right: 10, top: 10 } });
      yandexMap.behaviors.disable("scrollZoom");

      var names = Object.keys(DISTRICT_COORDS);
      var pending = names.length;

      function doneOne() {
        pending -= 1;
        if (pending <= 0) {
          window.setTimeout(fitDistricts, 50);
        }
      }

      names.forEach(function (name) {
        var fallback = DISTRICT_COORDS[name];
        placeDistrict(name, fallback);
        window.ymaps.geocode(DISTRICT_QUERY[name], {
          results: 1,
          boundedBy: [[52.03, 23.58], [52.15, 23.84]],
          strictBounds: true
        }).then(function (res) {
          var found = res.geoObjects.get(0);
          if (!found || !districtGeo[name]) return;
          var coords = found.geometry.getCoordinates();
          if (!nearStreet(coords, fallback)) return;
          districtGeo[name].placemark.geometry.setCoordinates(coords);
        }, function () {
          /* keep fallback coords */
        }).then(doneOne, doneOne);
      });

      window.setTimeout(fitDistricts, 80);

      if (window.ResizeObserver) {
        new window.ResizeObserver(function () {
          if (yandexMap) yandexMap.container.fitToViewport();
        }).observe(el);
      }
    }

    function loadYandexMaps() {
      function start() {
        window.ymaps.ready(function () {
          window.requestAnimationFrame(function () {
            window.requestAnimationFrame(initYandexMap);
          });
        });
      }
      if (window.ymaps) {
        start();
        return;
      }
      var script = document.createElement("script");
      script.src = "https://api-maps.yandex.ru/2.1/?lang=ru_RU";
      script.async = true;
      script.onload = function () {
        start();
      };
      script.onerror = function () {
        var el = document.getElementById("quiz-yandex-map");
        if (el) el.innerHTML = "<p class=\"quiz-hint\" style=\"padding:24px\">Карта не загрузилась. Выберите район из списка.</p>";
      };
      document.head.appendChild(script);
    }

    form.querySelectorAll(".quiz-card").forEach(function (btn) {
      btn.addEventListener("click", function () {
        pickCard(btn);
      });
    });

    form.querySelectorAll(".quiz-card--pin").forEach(function (btn) {
      btn.addEventListener("mouseenter", function () {
        setDistrictHot(btn.getAttribute("data-value"));
      });
      btn.addEventListener("mouseleave", function () {
        setDistrictHot("");
        paintDistrict(selectedDistrict);
      });
      btn.addEventListener("focus", function () {
        setDistrictHot(btn.getAttribute("data-value"));
      });
      btn.addEventListener("blur", function () {
        setDistrictHot("");
        paintDistrict(selectedDistrict);
      });
    });

    loadYandexMaps();
    show(1);

    if (back) {
      back.addEventListener("click", function () {
        window.clearTimeout(advanceTimer);
        if (current > 1) show(current - 1);
      });
    }

    var submit = form.querySelector(".quiz-submit");
    if (submit && done) {
      submit.addEventListener("click", function () {
        done.hidden = false;
        submit.disabled = true;
      });
    }
  }

  // Reviews slider & inline expand
  var voicesReel = document.getElementById("voices-slider");
  if (voicesReel) {
    var prevBtn = document.getElementById("voices-prev");
    var nextBtn = document.getElementById("voices-next");
    var quotes = voicesReel.querySelectorAll(".voice-quote");
    var LINE_COUNT = 5;

    function cardStep() {
      var card = voicesReel.querySelector(".voice");
      if (!card) return voicesReel.clientWidth;
      var styles = window.getComputedStyle(voicesReel);
      var gap = parseFloat(styles.columnGap || styles.gap) || 16;
      return card.getBoundingClientRect().width + gap;
    }

    if (prevBtn && nextBtn) {
      prevBtn.addEventListener("click", function () {
        voicesReel.scrollBy({ left: -cardStep(), behavior: "smooth" });
      });
      nextBtn.addEventListener("click", function () {
        voicesReel.scrollBy({ left: cardStep(), behavior: "smooth" });
      });
    }

    function measureLimit(quote) {
      var lh = parseFloat(window.getComputedStyle(quote).lineHeight);
      if (!lh || Number.isNaN(lh)) lh = 22;
      return lh * LINE_COUNT + 1;
    }

    function bindToggle(quote, btn, expanded) {
      btn.addEventListener("click", function () {
        quote.__expanded = !expanded;
        paintQuote(quote);
      });
    }

    function paintQuote(quote) {
      var full = quote.getAttribute("data-full") || "";
      var expanded = Boolean(quote.__expanded);
      quote.textContent = "";

      var text = document.createTextNode("");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "voice-more-btn";
      quote.appendChild(text);
      quote.appendChild(btn);

      if (expanded) {
        text.textContent = full + " ";
        btn.textContent = "…скрыть";
        btn.setAttribute("aria-expanded", "true");
        bindToggle(quote, btn, true);
        return;
      }

      text.textContent = full;
      btn.textContent = "…ещё";
      btn.setAttribute("aria-expanded", "false");

      var limit = measureLimit(quote);
      if (quote.scrollHeight <= limit) {
        btn.remove();
        return;
      }

      var words = full.split(/\s+/);
      var lo = 0;
      var hi = words.length;
      while (lo < hi) {
        var mid = Math.ceil((lo + hi) / 2);
        text.textContent = words.slice(0, mid).join(" ") + " ";
        if (quote.scrollHeight <= limit) lo = mid;
        else hi = mid - 1;
      }
      while (lo > 1 && quote.scrollHeight > limit) {
        lo -= 1;
        text.textContent = words.slice(0, lo).join(" ") + " ";
      }
      bindToggle(quote, btn, false);
    }

    quotes.forEach(function (quote) {
      if (!quote.getAttribute("data-full")) {
        quote.setAttribute("data-full", quote.textContent.replace(/\s+/g, " ").trim());
      }
      quote.__expanded = false;
      paintQuote(quote);
    });

    var resizeTimer;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        quotes.forEach(paintQuote);
      }, 120);
    });
  }

  var fear = document.querySelector(".fear");
  if (fear) {
    var dial = fear.querySelector("[data-fear-dial]");
    var reportBtn = fear.querySelector(".fear-report-toggle");
    var report = document.getElementById("report");
    var fearP = 0;
    var fearTarget = 0;
    var fearRaf = 0;

    function setFearP(value) {
      fearP = value;
      fear.style.setProperty("--fear-p", fearP.toFixed(4));
    }

    function tickFear() {
      fearRaf = 0;
      var next = fearP + (fearTarget - fearP) * 0.08;
      if (Math.abs(fearTarget - next) < 0.002) next = fearTarget;
      setFearP(next);
      if (next !== fearTarget) fearRaf = window.requestAnimationFrame(tickFear);
    }

    function fearFill() {
      return window.matchMedia("(max-width: 980px)").matches ? 0.5 : 0.62;
    }

    function runFearDial() {
      fearTarget = fearFill();
      if (reduce.matches) {
        setFearP(fearFill());
        return;
      }
      if (!fearRaf) fearRaf = window.requestAnimationFrame(tickFear);
    }

    if (fear.classList.contains("is-in") || (dial && dial.classList.contains("is-in")) || (dial && dial.parentElement && dial.parentElement.classList.contains("is-in"))) {
      runFearDial();
    } else if (dial && dial.parentElement && "MutationObserver" in window) {
      var fearWatch = new MutationObserver(function () {
        if (dial.parentElement.classList.contains("is-in") || dial.classList.contains("is-in")) {
          runFearDial();
          fearWatch.disconnect();
        }
      });
      fearWatch.observe(dial.parentElement, { attributes: true, attributeFilter: ["class"] });
    }

    if (reportBtn && report) {
      report.hidden = true;
      report.classList.remove("is-open");
      reportBtn.setAttribute("aria-expanded", "false");
      reportBtn.textContent = "Показать реальный пример отчёта";
      reportBtn.addEventListener("click", function () {
        var open = reportBtn.getAttribute("aria-expanded") !== "true";
        reportBtn.setAttribute("aria-expanded", open ? "true" : "false");
        reportBtn.textContent = open ? "Скрыть пример отчёта" : "Показать реальный пример отчёта";
        if (open) {
          report.hidden = false;
          window.requestAnimationFrame(function () {
            report.classList.add("is-open");
          });
        } else {
          report.classList.remove("is-open");
          window.setTimeout(function () {
            if (reportBtn.getAttribute("aria-expanded") !== "true") report.hidden = true;
          }, 520);
        }
      });
    }
  }

  var contactsForm = document.getElementById("contacts-form");
  var contactsDone = document.getElementById("contacts-done");
  if (contactsForm) {
    var nameInput = document.getElementById("contacts-name");
    var phoneInput = document.getElementById("contacts-phone");

    function setError(input, message) {
      var box = document.getElementById(input.id + "-error");
      input.setAttribute("aria-invalid", message ? "true" : "false");
      input.classList.toggle("is-invalid", Boolean(message));
      if (box) {
        box.hidden = !message;
        box.textContent = message || "";
      }
    }

    function nameError() {
      var value = (nameInput.value || "").trim();
      if (!value) return "Укажите имя";
      if (value.length < 2) return "Имя слишком короткое";
      if (!/^[a-zA-Zа-яА-ЯёЁіІўЎ''\-\s]+$/.test(value)) return "Используйте только буквы";
      return "";
    }

    function phoneError() {
      var digits = (phoneInput.value || "").replace(/\D/g, "");
      if (!digits) return "Укажите телефон";
      if (digits.indexOf("375") === 0) digits = digits.slice(3);
      else if (digits.indexOf("80") === 0) digits = digits.slice(2);
      if (digits.length !== 9) return "Введите номер в формате +375 XX XXX-XX-XX";
      if (!/^(17|25|29|33|44)/.test(digits)) return "Проверьте код оператора";
      return "";
    }

    function validate(showAll) {
      var nameMsg = nameError();
      var phoneMsg = phoneError();
      if (showAll || nameInput.classList.contains("is-invalid") || nameInput === document.activeElement) {
        setError(nameInput, nameMsg);
      }
      if (showAll || phoneInput.classList.contains("is-invalid") || phoneInput === document.activeElement) {
        setError(phoneInput, phoneMsg);
      }
      return !nameMsg && !phoneMsg;
    }

    function sanitizePhone(value) {
      return (value || "").replace(/[^\d+\s()\-]/g, "");
    }

    phoneInput.addEventListener("beforeinput", function (e) {
      if (e.data && /[^\d+\s()\-]/.test(e.data)) e.preventDefault();
    });

    phoneInput.addEventListener("paste", function (e) {
      e.preventDefault();
      var text = "";
      if (e.clipboardData) text = e.clipboardData.getData("text");
      phoneInput.value = sanitizePhone((phoneInput.value || "") + text);
      if (phoneInput.classList.contains("is-invalid")) setError(phoneInput, phoneError());
    });

    nameInput.addEventListener("blur", function () { setError(nameInput, nameError()); });
    phoneInput.addEventListener("blur", function () { setError(phoneInput, phoneError()); });
    nameInput.addEventListener("input", function () {
      if (nameInput.classList.contains("is-invalid")) setError(nameInput, nameError());
    });
    phoneInput.addEventListener("input", function () {
      var clean = sanitizePhone(phoneInput.value);
      if (phoneInput.value !== clean) phoneInput.value = clean;
      if (phoneInput.classList.contains("is-invalid")) setError(phoneInput, phoneError());
    });

    contactsForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate(true)) {
        var first = contactsForm.querySelector(".is-invalid");
        if (first) first.focus();
        return;
      }
      contactsForm.classList.add("is-sent");
      if (contactsDone) contactsDone.hidden = false;
    });
  }

  var sheet = document.getElementById("checklist-modal");
  var sheetOpen = document.getElementById("checklist-open");
  var sheetClose = document.getElementById("checklist-close");
  if (sheet && sheetOpen) {
    function closeSheet() {
      sheet.hidden = true;
      document.body.style.overflow = "";
      sheetOpen.focus();
    }
    function openSheet() {
      sheet.hidden = false;
      document.body.style.overflow = "hidden";
      var field = document.getElementById("cl-contact");
      if (field) field.focus();
    }
    sheetOpen.addEventListener("click", openSheet);
    if (sheetClose) sheetClose.addEventListener("click", closeSheet);
    sheet.querySelectorAll("[data-sheet-close]").forEach(function (el) {
      el.addEventListener("click", closeSheet);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !sheet.hidden) closeSheet();
    });
  }

  if (!reduce.matches) {
    function splitHeading(el) {
      if (!el || el.dataset.splitReady === "1") return;
      var type = el.getAttribute("data-split") || "words";
      var raw = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!raw || raw.split(" ").length > 12) return;
      var html = "";
      var i = 0;
      if (type === "chars") {
        raw.split("").forEach(function (ch) {
          if (ch === " ") {
            html += " ";
            return;
          }
          html += '<span class="split-word"><span style="--i:' + i + '">' + ch + "</span></span>";
          i += 1;
        });
      } else {
        raw.split(" ").forEach(function (word, index) {
          if (index) html += " ";
          html += '<span class="split-word"><span style="--i:' + i + '">' + word + "</span></span>";
          i += 1;
        });
      }
      el.setAttribute("aria-label", raw);
      el.innerHTML = html;
      el.dataset.splitReady = "1";
    }

    document.querySelectorAll("[data-split]").forEach(splitHeading);
  }

  var callFab = document.querySelector(".call-fab");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (callFab && !reduce.matches && finePointer.matches) {
    function fabBusy() {
      return callFab.matches(":hover") || callFab.matches(":focus-visible") || document.hidden;
    }

    function hopFab() {
      if (fabBusy() || callFab.classList.contains("is-open")) return;
      callFab.classList.remove("is-nudge");
      void callFab.offsetWidth;
      callFab.classList.add("is-nudge");
    }

    function loopHop() {
      window.setTimeout(function () {
        hopFab();
        loopHop();
      }, 5000 + Math.random() * 5000);
    }

    function peekFab() {
      if (fabBusy()) return;
      callFab.classList.add("is-open");
      window.setTimeout(function () {
        if (!callFab.matches(":hover") && !callFab.matches(":focus-visible")) {
          callFab.classList.remove("is-open");
        }
      }, 4200);
    }

    callFab.addEventListener("animationend", function () {
      callFab.classList.remove("is-nudge");
    });

    loopHop();
    window.setInterval(peekFab, 60000);
  }
})();
