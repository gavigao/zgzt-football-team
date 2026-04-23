# 政国中统男子足球队官方网站

一个基于 HTML5 + CSS3 + Bootstrap 5 + 原生 JavaScript 的纯静态官网项目，可直接部署到 GitHub Pages，零后端、零数据库、零服务器成本。

## 1. 项目简介

本项目用于记录政国中统男子足球队的历史、荣誉、赛事与成员信息，支持长期维护。

主要特性：

- **8 个独立页面**：首页、历史、现役阵容、历届队员、赛事战绩、荣誉殿堂、相册、关于我们
- **响应式设计**：电脑和手机均可正常浏览
- **数据文件分离**：队员（CSV）、赛事（JSON）、荣誉（JSON）、相册（JSON）分类管理
- **图表展示**：使用 Chart.js 渲染战绩可视化（胜/平/负统计）
- **动态内容**：首页统计卡自动计算建队年数、现役人数、获奖次数；比赛快讯自动显示上一场与下一场
- **球员个人页**：点击阵容中任意球员可进入个人页查看详细信息
- **留言板**：支持 Disqus 嵌入（配置简单，5 分钟上线）

## 2. 本地预览方法（VS Code Live Server）

1. 安装 VS Code 插件：Live Server
2. 在 VS Code 打开本项目目录
3. 右键 index.html，点击 Open with Live Server
4. 浏览器会自动打开本地地址（通常是 http://127.0.0.1:5500）

注意：页面使用 fetch 读取数据文件，需通过 Live Server 或 GitHub Pages 访问，不要直接双击 HTML 文件打开。

## 3. GitHub 仓库创建步骤（建议仓库名：football-team-website）

1. 打开 GitHub，点击 New repository
2. Repository name 填写：football-team-website
3. 选择 Public
4. 创建仓库后，将本地项目推送到 main 分支

可参考命令：

```bash
git init
git add .
git commit -m "init: football team static website"
git branch -M main
git remote add origin https://github.com/你的用户名/football-team-website.git
git push -u origin main
```

## 4. GitHub Pages 开启方法

1. 进入仓库页面，点击 Settings
2. 左侧菜单选择 Pages
3. Source 选择 Deploy from a branch
4. Branch 选择 main，文件夹选择 / (root)
5. 点击 Save
6. 等待 1-3 分钟后，页面会生成公开访问链接

## 5. 内容更新教程

### 5.1 更新队员数据（推荐方式）

队员数据使用 **CSV 格式**，可用 Excel/WPS 直接编辑，**无需任何转换工具**。

**编辑流程：**
1. 用 Excel/WPS 打开 `data/players.csv`
2. 修改姓名、号码、位置等信息
3. 保存文件
4. 推送到 GitHub
5. 网页自动反映最新数据

**字段说明：**

| 列名 | 说明 | 示例 |
|------|------|------|
| id | 唯一编号 | 0 |
| name | 姓名 | 宋哈尔 |
| number | 球衣号码 | 18 |
| position | 场上位置 | 前锋 |
| group | 位置分类 | forward |
| bio | 个人简介 | 可填写技术特点等 |
| avatar | 头像路径 | img/players/a.jpg（空则显示默认头像） |
| join_year | 加入年份 | 2015 |

**`group` 可用值：** `goalkeeper`（门将）、`defender`（后卫）、`midfielder`（中场）、`forward`（前锋）

### 5.2 更新赛事数据

编辑 `data/matches.json`：

- 维护字段：`date`、`season`、`competition`、`opponent`、`score_us`、`score_them`、`result`、`note`
- `result` 使用：`W`（胜）、`D`（平）、`L`（负）
- `matches.html` 会自动按 `season` 生成筛选按钮
- 图表会自动根据数据重绘

### 5.3 更新荣誉数据

编辑 `data/honors.json`：

- 团队荣誉：`type` 填 `team`
- 个人荣誉：`type` 填 `personal`，并补充 `player`、`season` 字段

### 5.4 添加相册图片

编辑 `data/gallery.json`，添加一条记录即可：

```json
{
  "id": 10,
  "category": "match",
  "title": "新图片标题",
  "date": "2026-05-01",
  "url": "img/gallery/your-photo.jpg",
  "description": "图片描述"
}
```

将图片文件放入 `img/gallery/` 目录即可。

支持的分类值：`match`（比赛）、`training`（训练）、`team`（团建）

### 5.5 替换队员头像

1. 把图片放入 `img/` 目录，例如 `img/players/zhangsan.jpg`
2. 在 `players.csv` 中修改对应队员的 `avatar` 字段为 `img/players/zhangsan.jpg`
3. 若 `avatar` 为空，页面显示默认灰色头像占位

## 6. Disqus 留言板配置（约 5 分钟）

1. 打开 https://disqus.com 注册账号
2. 点击 "I want to install Disqus on my site"
3. 输入 Website Name（这就是你的 shortname，例如 `zhongtong-football`）
4. 打开 `about.html`，找到留言板 section
5. 将 `your-team-shortname` 替换为你的实际 shortname
6. 删除注释标记 `<!--` 和 `-->`，保存即可

## 7. 常见问题

### Q1：GitHub Pages 没有生效怎么办？

- 确认仓库是 Public
- 确认 Pages 分支为 main 且目录是 / (root)
- 确认首页文件名是 index.html
- 提交后等待几分钟再访问

### Q2：页面能打开，但队员数据没显示？

- 不要直接双击 HTML 文件，需使用 Live Server 或 GitHub Pages 访问
- 检查 `data/players.csv` 文件是否存在且格式正确（注意逗号和引号）
- 打开浏览器控制台（F12）查看报错信息

### Q3：图片不显示？

- 检查路径是否正确（大小写和文件后缀）
- 确认图片文件已提交到仓库
- 确认 CSV 中 avatar 字段填写的是相对路径，例如 `img/players/a.jpg`

### Q4：图表不显示？

- 确认 matches.html 已引入 Chart.js CDN
- 确认 data/matches.json 至少有一条有效数据
- 检查控制台是否存在脚本报错

## 8. 项目目录结构

```
/
├── index.html           # 首页
├── history.html         # 球队历史
├── roster.html          # 现役阵容（可点击进入球员个人页）
├── player.html          # 球员个人页（URL 参数版）
├── alumni.html          # 历届队员
├── matches.html         # 赛事战绩（含图表）
├── honors.html          # 荣誉殿堂
├── gallery.html         # 相册（JSON 数据驱动）
├── about.html           # 关于我们
├── css/
│   └── style.css        # 全局样式
├── js/
│   ├── main.js          # 核心逻辑（各页面初始化）
│   └── charts.js        # Chart.js 图表渲染
├── img/
│   └── logo-placeholder.png   # Logo 占位图
├── data/
│   ├── players.csv      # 队员数据（可用 Excel 直接编辑）
│   ├── gallery.json     # 相册数据
│   ├── matches.json     # 赛事数据
│   └── honors.json      # 荣誉数据
└── README.md
```

## 9. 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Bootstrap 5.3 |
| 图标库 | Bootstrap Icons |
| 图表库 | Chart.js |
| 数据格式 | CSV（队员）、JSON（赛事/荣誉/相册） |
| 部署平台 | GitHub Pages（免费） |
| 数据编辑 | Excel / WPS 直接打开 CSV，无需任何转换工具 |

---

如需后续扩展（例如球员个人页生成、赛季数据页面、真实图床接入），可继续保持纯静态架构，不影响 GitHub Pages 免费托管。
