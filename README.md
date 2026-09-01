# 星光市长 · 大型优化版

一款以光污染、低碳城市与星空恢复为主题的 3D 策略小游戏。玩家需要在财政、环境、星空与居民满意度之间保持平衡，完成六个逐步升级的关卡。

## 本版重点

- 修复达成目标后不能正常进入下一关的问题，并增加明确的关卡结算页。
- 将六关压缩为 4 分 30 秒至 6 分钟的高压决策局，每 30 秒推进一天；紧急事件最早 60 秒出现、间隔至少 90 秒，弹窗期间暂停计时。
- 重做 15 类 3D 建筑、道路、灯光、天气与动态星空表现；医院、体育馆、地铁站、商业楼等具有独立结构、入口、屋顶设备与夜景层次。
- 增加动态像素比与性能监控；设备持续掉帧时自动切换低画质。
- 增加 4 套声音方案，包含通关、最终通关、失败、成就四类试听：
  - 星河叙事
  - 弦乐庆典
  - 轻快城市
  - 星尘合成（浏览器实时生成的原创轻量音效）
- 增加试玩反馈表单与可选 Supabase 匿名数据记录。
- 增加 54 项自动检查，覆盖通关与下一关切换、倒计时、暂停、紧急事件频率、可通关路线与音频配置完整性。

## 本地运行

需要 Node.js 与 pnpm。

```bash
pnpm install
pnpm dev
```

完整检查：

```bash
pnpm check
```

正式构建输出在 `dist/`。

## Supabase（可选）

游戏在没有 Supabase 环境变量时也可以完整离线运行。若要收集匿名试玩反馈，请复制 `.env.example` 为 `.env.local` 并填写项目地址与匿名密钥，再执行 `docs/supabase-setup.sql`。

## GitHub 参考

本版只参考官方项目的公开设计与文档，没有复制第三方游戏素材或音乐：

- [pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber)：React 与 Three.js 场景组织方式。
- [pmndrs/drei](https://github.com/pmndrs/drei)：`AdaptiveDpr`、`PerformanceMonitor` 与控制器的性能回退思路。
- [Tonejs/Tone.js](https://github.com/Tonejs/Tone.js)：浏览器需在用户首次交互后启动声音，以及按音频时钟调度短音符的原则。本项目为减小体积，使用原生 Web Audio 实现原创合成方案。

更详细的采用记录见 `docs/github-references.md`。
