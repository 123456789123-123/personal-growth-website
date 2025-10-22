# 个人成长网站 🌱

一个纯前端的个人成长记录网站，用于记录和追踪生活的各个方面，包括旅行、读书、相册、兴趣爱好、宠物和健康数据。

> 🚀 **在线访问**：[https://123456789123-123.github.io/personal-growth-website/](https://123456789123-123.github.io/personal-growth-website/)

## 📋 项目特点

✅ **纯前端**：零后端、零部署、零服务器
✅ **在线 CDN**：ECharts 5 + 在线中国地图 JSON，秒加载不卡顿
✅ **本地存储**：所有数据存 localStorage，支持导出/导入 JSON 备份
✅ **响应式设计**：完美适配桌面端、平板端、移动端
✅ **统一设计**：采用 CSS 变量系统，视觉风格一致

## ✨ 功能模块

### 🏠 首页
- 封面标题 + 简介
- "进入网站"按钮跳转到导航页

### 👤 个人信息
- 圆形头像、昵称
- 出生年月、所在城市
- 个性签名

### 🗺️ 旅行足迹
**地图视图**
- 完整中国地图（省级），在线秒加载
- 新增旅程：输入省市名 → 提交后省份高亮（持久化）
- 鼠标悬浮已高亮省份 → 浮窗显示：省市名 + 旅行时间 + 五星喜欢程度
- 鼠标点击已高亮省份 → 跳转独立详情页

**详情页 (trip-detail.html)**
- 顶部：省份名 + 返回按钮
- 中部：照片占位瀑布流（可继续添加）
- 下部：时间、同行人、感想、五星喜欢程度（可编辑）
- 底部：编辑/删除按钮（删除后返回地图并取消高亮）

**统计数据**
- 总城市数
- 总旅行天数
- 最喜爱的城市

### 📷 相册
- 瀑布流展示，下滑滚动追加
- 点击大图弹窗（缩放、关闭）
- 独立点赞功能并持久化
- 按年份和月份筛选
- 幻灯片播放模式

### 📚 读书笔记
- 列表/卡片双视图，可切换并记忆
- 书籍信息：书名、封面占位、评分、正文、阅读日期
- 阅读统计仪表盘
- 书籍分类管理（已读/在读/想读）
- 详细的读书笔记和书摘
- 支持增删改 + 导出/导入

### 🎨 兴趣爱好
**列表页**
- 网格卡片展示（图 + 标题）

**详情页**
- 长文描述
- 作品图占位
- 时间轴展示
- 成就和里程碑记录

### 🐾 宠物
四个 Tab 页面：

**📋 档案**
- 基本信息卡片（名字、品种、性别、生日、毛色等）
- 体重变化趋势折线图（ECharts）
- 性格标签云

**📈 成长记录**
- 时间轴展示
- 里程碑事件（蓝色点）
- 体重记录（绿色点）
- 富文本卡片展示详细内容

**📸 照片合集**
- 独立瀑布流展示
- 点赞功能
- 幻灯片播放
- 按年份和月份筛选

**📝 日常点滴**
- 月历视图（有日记的日期显示标记）
- 图文日记列表
- 标签系统
- 搜索功能

**通用功能**
- 增删改操作
- 数据导出/导入
- 删除二次确认

### 💪 健康
- 体重、身高、BMI 追踪
- 运动记录（跑步、健身、游泳等）
- 健康数据可视化图表
- 目标设定和进度追踪

## 🛠️ 技术栈

| 技术 | 说明 |
|------|------|
| HTML5 | 语义化标签 |
| CSS3 | Flexbox + Grid 布局，CSS 变量系统 |
| JavaScript | 原生 ES6+ |
| ECharts 5.4.3 | 数据可视化（地图、折线图等） |
| Font Awesome 6.4.0 | 图标库 |
| localStorage | 浏览器本地存储 |

## 📦 项目结构

```
个人成长网站/
├── index.html                 # 首页
├── nav.html                   # 导航页面
├── css/
│   ├── global.css            # 全局样式和 CSS 变量系统
│   └── pages/                # 各页面样式
│       ├── trip.css
│       ├── books.css
│       ├── album.css
│       ├── hobbies.css
│       ├── pets.css
│       └── health.css
├── js/
│   ├── storage.js            # localStorage 统一管理
│   └── pages/                # 各页面逻辑
│       ├── trip.js
│       ├── books.js
│       ├── album.js
│       ├── hobbies.js
│       ├── pets.js
│       └── health.js
├── pages/                    # 各功能模块页面
│   ├── trip.html
│   ├── trip-detail.html
│   ├── books.html
│   ├── album.html
│   ├── hobbies.html
│   ├── hobbies-detail.html
│   ├── pets.html
│   └── health.html
├── assets/                   # 静态资源
│   └── images/
├── .gitignore
└── README.md
```

## 🚀 快速开始

### 在线访问

直接访问：[https://123456789123-123.github.io/personal-growth-website/](https://123456789123-123.github.io/personal-growth-website/)

### 本地运行

**1. 克隆项目**
```bash
git clone https://github.com/123456789123-123/personal-growth-website.git
cd personal-growth-website
```

**2. 启动方式**

**方法一：使用 VS Code Live Server**
- 安装 Live Server 插件
- 右键 `index.html` 选择 "Open with Live Server"

**方法二：使用 Python 简易服务器**
```bash
# Python 3
python -m http.server 8000
# 访问 http://localhost:8000
```

**方法三：直接打开**
- 直接双击 `index.html` 文件在浏览器中打开

## 💾 数据管理

### 数据存储

所有数据存储在浏览器的 localStorage 中：

| Key | 说明 |
|-----|------|
| `growth_trips` | 旅行数据 |
| `growth_books` | 读书数据 |
| `growth_album` | 相册数据 |
| `growth_hobbies` | 兴趣爱好数据 |
| `growth_pets` | 宠物数据 |
| `growth_health` | 健康数据 |

### 导出/导入

每个模块都支持数据的导出和导入：

**导出数据**
1. 点击模块页面右上角的"导出"按钮
2. 数据会以 JSON 格式自动下载（文件名包含日期）

**导入数据**
1. 点击模块页面右上角的"导入"按钮
2. 选择之前导出的 JSON 文件
3. 确认导入（会覆盖当前数据）

**用途**
- ✅ 数据备份
- ✅ 跨浏览器数据迁移
- ✅ 跨设备数据同步

## 🎨 设计系统

项目采用统一的 CSS 变量系统，确保视觉一致性：

```css
:root {
  /* 主色调 */
  --primary-color: #4A90E2;
  --primary-hover: #357ABD;
  --secondary-color: #50E3C2;
  --accent-color: #6B8E23;

  /* 文本色 */
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-tertiary: #999999;

  /* 间距系统 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;

  /* 圆角系统 */
  --border-radius: 8px;
  --border-radius-sm: 4px;
  --border-radius-lg: 12px;
  --border-radius-full: 9999px;

  /* 阴影系统 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
}
```

## 📱 响应式设计

完全响应式设计，支持多种设备：

| 设备类型 | 屏幕宽度 | 适配说明 |
|---------|---------|---------|
| 桌面端 | ≥ 1200px | 完整功能展示 |
| 平板端 | 768px - 1199px | 调整布局和间距 |
| 移动端 | < 768px | 单列布局，优化触摸操作 |

关键断点：
- `@media (max-width: 768px)` - 移动端
- `@media (max-width: 1024px)` - 平板端
- `@media (max-width: 480px)` - 小屏手机

## 🌐 浏览器兼容性

| 浏览器 | 最低版本 |
|--------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

## ⚠️ 重要提示

**数据安全**
- 数据存储在浏览器 localStorage 中
- 清除浏览器数据会丢失所有记录
- **建议定期导出数据进行备份**
- 不同浏览器的数据不共享

**图片说明**
- 当前版本图片使用占位符
- 后续可替换为真实图片（建议使用图床或 base64）

## 📝 开发计划

- [ ] 添加数据云端同步功能
- [ ] 支持主题切换（暗色模式）
- [ ] 添加数据分析和统计报表
- [ ] 支持照片实际上传
- [ ] 添加全局搜索功能
- [ ] 支持数据导出为 PDF
- [ ] 添加数据加密功能
- [ ] 支持多语言切换

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**🌟 如果这个项目对你有帮助，请给个 Star！**

**💡 提示**：记得定期导出数据备份哦！
