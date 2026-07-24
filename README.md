# Learn New

<p align="center">
  <strong>把“我好像看懂了”，变成“我真的能讲明白”。</strong>
</p>

<p align="center">
  A warm AI learning workspace powered by Feynman teach-backs and Socratic questioning.
</p>

<p align="center">
  <a href="https://learn-new-lia.shudongdev.chatgpt.site/"><strong>在线体验</strong></a>
  ·
  <a href="#安装-learn-new-skill"><strong>安装 Skill</strong></a>
  ·
  <a href="#本地运行与部署"><strong>自行部署</strong></a>
</p>

<p align="center">
  <img src="./assets/learn-new-demo.gif" alt="Learn New 在线学习产品动态预览" width="920" />
</p>

## Learn New 是什么

Learn New 是一个帮助人们学习陌生概念的 AI 学习产品。它不把学习简化成“问一句、答一句”，而是把资料、讲解、理解检查和主动复述组织成一条可以完成、验证和继续调整的学习路径。

项目来自一次真实的学习经历：把教材、重点和历年资料交给 AI，让 AI 通过一问一答带着学习，并要求学习者把刚学到的内容重新讲出来。这个过程比反复阅读更容易暴露“看懂了但讲不清”的地方。

大学期末复习只是最早的使用场景。Learn New 面向所有想学习新概念的人，例如：

- 第一次理解 AI Agent、Workflow 或 Connector；
- 学习心理学、经济学、管理学与产品分析；
- 从论文、教材、课程讲义或自己的资料开始学习；
- 建立一项新技能，或者为一场考试进行结构化复习。

## 核心思想

Learn New 把两种经典方法放进同一个学习循环：

### 费曼学习法 · Feynman Technique

学习者暂时成为老师，用自己的话解释概念。AI 先复述它听到的意思，再指出遗漏、含糊或不能自洽的部分。能够讲清楚，才算接近真正理解。

### 苏格拉底学习法 · Socratic Method

AI 不急着给出结论，而是通过递进问题检查前提、证据、边界和反例，让学习者自己走到答案附近。

两种方法共同服务于一个目标：

> 不以“看过多少”为进度，而以“能否解释、比较、迁移和应用”为掌握证据。

## 产品流程

```text
导入资料或选择领域
        ↓
分析学科并生成顺序学习地图
        ↓
用简单语言讲清一个知识点
        ↓
进行理解检查
        ↓
选择费曼模式或苏格拉底模式
        ↓
AI 复述、发现缺口并继续追问
        ↓
记录认知校准档案，调整下一步学习
```

1. **导入资料**：上传教材、论文、讲义等资料，或直接使用预置知识包。
2. **生成学习地图**：把内容整理成有先后关系的学习路径，写明每一步学什么、怎么学、预计多久、什么算完成。
3. **简单讲解**：先建立直观模型，并保留贴近日常的例子。
4. **掌握检查**：用户确认理解后，通过问题检查是否真的掌握。
5. **深度学习**：切换费曼学习法或苏格拉底学习法。
6. **老师式反馈**：AI 先复述用户的意思，再针对遗漏与模糊处追问。
7. **持续适应**：把学习证据记录为“认知校准档案”，用于调整后续路径。

## 两种使用方式

### 1. 在线体验

访问 [Learn New 在线体验](https://learn-new-lia.shudongdev.chatgpt.site/)。

当前线上版本可以体验官网、邮箱登录流程、领域书架、顺序学习地图、简单讲解、费曼/苏格拉底模式、学习中心与个性化设置。

> 当前版本是公开产品体验版。登录、云端记录、资料解析和真实 AI 调用仍需接入正式后端后才能用于生产环境。

### 2. 安装 Skill

Skill 版本适合希望直接在 Codex 中使用 Learn New 学习流程的人。

```text
Use $learn-new to help me understand what an AI Agent is from scratch.
```

```text
Use $learn-new to turn these materials into a learning map and begin with the first concept.
```

```text
Use $learn-new to review this topic with Feynman teach-back and Socratic questions.
```

## 安装 Learn New Skill

下载并解压 [`downloads/Learn-New-skill.zip`](./downloads/Learn-New-skill.zip)，然后将其中的 `learn-new` 文件夹放入 Codex 的 Skills 目录：

```text
~/.codex/skills/learn-new/
```

安装后的关键结构如下：

```text
learn-new/
├── SKILL.md
├── agents/
│   └── openai.yaml
└── references/
    └── learning-modes.md
```

重新启动 Codex 后，可以在对话中使用 `$learn-new`。

## 这些文件分别是什么

### `SKILL.md`

这是 Skill 的核心说明书，也是 AI 的“教学工作流”。它定义：

- 什么情况下触发 Learn New；
- AI 应该先问什么、怎样生成学习地图；
- 如何进行简单讲解、掌握检查、费曼复述与苏格拉底追问；
- 什么才算可观察的掌握证据；
- 隐私、考试诚信和事实准确性等边界。

它不是面向访客的项目介绍；面向访客的说明放在本 README 中。

### `agents/openai.yaml`

这是 Skill 在产品界面中的展示信息，包含显示名称、简短说明和默认启动提示词。它决定用户在 Skill 列表里看到什么，但不承载完整教学逻辑。

### `references/`

这里保存更详细、按需读取的教学手册，例如概念学习、技能学习、考试复习、诊断题、费曼模式和苏格拉底模式。把细节放进 references，可以让 `SKILL.md` 保持简洁，只在需要时加载相应内容。

### `AGENTS.md`

这是给维护项目的编程智能体看的长期规则。它记录产品名称、目标用户、学习流程、视觉方向、隐私约束以及“不得公开公司内部项目”等不能被后续修改破坏的决定。

简单理解：

| 文件 | 服务对象 | 主要作用 |
| --- | --- | --- |
| `README.md` | 访客与贡献者 | 介绍产品、安装与部署 |
| `SKILL.md` | 执行学习任务的 AI | 定义教学工作流 |
| `agents/openai.yaml` | Skill 产品界面 | 定义展示名称与默认提示词 |
| `references/` | 执行学习任务的 AI | 按需提供详细教学手册 |
| `AGENTS.md` | 维护项目的编程 AI | 保存长期产品与开发规则 |

## 仓库结构

```text
learn-new-things/
├── README.md
├── SKILL.md
├── AGENTS.md
├── agents/
│   └── openai.yaml
├── references/
│   └── learning-modes.md
├── assets/
│   └── learn-new-demo.gif
└── downloads/
    ├── Learn-New-skill.zip
    └── Learn-New-web.zip
```

`downloads/Learn-New-web.zip` 是可运行的 React + Vite 网页源代码包，包含官网、领域书架、学习空间、学习中心和设置页面。

## 本地运行与部署

1. 下载并解压 [`downloads/Learn-New-web.zip`](./downloads/Learn-New-web.zip)。
2. 进入解压后的目录。
3. 安装依赖并启动：

```bash
npm install
npm run dev
```

生成可部署版本：

```bash
npm run build
```

静态页面会生成在 `dist/client`。可以部署到支持静态网站的托管平台。使用者需要自行配置真实登录、数据库、文件存储和安全的 AI API 服务，切勿把 API Key 直接写进前端代码。

## 当前进度

- [x] 费曼学习与苏格拉底追问的 Skill 工作流
- [x] 概念、技能和考试三类学习场景
- [x] 顺序学习地图与掌握证据
- [x] 桌面端优先、适配手机的交互原型
- [x] 中文、English、日本語、한국어入口
- [x] 在线体验与可下载网页源代码
- [ ] 真实邮箱账号与云端学习记录
- [ ] 教材、论文等资料的正式解析与存储
- [ ] 安全的服务端 AI 接入与用户自带 API Key
- [ ] 语音输入和语音复述
- [ ] 基于学习证据的长期自适应路径

## 隐私与公开边界

- 不提交 API Key、账号凭据、个人学习记录或私密资料；
- 不公开任何公司内部项目、数据、文档、流程或客户信息；
- 示例资料只使用公开内容或虚构数据；
- 对高风险或时效性知识，应优先核验权威来源；
- Learn New 用于学习辅助，不协助正在进行的考试作弊。

## 一起完善 Learn New

欢迎 Fork、部署体验、提交 Issue 或分享新的学习场景。尤其欢迎以下方向：

- 更自然的费曼复述反馈；
- 更有深度但不令人挫败的苏格拉底问题；
- 文件解析、知识切分与学习地图生成；
- 成年学习者友好的掌握度与认知校准设计；
- 多语言体验与无障碍设计。

---

Built in public by [Elia](https://github.com/liaxuan1206).
