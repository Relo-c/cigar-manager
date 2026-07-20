# 库存筛选设计 QA

- Source visual truth: `/Users/katrina/.codex/generated_images/019f6475-ec1f-7a82-ae95-578371be7a30/exec-92d0a99e-b5ea-4c63-958b-4ce0e6175c0e.png`
- Implementation screenshot (原盒、筛选态): `/private/tmp/cigar-inventory-implementation-390x844.png`
- Implementation screenshot (散养、长金额): `/private/tmp/cigar-inventory-implementation-loose-390x844.png`
- Search screenshot (修正前): `/private/tmp/cigar-search-audit-before.png`
- Search screenshot (修正后): `/private/tmp/cigar-search-audit-after.png`
- Side-by-side evidence: `/private/tmp/cigar-inventory-comparison-filtered.png`
- Viewport: `390 × 844`
- State: 雾紫蓝主题；原盒按“高希霸 + M”筛选；散养为全部库存长金额状态。

## Full-view comparison evidence

实现保留了参考方案的页面层级：标题、原盒/散养切换、雾紫渐变筛选概览、两项单选筛选、搜索与库存列表。汇总卡、筛选控件和列表在 390px 宽度内无横向滚动；底部导航和新增按钮保持现有产品行为。

## Focused region evidence

无需额外裁剪图。汇总卡和两项筛选控件在原始 390px 截图中可清晰阅读，并通过浏览器尺寸测量复核：

- 原盒：`15盒 · 248支`，总价值随“高希霸 + M”变化为 `¥448,286`。
- 散养：`16组 · 704支`，长金额 `¥1,760,586.67` 完整显示。
- 品牌与柜号组合筛选后共 15 条结果，品牌/柜号不匹配数为 0。
- 清空筛选后恢复 28 盒、439 支、`¥625,082`。

## Required fidelity surfaces

- Fonts and typography: 继续使用项目现有苹方/系统无衬线字体；数量和金额采用等宽数字特性与按长度自适应字号，层级清晰且不截断。
- Spacing and layout rhythm: 汇总卡、搜索和列表间距与现有页面一致；390px 下无横向溢出，触控控件高度不低于 46px。
- Colors and visual tokens: 使用项目现有雾紫蓝色值、半透明白色表面和轻量阴影，未引入新的冲突色系。
- Image quality and asset fidelity: 库存列表继续使用项目内真实品牌 Logo；未使用占位图或自制图形替代品牌资产。
- Copy and content: 使用“筛选结果”“当前总价值”“品牌”“柜号”等中文库存语义；原盒使用“盒/支”，散养使用“组/支”。

## Comparison history

1. Initial pass — P2: `28盒 · 439支` 在窄屏中被省略。Fix: 缩小筛选图标、重新分配汇总列宽，并提高数量区的自适应视觉权重。Post-fix evidence: 390px 下结果文字完整显示。
2. Second pass — P2: 散养长金额在 390px 下超出可用宽度约 9px。Fix: 根据格式化金额长度动态缩小字号。Post-fix evidence: `¥1,760,586.67` 在 18.4px 下完整显示，`valueFits: true`。
3. Search audit — P2: 搜索框内部字段贴近顶部，图标与文字中心线比胶囊容器高约 4px，视觉上显得被压缩。Fix: 为搜索内容容器补充垂直居中。Post-fix evidence: 容器、字段、图标和输入文字中心线均为 `449.09px`，且无横向溢出。

## Findings

没有剩余 P0、P1 或 P2 问题。

## Follow-up polish

- P3: 参考图将库存条目压缩为更轻量的分隔列表；实现保留了当前产品中的“拆盒 / 出库 / 删除”快捷操作和卡片结构，这是为避免功能回退而保留的有意差异。
- Chrome 控制扩展产生了 message-channel closed 日志；该日志来自浏览器扩展通信，不是应用运行错误。

## Implementation checklist

- [x] 品牌单选筛选
- [x] 柜号单选筛选
- [x] 品牌与柜号组合筛选
- [x] 搜索、筛选与数量/价值同步
- [x] 原盒和散养独立统计
- [x] 长数量与长金额自适应
- [x] 390 × 844 无横向溢出
- [x] 搜索图标、占位文字与胶囊容器垂直居中
- [x] 生产构建通过

final result: passed
