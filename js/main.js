(function () {
  "use strict";

  const POSITION_LABELS = {
    goalkeeper: "门将",
    defender: "后卫",
    midfielder: "中场",
    forward: "前锋"
  };

  const GALLERY_CATEGORY_LABELS = {
    match: "比赛",
    training: "训练",
    team: "团建"
  };

  // 设置页脚年份，避免每年手动改动。
  function updateFooterYear() {
    const yearEl = document.getElementById("footerYear");
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  function renderBlockMessage(container, message, type) {
    if (!container) {
      return;
    }

    const className = type === "error" ? "load-error" : "empty-state";
    container.innerHTML = `<div class="${className}">${message}</div>`;
  }

  function renderTableMessage(tbody, columnCount, message, type) {
    if (!tbody) {
      return;
    }

    const className = type === "error" ? "load-error" : "empty-state";
    tbody.innerHTML = `<tr><td colspan="${columnCount}"><div class="${className}">${message}</div></td></tr>`;
  }

  // 统一处理 JSON 获取，确保错误可追踪。
  async function fetchJsonData(url) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`读取数据失败：${url}`, error);
      throw error;
    }
  }

  // 轻量 CSV 解析器（处理带引号和逗号的字段）
  function parseCSV(text) {
    const rows = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') {
        if (inQuotes && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((ch === "," || ch === "\n") && !inQuotes) {
        if (ch === "\n") {
          if (current.trim() || rows.length > 0) rows.push(current.trim());
        } else {
          rows.push(current.trim());
        }
        current = "";
      } else {
        current += ch;
      }
    }
    if (current.trim()) rows.push(current.trim());

    if (rows.length === 0) return [];
    const headers = rows[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const result = [];

    let colIndex = headers.length;
    while (colIndex < rows.length) {
      const values = [];
      for (let h = 0; h < headers.length; h++) {
        values.push(rows[colIndex + h] || "");
      }
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (values[i] || "").replace(/^"|"$/g, ""); });
      result.push(obj);
      colIndex += headers.length;
    }

    return result;
  }

  // 自动识别文件类型获取数据
  async function fetchData(url) {
    const isCSV = url.endsWith(".csv");
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (isCSV) {
      const text = await response.text();
      return parseCSV(text);
    }
    return response.json();
  }

  function getAvatarMarkup(player, shape) {
    if (player.avatar) {
      return `<img class="player-photo" src="${player.avatar}" alt="${player.name} 头像">`;
    }

    if (shape === "square") {
      return '<i class="bi bi-person-fill"></i>';
    }

    return '<i class="bi bi-person-fill"></i>';
  }

  function formatDate(dateText) {
    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) {
      return dateText;
    }

    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, "0");
    const d = `${date.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function getResultBadge(result) {
    const upper = (result || "").toUpperCase();
    if (upper === "W") {
      return "<span class=\"badge-result badge-result-w\">W / 胜</span>";
    }
    if (upper === "D") {
      return "<span class=\"badge-result badge-result-d\">D / 平</span>";
    }
    return "<span class=\"badge-result badge-result-l\">L / 负</span>";
  }

  function getPositionShortLabel(group, position) {
    const map = {
      goalkeeper: "GK",
      defender: "DF",
      midfielder: "MF",
      forward: "FW"
    };

    if (map[group]) {
      return map[group];
    }

    if (position === "门将") {
      return "GK";
    }
    if (position === "后卫") {
      return "DF";
    }
    if (position === "中场") {
      return "MF";
    }
    if (position === "前锋") {
      return "FW";
    }

    return "POS";
  }

  // 首页新闻卡片：点击摘要展开详情。
  function initNewsCards() {
    const summaryLinks = document.querySelectorAll(".news-summary-link");
    if (!summaryLinks.length) {
      return;
    }

    summaryLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();

        const card = link.closest(".news-card");
        if (!card) {
          return;
        }

        card.classList.toggle("expanded");
        const hint = link.querySelector(".read-hint");
        if (hint) {
          hint.textContent = card.classList.contains("expanded") ? "收起内容" : "点击阅读全文";
        }
      });
    });
  }

  // 首页统计卡：从 JSON 自动计算建队年数、现役人数、获奖次数。
  async function initStatsCards() {
    const statElements = {
      years: document.getElementById("statYears"),
      players: document.getElementById("statPlayers"),
      alumni: document.getElementById("statAlumni"),
      honors: document.getElementById("statHonors")
    };

    const missing = Object.values(statElements).every((el) => !el);
    if (missing) {
      return;
    }

    try {
      const [players, matches, honors] = await Promise.all([
        fetchData("data/players.csv"),
        fetchJsonData("data/matches.json"),
        fetchJsonData("data/honors.json")
      ]);

      // 建队年数：从页脚"建队于 2015"推算，或取 matches 中最早赛季。
      const foundingYear = 2015;
      const currentYear = new Date().getFullYear();
      if (statElements.years) {
        statElements.years.textContent = currentYear - foundingYear;
      }

      // 现役队员人数：players.csv 记录数。
      if (statElements.players) {
        statElements.players.textContent = Array.isArray(players) ? players.length : 0;
      }

      // 历届队员人数：暂无独立数据源，暂无统一字段，留空提示。
      if (statElements.alumni) {
        statElements.alumni.textContent = "--";
      }

      // 获奖次数：honors.json 中 team 类型荣誉数量。
      const teamHonorsCount = Array.isArray(honors)
        ? honors.filter((item) => item.type === "team").length
        : 0;
      if (statElements.honors) {
        statElements.honors.textContent = teamHonorsCount;
      }
    } catch (error) {
      console.error("统计卡数据加载失败", error);
    }
  }

  // 首页比赛快讯：读取 matches.json 中最近一场和最近未来一场。
  async function initMatchTicker() {
    const lastMatch = document.getElementById("lastMatchInfo");
    const nextMatch = document.getElementById("nextMatchInfo");

    if (!lastMatch && !nextMatch) {
      return;
    }

    try {
      const matches = await fetchJsonData("data/matches.json");
      if (!Array.isArray(matches) || !matches.length) {
        return;
      }

      const now = new Date();
      const sorted = matches.slice().sort((a, b) => new Date(a.date) - new Date(b.date));

      // 最近已完成比赛（date 早于今天）。
      const lastCompleted = [...sorted].reverse().find((m) => new Date(m.date) < now);
      // 最近未来比赛（date 在今天或之后），取第一条。
      const nextUpcoming = sorted.find((m) => new Date(m.date) >= now);

      if (lastMatch && lastCompleted) {
        const score = `${lastCompleted.score_us} : ${lastCompleted.score_them}`;
        lastMatch.innerHTML = `<strong>上一场比赛</strong><span>政国中统 ${score} ${lastCompleted.opponent}</span>`;
      }

      if (nextMatch && nextUpcoming) {
        const dateStr = formatDate(nextUpcoming.date);
        nextMatch.innerHTML = `<strong>下一场预告</strong><span>${dateStr} · 对阵 ${nextUpcoming.opponent}</span>`;
      }
    } catch (error) {
      console.error("比赛快讯加载失败", error);
    }
  }

  // 首页现役阵容预览从 JSON 加载，保持后续维护简单。
  async function initRosterPreview() {
    const container = document.getElementById("rosterPreviewList");
    if (!container) {
      return;
    }

    try {
      const players = await fetchData("data/players.csv");
      if (!Array.isArray(players) || !players.length) {
        renderBlockMessage(container, "暂无现役队员数据。", "empty");
        return;
      }

      container.innerHTML = players.slice(0, 8).map((player) => `
        <a href="player.html?id=${player.id}" class="player-preview-card" title="查看 ${player.name} 的个人页">
          <div class="player-avatar-square">${getAvatarMarkup(player, "square")}</div>
          <div class="player-meta">
            <h3 class="player-name fs-6">${player.name}</h3>
            <p class="player-sub">#${player.number} · ${POSITION_LABELS[player.group] || player.position}</p>
          </div>
        </a>
      `).join("");
    } catch (error) {
      renderBlockMessage(container, "现役阵容预览加载失败，请稍后重试。", "error");
    }
  }

  // 现役阵容页：按门将/后卫/中场/前锋分组渲染。
  async function initRosterPage() {
    const container = document.getElementById("rosterGroups");
    if (!container) {
      return;
    }

    try {
      const players = await fetchData("data/players.csv");
      if (!Array.isArray(players) || !players.length) {
        renderBlockMessage(container, "暂无阵容数据。", "empty");
        return;
      }

      const groupedPlayers = players.reduce((acc, player) => {
        const groupKey = player.group || "other";
        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }
        acc[groupKey].push(player);
        return acc;
      }, {});

      const groupOrder = ["goalkeeper", "defender", "midfielder", "forward"];
      container.innerHTML = groupOrder.map((groupKey) => {
        const groupPlayers = groupedPlayers[groupKey] || [];
        const groupTitle = POSITION_LABELS[groupKey] || groupKey;

        const cards = groupPlayers.length
          ? groupPlayers.map((player) => `
              <div class="roster-card-item">
                <a href="player.html?id=${player.id}" class="roster-card-link" title="查看 ${player.name} 的个人页">
                  <article class="roster-card">
                    <div class="roster-card-top">
                      <span class="roster-jersey-number">${player.number}</span>
                      <div class="roster-avatar-wrap">${getAvatarMarkup(player, "circle")}</div>
                    </div>
                    <div class="roster-card-info">
                      <span class="roster-position-badge">${getPositionShortLabel(player.group, player.position)}</span>
                      <h3 class="roster-player-name">${player.name}</h3>
                    </div>
                  </article>
                </a>
              </div>
            `).join("")
          : '<div class="empty-state">暂无该位置队员信息。</div>';

        return `
          <section class="group-section">
            <h2 class="group-title">${groupTitle}</h2>
            <div class="roster-card-grid">${cards}</div>
          </section>
        `;
      }).join("");
    } catch (error) {
      renderBlockMessage(container, "阵容数据加载失败，请稍后刷新。", "error");
    }
  }

  // 赛事页：赛季筛选 + 比赛表格。
  async function initMatchesPage() {
    const filterWrap = document.getElementById("seasonFilters");
    const tableBody = document.getElementById("matchesTableBody");
    if (!filterWrap || !tableBody) {
      return;
    }

    try {
      const matches = await fetchJsonData("data/matches.json");
      if (!Array.isArray(matches) || !matches.length) {
        renderTableMessage(tableBody, 6, "暂无赛事数据。", "empty");
        return;
      }

      const orderedMatches = matches.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
      const seasons = [...new Set(orderedMatches.map((item) => item.season))]
        .sort((a, b) => Number(b) - Number(a));

      let activeSeason = seasons[0];

      const renderFilters = () => {
        filterWrap.innerHTML = seasons.map((season) => {
          const activeClass = season === activeSeason ? "btn-team-primary" : "btn-team-outline";
          return `<button class="btn ${activeClass}" data-season="${season}">${season} 赛季</button>`;
        }).join("");
      };

      const renderTable = () => {
        const filtered = orderedMatches.filter((item) => item.season === activeSeason);
        if (!filtered.length) {
          renderTableMessage(tableBody, 6, `暂无 ${activeSeason} 赛季数据。`, "empty");
          return;
        }

        tableBody.innerHTML = filtered.map((item) => {
          const scoreText = `${item.score_us} : ${item.score_them}`;
          return `
            <tr>
              <td>${formatDate(item.date)}</td>
              <td>${item.competition}</td>
              <td>${item.opponent}</td>
              <td>${scoreText}</td>
              <td>${getResultBadge(item.result)}</td>
              <td>${item.note || "-"}</td>
            </tr>
          `;
        }).join("");
      };

      renderFilters();
      renderTable();

      filterWrap.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-season]");
        if (!button) {
          return;
        }

        activeSeason = button.dataset.season || activeSeason;
        renderFilters();
        renderTable();
      });

      if (typeof window.initMatchCharts === "function") {
        window.initMatchCharts(orderedMatches);
      }
    } catch (error) {
      renderTableMessage(tableBody, 6, "赛事数据加载失败，请稍后重试。", "error");
    }
  }

  function pickHonorIcon(title) {
    if (!title) {
      return "bi-award-fill";
    }
    if (title.includes("冠军")) {
      return "bi-trophy-fill";
    }
    if (title.includes("金靴") || title.includes("最佳")) {
      return "bi-star-fill";
    }
    return "bi-award-fill";
  }

  // 荣誉页：同一份 JSON 中拆分团队荣誉与个人荣誉。
  async function initHonorsPage() {
    const teamGrid = document.getElementById("teamHonorsGrid");
    const personalBody = document.getElementById("personalHonorsBody");
    if (!teamGrid || !personalBody) {
      return;
    }

    try {
      const honors = await fetchJsonData("data/honors.json");
      if (!Array.isArray(honors) || !honors.length) {
        renderBlockMessage(teamGrid, "暂无荣誉数据。", "empty");
        renderTableMessage(personalBody, 3, "暂无个人荣誉数据。", "empty");
        return;
      }

      const teamHonors = honors.filter((item) => item.type === "team");
      const personalHonors = honors.filter((item) => item.type === "personal");

      teamGrid.innerHTML = teamHonors.length
        ? teamHonors.map((item) => `
            <div class="col-12 col-md-6 col-xl-4">
              <article class="honor-card p-3 h-100">
                <div class="d-flex align-items-center gap-2 mb-2">
                  <span class="honor-icon"><i class="bi ${pickHonorIcon(item.title)}"></i></span>
                  <div>
                    <h3 class="h6 mb-1">${item.title}</h3>
                    <p class="mb-0 small text-muted">${item.year}</p>
                  </div>
                </div>
                <p class="mb-0 small">${item.competition || "[赛事说明，待填写]"}</p>
              </article>
            </div>
          `).join("")
        : '<div class="col-12"><div class="empty-state">暂无团队荣誉。</div></div>';

      personalBody.innerHTML = personalHonors.length
        ? personalHonors.map((item) => `
            <tr>
              <td>${item.player || "[待填写]"}</td>
              <td>${item.title}</td>
              <td>${item.season || item.year || "-"}</td>
            </tr>
          `).join("")
        : '<tr><td colspan="3"><div class="empty-state">暂无个人荣誉数据。</div></td></tr>';
    } catch (error) {
      renderBlockMessage(teamGrid, "荣誉数据加载失败，请稍后重试。", "error");
      renderTableMessage(personalBody, 3, "荣誉数据加载失败，请稍后重试。", "error");
    }
  }

  // 相册页：标签筛选 + Bootstrap Modal 伪 Lightbox。
  function initGallery() {
    const filterWrap = document.getElementById("galleryFilters");
    const items = Array.from(document.querySelectorAll(".gallery-item"));
    const modalElement = document.getElementById("galleryModal");

    if (!filterWrap || !items.length || !modalElement || typeof bootstrap === "undefined") {
      return;
    }

    const modalCaption = document.getElementById("galleryModalCaption");
    const modalTag = document.getElementById("galleryModalTag");
    const modalPlaceholder = document.getElementById("galleryModalPlaceholder");
    const galleryModal = bootstrap.Modal.getOrCreateInstance(modalElement);

    const applyFilter = (filterValue) => {
      items.forEach((item) => {
        const category = item.dataset.category || "";
        const shouldShow = filterValue === "all" || category === filterValue;
        item.classList.toggle("d-none", !shouldShow);
      });
    };

    filterWrap.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-filter]");
      if (!button) {
        return;
      }

      filterWrap.querySelectorAll("button").forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      applyFilter(button.dataset.filter || "all");
    });

    items.forEach((item) => {
      item.addEventListener("click", () => {
        const title = item.dataset.title || "图片说明";
        const category = item.dataset.category || "all";

        if (modalCaption) {
          modalCaption.textContent = title;
        }
        if (modalTag) {
          modalTag.textContent = GALLERY_CATEGORY_LABELS[category] || "未分类";
        }
        if (modalPlaceholder) {
          modalPlaceholder.textContent = title;
        }

        galleryModal.show();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateFooterYear();
    initNewsCards();
    initStatsCards();
    initMatchTicker();
    initRosterPreview();
    initRosterPage();
    initMatchesPage();
    initHonorsPage();
    initGallery();
  });
})();
