# GitHub 方案采用记录

检索日期：2026-08-31

## 1. React Three Fiber

仓库：https://github.com/pmndrs/react-three-fiber

采用范围：保留 React 组件化的 3D 场景结构，并将主场景作为延迟加载模块，避免主菜单首次加载时同时下载完整 Three.js 场景。

## 2. Drei

仓库：https://github.com/pmndrs/drei

采用范围：

- `AdaptiveDpr`：在相机操作导致性能回退时临时降低像素比。
- `OrbitControls regress`：相机移动时通知渲染器进入性能回退状态。
- `PerformanceMonitor`：监测持续掉帧；若高画质无法稳定运行，自动切换到低画质。

## 3. Tone.js

仓库：https://github.com/Tonejs/Tone.js

采用范围：参考其官方 README 中的浏览器音频启动与精确时间调度原则。为了不增加运行包体积，项目没有加入 Tone.js 依赖，而是使用原生 Web Audio API 创建“星尘合成”方案。

## 边界

- 未下载或复制 GitHub 仓库中的美术、音乐和游戏资产。
- 未引入来源不清楚的 3D 模型。
- 所有新增合成旋律均为简短原创提示音，不模仿具体游戏或音乐作品。
