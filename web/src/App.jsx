import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  Books,
  Brain,
  CalendarBlank,
  CaretDown,
  CaretRight,
  ChartBar,
  Check,
  CheckCircle,
  CircleNotch,
  ClockCounterClockwise,
  Compass,
  FilePdf,
  FileText,
  FolderOpen,
  Gear,
  GraduationCap,
  House,
  Key,
  Lightbulb,
  ListChecks,
  LockKey,
  MagnifyingGlass,
  MapTrifold,
  Microphone,
  PaperPlaneTilt,
  PencilSimple,
  Plus,
  Question,
  SealCheck,
  ShieldCheck,
  SignOut,
  SlidersHorizontal,
  Sparkle,
  Star,
  Target,
  TrendUp,
  UploadSimple,
  User,
  UserCircle,
  X,
} from "@phosphor-icons/react";
import {
  calibrationItems,
  feedbackByMode,
  historyItems,
  knowledgePacks,
} from "./data.js";
import { api } from "./api.js";

const STAGES = [
  { id: "materials", label: "准备资料", copy: "选资料", icon: FolderOpen },
  { id: "map", label: "确认路径", copy: "看顺序", icon: MapTrifold },
  { id: "lesson", label: "故事讲解", copy: "先听懂", icon: BookOpen },
  { id: "check", label: "互动检查", copy: "再验证", icon: ListChecks },
  { id: "deep", label: "费曼 · 苏格拉底", copy: "讲出来", icon: Brain },
];

const REVIEW_ITEMS = [
  {
    id: "dual-process-boundary",
    topic: "系统 1 并不等于不理性",
    pack: "心理学 · 双系统思维",
    due: "今天",
    duration: "6 分钟",
    reason: "首次间隔巩固",
    evidence: "能举出一个有效直觉和一个误判情境",
    mastery: 64,
    tone: "pink",
  },
  {
    id: "need-solution-boundary",
    topic: "需求与方案的边界",
    pack: "产品分析",
    due: "今天",
    duration: "4 分钟",
    reason: "认知校准待验证",
    evidence: "能把同一需求改写成两个不同方案",
    mastery: 72,
    tone: "lavender",
  },
  {
    id: "motivation-transfer",
    topic: "内在动机与外在激励",
    pack: "管理学",
    due: "明天",
    duration: "5 分钟",
    reason: "7 天后迁移复习",
    evidence: "能判断奖励何时反而削弱动机",
    mastery: 84,
    tone: "peach",
  },
];

function createDefaultStudyPlan() {
  const templates = [
    ["建立故事直觉", "故事讲解", 18, "能说出故事里的两种判断方式"],
    ["揭示正式概念", "定义解码", 22, "能解释系统 1 与系统 2 的核心差别"],
    ["完成第一次检索", "互动检查", 15, "不看资料答对关键理解题"],
    ["讲给外行人听", "费曼复述", 20, "用一个生活例子讲清概念"],
    ["补上边界反例", "苏格拉底追问", 20, "说出快速直觉有效与失效的情境"],
    ["迁移到真实决策", "迁移练习", 25, "用双系统思维复盘一次真实选择"],
    ["完成一周回顾", "间隔复习", 15, "脱离资料完成复述并写下下一步"],
  ];
  const now = new Date();
  return {
    goal: "掌握双系统思维，并能用它解释真实决策",
    dailyMinutes: 25,
    tasks: templates.map(([title, method, duration, evidence], index) => {
      const date = new Date(now);
      date.setDate(now.getDate() + index);
      return {
        id: `sprint-${index + 1}`,
        day: `第 ${index + 1} 天`,
        date: date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }),
        title,
        method,
        duration,
        evidence,
        done: false,
      };
    }),
  };
}

const EMPTY_NOTE = { example: "", boundary: "", question: "" };

const PSYCHOLOGY_PATH = [
  {
    id: "overview",
    title: "建立全局框架",
    goal: "先理解为什么大脑需要两套思考系统",
    method: "3 分钟引导",
    doneWhen: "能说出两套系统的基本差异",
    duration: "3 分钟",
    status: "current",
  },
  {
    id: "system1",
    title: "学会识别系统 1",
    goal: "判断哪些反应来自快速直觉",
    method: "寓言故事 + 延迟揭示 + 隐喻拆解",
    doneWhen: "能从日常行为中找出一个系统 1",
    duration: "9 分钟",
    status: "queued",
  },
  {
    id: "system2",
    title: "学会调用系统 2",
    goal: "知道什么时候必须停下来分析",
    method: "完整解读 + 对比讲解",
    doneWhen: "能判断一个任务是否需要主动分析",
    duration: "8 分钟",
    status: "queued",
  },
  {
    id: "cooperate",
    title: "看见两者如何协作",
    goal: "理解它们不是对错关系，而是不同分工",
    method: "情境判断",
    doneWhen: "能解释一次从直觉切换到分析的过程",
    duration: "6 分钟",
    status: "queued",
  },
  {
    id: "bias",
    title: "识别常见认知偏差",
    goal: "认识锚定、损失厌恶与框架效应",
    method: "案例拆解",
    doneWhen: "能指出案例中是哪一种偏差",
    duration: "10 分钟",
    status: "queued",
  },
  {
    id: "teachback",
    title: "讲给 AI 听并校准",
    goal: "用自己的话重建整套概念",
    method: "费曼模式或苏格拉底模式",
    doneWhen: "能讲清概念、举例并回应一次追问",
    duration: "12 分钟",
    status: "queued",
  },
];

const AI_AGENT_PATH = [
  {
    id: "agent-or-chat",
    title: "先分清 Agent 与聊天机器人",
    goal: "理解“回答问题”和“替你完成任务”的区别",
    method: "工单故事 + 对比讲解",
    doneWhen: "能用一句话说出 Agent 的任务闭环",
    duration: "6 分钟",
    status: "current",
  },
  {
    id: "goal-state",
    title: "看懂目标与状态",
    goal: "知道 Agent 如何判断下一步该做什么",
    method: "任务拆解",
    doneWhen: "能区分目标、当前状态与完成条件",
    duration: "7 分钟",
    status: "queued",
  },
  {
    id: "tools",
    title: "理解工具调用与权限",
    goal: "知道模型如何通过工具读取或改变外部系统",
    method: "连接器演示 + 风险边界",
    doneWhen: "能解释为什么高风险操作必须确认",
    duration: "8 分钟",
    status: "queued",
  },
  {
    id: "workflow",
    title: "区分 Workflow 与 Agent",
    goal: "判断什么时候固定流程比自主决策更可靠",
    method: "流程对照",
    doneWhen: "能为一个任务选择合适的自动化方式",
    duration: "7 分钟",
    status: "queued",
  },
  {
    id: "memory",
    title: "划清记忆与知识边界",
    goal: "理解上下文、长期记忆与知识库各自负责什么",
    method: "边界案例",
    doneWhen: "能指出一条不应该被长期保存的信息",
    duration: "7 分钟",
    status: "queued",
  },
  {
    id: "teachback",
    title: "设计一个 Agent 并讲给 AI 听",
    goal: "把目标、工具、流程、权限和完成条件连起来",
    method: "费曼模式或苏格拉底模式",
    doneWhen: "能讲清方案，并回答一次边界追问",
    duration: "10 分钟",
    status: "queued",
  },
];

const PSYCHOLOGY_EXPERIENCE = {
  conceptTitle: "双系统思维",
  conceptEnglish: "Dual-Process Theory",
  path: PSYCHOLOGY_PATH,
  totalDuration: "约 45 分钟",
  sourceLabel: "《思考，快与慢》· 第 20—38 页",
  sourceExcerpts: [
    "系统 1 持续自动运行，系统 2 通常处于低努力状态。",
    "注意力被占用时，我们更容易依赖直觉判断。",
    "熟练经验能让系统 1 形成有效、快速的专业直觉。",
  ],
  boundary: "两套系统并非“错误”与“正确”的关系，专业训练也可能让费力分析逐渐变成可靠直觉。",
  check: {
    question: "下面哪句话最准确地描述了系统 1 与系统 2？",
    options: [
      "系统 1 总是容易出错，系统 2 总是正确",
      "系统 1 负责快速直觉，系统 2 负责需要注意力的分析",
      "只有经过专业训练的人才会使用系统 2",
      "系统 1 与系统 2 不会在同一个问题里共同工作",
    ],
    correctIndex: 1,
    success: "两套系统不是正确与错误的对立，而是在速度、注意力与适用情境上不同。",
    retry: "系统 1 也能在熟悉情境中非常有效；系统 2 也可能因为信息不足而判断失误。",
  },
  prompts: {
    feynman: "请把我当成一个完全没学过心理学的人。你能用一个生活中的例子，讲清楚系统 1 和系统 2 的区别吗？",
    socratic: "你刚才说系统 2 更适合复杂问题。我们先从一个问题开始：你如何判断一个问题是否“复杂”？",
  },
  feedback: feedbackByMode,
};

const AI_AGENT_EXPERIENCE = {
  conceptTitle: "AI 智能体",
  conceptEnglish: "AI Agents",
  path: AI_AGENT_PATH,
  totalDuration: "约 45 分钟",
  sourceLabel: "Learn New 演示知识包 · Agent 架构基础",
  sourceExcerpts: [
    "聊天模型负责理解与生成；Agent 还需要目标、状态、工具和完成条件。",
    "Workflow 适合步骤稳定的任务，Agent 适合需要根据环境选择下一步的任务。",
    "读取与写入外部系统是两种不同风险等级，后者通常需要明确确认。",
  ],
  boundary: "Agent 的价值不等于自主程度越高越好。流程越确定、风险越高，越应该收紧工具权限和决策空间。",
  check: {
    question: "下面哪句话最准确地描述了 AI 智能体？",
    options: [
      "只要能连续聊天，就已经是完整的 AI 智能体",
      "AI 智能体围绕目标观察状态、选择行动并借助工具推进任务",
      "AI 智能体应该拥有尽可能多的工具权限",
      "Workflow 和 AI 智能体没有本质区别",
    ],
    correctIndex: 1,
    success: "准确。Agent 的关键是围绕目标形成“观察—决策—行动—校验”的任务闭环，而不只是生成一段回答。",
    retry: "先抓住任务闭环：Agent 不只输出文字，还要知道目标、当前状态、可用工具和完成条件。",
  },
  prompts: {
    feynman: "请把我当成一个第一次听说 Agent 的同事。用“处理一张退款工单”的例子，讲清楚聊天机器人、Workflow 和 Agent 的区别。",
    socratic: "你准备让 Agent 自动处理退款。第一个问题：它可以自主决定什么，哪一步必须让人确认？",
  },
  feedback: {
    feynman: {
      recap: "我先复述一下：聊天机器人主要给出回答，Workflow 按固定步骤执行，而 Agent 会根据目标和当前状态选择下一步，并通过工具推进任务。",
      probe: "还差一个关键边界：当 Agent 要写入订单或触发退款时，为什么不能沿用读取信息时的同一权限？",
    },
    socratic: {
      recap: "我听到你的设计是：Agent 可以收集订单信息并判断是否符合规则，真正退款前再交给人确认。",
      probe: "如果退款规则本身存在例外，你准备用什么完成条件，让 Agent 知道该停止并升级给人工？",
    },
  },
  lesson: {
    titles: ["凌晨两点，运营台收到一张模糊工单", "当“帮我处理退款”不再只是一句回答", "揭晓：你刚刚遇见的是“AI 智能体”"],
    subtitles: [
      "先不背架构名词。跟着一张工单，看一个系统怎样从“会回答”走向“能完成”。",
      "故事接近结尾：真正的差别藏在系统是否知道下一步该做什么。",
      "现在把故事翻译成 Agent、Workflow、工具调用与权限边界。",
    ],
    opening: "凌晨两点，一位用户只留下了一句“昨天的订单不对，帮我处理一下”。值班系统先生成了一段礼貌说明，却没有检查订单，也没有判断是否符合退款规则。另一套系统先确认目标，再查看订单状态、调用规则库，并把高风险操作停在最后一步等待确认。",
    actors: [
      ["回答助手", "小答", "擅长理解问题和生成说明，但回答结束后，任务本身可能还没有推进。"],
      ["任务调度员", "阿行", "围绕目标观察状态、选择工具，并不断检查距离完成条件还有多远。"],
    ],
    quote: "真正的变化不是它说得更像人，而是它开始为结果负责：知道目标、选择动作，也知道什么时候必须停下。",
    climax: [
      "阿行读取订单后发现：商品已发货、支付渠道支持原路退回，但用户填写的原因不完整。它没有直接退款，而是先追问缺失信息，再把规则判断和证据整理给值班人员。",
      "当值班人员确认后，阿行才调用退款工具，并重新读取订单状态验证是否成功。第二天复盘时，团队发现真正可靠的不是“全自动”，而是每一步都有清楚的权限、证据和停止条件。",
    ],
    reveal: "AI 智能体不是更会聊天的模型，而是一套围绕目标持续观察状态、选择行动、调用工具并校验结果的系统。",
    definitionTitle: "模型负责思考，Agent 系统负责让思考进入可控的任务闭环",
    definition: "一个可用的 AI 智能体通常包含目标、状态、决策、工具、记忆或知识来源，以及明确的完成与停止条件。Workflow 提供确定的骨架，Agent 只在真正需要判断的节点拥有有限自主权。",
    metaphors: [
      ["01", "退款工单", "来自真实环境的任务输入，信息可能不完整，也可能在处理中发生变化。", "环境与状态"],
      ["02", "小答", "只完成理解与生成，没有持续追踪任务是否真正结束。", "聊天模型"],
      ["03", "阿行", "根据目标和状态选择下一步，并调用外部工具推进任务。", "Agent 循环"],
      ["04", "人工确认", "在不可逆或高风险动作前收紧权限，必要时升级给人。", "治理边界"],
    ],
    analogy: "旅行规划助手可以查询航班、比较路线并整理方案；但在真正扣款出票前，应该再次展示价格、乘客和退改规则，并等待你的明确确认。",
    compare: [
      ["固定骨架", "Workflow", "步骤预先定义，结果更可预测，适合规则稳定、风险较高的流程。", "优势：稳定、可测试", "风险：难以处理未预见情况"],
      ["动态决策", "Agent", "会根据目标和当前状态选择下一步，适合开放、信息不断变化的任务。", "优势：适应变化", "风险：需要更严格的权限与停止条件"],
    ],
  },
};

function createGenericExperience(pack) {
  const conceptTitle = pack?.subtitle || pack?.title || "新的知识主题";
  const topicTitle = pack?.title || "自有资料";
  const path = [
    ["framework", "建立主题框架", `先看清${topicTitle}要解决的核心问题`, "问题地图", "能说出核心问题与学习目标", "5 分钟"],
    ["concepts", "识别关键概念", `理解“${conceptTitle}”里的关键词`, "故事讲解 + 概念拆解", "能解释两个关键概念的差异", "8 分钟"],
    ["relations", "连接概念关系", "把零散知识连成可以推理的结构", "关系对照", "能说出概念之间如何互相影响", "8 分钟"],
    ["case", "带入真实案例", "检验概念在具体情境里是否成立", "案例拆解", "能用证据解释一次真实判断", "7 分钟"],
    ["boundary", "寻找反例与边界", "知道结论什么时候不适用", "反例练习", "能补充一个边界条件", "7 分钟"],
    ["teachback", "讲给 AI 听并校准", "用自己的话重建整套理解", "费曼模式或苏格拉底模式", "能讲清主线并回应一次追问", "10 分钟"],
  ].map(([id, title, goal, method, doneWhen, duration], index) => ({
    id,
    title,
    goal,
    method,
    doneWhen,
    duration,
    status: index === 0 ? "current" : "queued",
  }));

  return {
    conceptTitle,
    conceptEnglish: topicTitle,
    path,
    totalDuration: "约 45 分钟",
    sourceLabel: pack?.id === "upload" ? `本地资料 · ${pack.title}` : `Learn New 预置知识包 · ${topicTitle}`,
    sourceExcerpts: [
      `先从“${conceptTitle}”要解决的真实问题开始，而不是孤立地背定义。`,
      "一个可靠的理解应同时包含主张、证据、适用条件和反例。",
      "能用自己的例子复述，并回答边界追问，才算形成可迁移的掌握。",
    ],
    boundary: `${topicTitle}的演示路径用于展示学习方法；正式内容仍应结合原始资料、证据来源与适用边界校准。`,
    check: {
      question: `学习“${conceptTitle}”时，哪一种做法最能证明你真正理解了？`,
      options: [
        "记住知识包里的全部原句",
        "能用自己的话解释、举例，并说明一个不适用的情境",
        "只要阅读时间足够长就算掌握",
        "让 AI 直接给出最终答案",
      ],
      correctIndex: 1,
      success: "准确。可迁移的理解不仅能复述主张，还能举例、解释依据并说清适用边界。",
      retry: "先把“记住”与“理解”分开：真正理解应该经得起自己的例子、反例和追问。",
    },
    prompts: {
      feynman: `请把我当成完全不了解${topicTitle}的人。不要照抄定义，用一个真实例子讲清楚“${conceptTitle}”。`,
      socratic: `你认为“${conceptTitle}”成立。我们先从一个问题开始：这个判断依赖了哪些前提？`,
    },
    feedback: {
      feynman: {
        recap: `我先复述一下：你正在用自己的场景解释“${conceptTitle}”，并把抽象概念落到了一个可观察的结果上。`,
        probe: "我想再追问一处：如果关键前提不成立，你的例子会在哪一步失效？",
      },
      socratic: {
        recap: "我听到你的核心判断和一条支持理由，但其中还有一个默认前提没有被说出来。",
        probe: "我们只检查这一处：什么证据出现时，你会愿意修改现在的判断？",
      },
    },
  };
}

function getLearningExperience(pack) {
  if (!pack || pack.id === "psychology") return PSYCHOLOGY_EXPERIENCE;
  if (pack.id === "ai-agents") return AI_AGENT_EXPERIENCE;
  return createGenericExperience(pack);
}

const LANGUAGE_OPTIONS = [
  { id: "zh", label: "中文", locale: "zh-CN" },
  { id: "en", label: "English", locale: "en-US" },
  { id: "ja", label: "日本語", locale: "ja-JP" },
  { id: "ko", label: "한국어", locale: "ko-KR" },
];

const LANGUAGE_COPY = {
  zh: {
    nav: ["产品能力", "学习方法", "精选领域"],
    note: "带着一个问题来",
    login: "登录 / 注册",
    heroTag: "学会一个概念，而不是看完一段回答",
    heroTitleA: "把新知识放上桌，",
    heroTitleB: "一步一步",
    heroTitleAccent: "真正学会",
    heroCopy: "导入任何学习资料，AI 会先整理证据与学习路径，再用故事化讲解、掌握检查、费曼复述和苏格拉底追问，陪你把陌生概念变成自己的知识。",
    start: "开始我的学习",
    demo: "直接体验 Demo",
    proofs: ["服务器安全托管 AI", "记录学习轨迹", "文字优先，保留语音"],
    daily: "今天也可以只学会一个小概念。",
    prompt: "今天想弄懂什么？",
    authTag: "仅支持邮箱登录",
    authTitle: "继续你的学习旅程",
    signupTitle: "建立你的数字书桌",
    authCopy: "登录后可保存学习路径、掌握度、认知校准档案和个人学习画像。",
    email: "邮箱",
    password: "密码",
    remember: "记住我",
    submit: "登录",
    signup: "创建账号",
  },
  en: {
    nav: ["What it does", "How it works", "Topics"],
    note: "Bring one good question",
    login: "Sign in",
    heroTag: "Learn a concept—not just read an answer",
    heroTitleA: "Put new knowledge on your desk.",
    heroTitleB: "Learn it ",
    heroTitleAccent: "step by step",
    heroCopy: "Bring any learning material. AI turns it into a clear path, explains one idea at a time, checks your understanding, and guides Feynman teach-backs and Socratic questioning.",
    start: "Start learning",
    demo: "Try the demo",
    proofs: ["Server-managed AI", "Keep a learning history", "Text first, voice ready"],
    daily: "One small concept is enough for today.",
    prompt: "What do you want to understand?",
    authTag: "Email sign-in only",
    authTitle: "Continue your learning journey",
    signupTitle: "Create your digital desk",
    authCopy: "Sign in to save learning paths, mastery, calibration notes, and your learner profile.",
    email: "Email",
    password: "Password",
    remember: "Remember me",
    submit: "Sign in",
    signup: "Create account",
  },
  ja: {
    nav: ["できること", "学び方", "学習テーマ"],
    note: "ひとつの疑問から始めよう",
    login: "ログイン",
    heroTag: "答えを読むだけでなく、概念を身につける",
    heroTitleA: "新しい知識を机の上へ。",
    heroTitleB: "一歩ずつ",
    heroTitleAccent: "自分の知識に",
    heroCopy: "学習資料を取り込むと、AIが学習ルートを整理し、やさしい説明、理解チェック、ファインマン式の説明、ソクラテス式の問いかけで学びを支えます。",
    start: "学習を始める",
    demo: "デモを体験",
    proofs: ["サーバー側で AI を安全管理", "学習履歴を保存", "文字入力を優先"],
    daily: "今日は小さな概念をひとつ。",
    prompt: "今日は何を理解したい？",
    authTag: "メールログインのみ",
    authTitle: "学習を続ける",
    signupTitle: "デジタル学習机をつくる",
    authCopy: "ログインすると、学習ルート、習熟度、理解の記録、学習プロフィールを保存できます。",
    email: "メール",
    password: "パスワード",
    remember: "ログインを保持",
    submit: "ログイン",
    signup: "アカウント作成",
  },
  ko: {
    nav: ["제품 기능", "학습 방식", "추천 분야"],
    note: "좋은 질문 하나로 시작하세요",
    login: "로그인",
    heroTag: "답을 읽는 데서 끝내지 말고, 개념을 내 것으로",
    heroTitleA: "새로운 지식을 책상 위에.",
    heroTitleB: "한 단계씩 ",
    heroTitleAccent: "제대로 배우기",
    heroCopy: "어떤 학습 자료든 가져오세요. AI가 학습 경로를 정리하고, 쉬운 설명과 이해 점검, 파인만 복습, 소크라테스식 질문으로 학습을 안내합니다.",
    start: "학습 시작",
    demo: "데모 체험",
    proofs: ["서버에서 AI를 안전하게 관리", "학습 기록 저장", "텍스트 우선, 음성 준비"],
    daily: "오늘은 작은 개념 하나면 충분해요.",
    prompt: "오늘 무엇을 이해하고 싶나요?",
    authTag: "이메일 로그인만 지원",
    authTitle: "학습 여정 이어가기",
    signupTitle: "나만의 디지털 책상 만들기",
    authCopy: "로그인하면 학습 경로, 이해도, 인지 교정 기록과 학습 프로필을 저장할 수 있습니다.",
    email: "이메일",
    password: "비밀번호",
    remember: "로그인 유지",
    submit: "로그인",
    signup: "계정 만들기",
  },
};

function readStorage(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The prototype remains usable when local storage is unavailable.
  }
}

function Logo({ compact = false }) {
  return (
    <button className="brand" type="button" aria-label="返回首页">
      <span className="brand-mark">
        <Sparkle size={compact ? 17 : 20} weight="fill" />
      </span>
      {!compact && <span>Learn New</span>}
    </button>
  );
}

function LanguagePicker({ value, onChange, compact = false }) {
  return (
    <label className={`language-picker ${compact ? "compact" : ""}`}>
      <span>文 / A</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label="选择界面语言">
        {LANGUAGE_OPTIONS.map((language) => (
          <option value={language.id} key={language.id}>{language.label}</option>
        ))}
      </select>
    </label>
  );
}

function Tag({ children, tone = "lavender" }) {
  return <span className={`tag tag-${tone}`}>{children}</span>;
}

function MasteryRing({ value, size = "large" }) {
  return (
    <div
      className={`mastery-ring mastery-${size}`}
      style={{ "--progress": `${Math.max(0, Math.min(value, 100)) * 3.6}deg` }}
      aria-label={`当前掌握度 ${value}%`}
    >
      <div className="mastery-ring-inner">
        <strong>{value}%</strong>
        <span>掌握度</span>
      </div>
    </div>
  );
}

const WEEKDAY_GUIDANCE = {
  0: "周日适合轻松回顾，把这一周的零散想法串成线。",
  1: "周一适合搭建全局框架，先看地图再进入细节。",
  2: "周二适合啃一个难概念，让问题带着你往深处走。",
  3: "周三适合做一次中途校准，检查哪些地方只是“看懂了”。",
  4: "周四适合迁移应用，把概念放进一个真实问题里。",
  5: "周五适合复述总结，用自己的话给这一周收个尾。",
  6: "周六适合跟随好奇心，随手打开一个陌生领域。",
};

function getDateContext() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 6 ? "夜深了" : hour < 11 ? "早上好" : hour < 14 ? "中午好" : hour < 18 ? "下午好" : "晚上好";
  const weekday = now.toLocaleDateString("zh-CN", { weekday: "long" });
  const fullDate = now.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
  const month = now.toLocaleDateString("zh-CN", { month: "long" });
  return { now, greeting, weekday, fullDate, month, guidance: WEEKDAY_GUIDANCE[now.getDay()] };
}

function AppHeader({
  session,
  apiConnected,
  onLogo,
  onLogin,
  onNavigate,
  onLogout,
  language,
  onLanguage,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const copy = LANGUAGE_COPY[language] || LANGUAGE_COPY.zh;

  return (
    <header className={`app-header ${session ? "signed-header" : "public-header"}`}>
      <div onClick={onLogo}>
        <Logo />
      </div>
      {!session && (
        <nav className="top-nav public-nav" aria-label="官网导航">
          <a href="#capabilities">{copy.nav[0]}</a>
          <a href="#method">{copy.nav[1]}</a>
          <a href="#domains">{copy.nav[2]}</a>
        </nav>
      )}
      <div className="header-actions">
        <LanguagePicker value={language} onChange={onLanguage} compact={Boolean(session)} />
        {session ? (
          <>
            <button
              className={`api-status ${apiConnected ? "connected" : ""}`}
              type="button"
              onClick={() => onNavigate("settings")}
            >
              <Key size={17} />
              <span>{apiConnected ? "AI 已连接" : "连接 AI"}</span>
              <span className="status-dot" />
            </button>
            <div className="profile-menu-wrap">
              <button
                className="profile-trigger"
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
              >
                <span className="avatar">LX</span>
                <span className="profile-copy">
                  <strong>{session.name}</strong>
                  <small>持续学习第 12 天</small>
                </span>
                <CaretDown size={15} />
              </button>
              {menuOpen && (
                <div className="profile-menu">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate("settings");
                      setMenuOpen(false);
                    }}
                  >
                    <Gear size={18} />
                    个人设置
                  </button>
                  <button
                    className="menu-logout"
                    type="button"
                    onClick={() => {
                      onLogout();
                      setMenuOpen(false);
                    }}
                  >
                    <SignOut size={18} />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <span className="public-header-note">{copy.note}</span>
            <button className="button button-primary button-small" onClick={onLogin} type="button">
              {copy.login}
            </button>
          </>
        )}
      </div>
    </header>
  );
}

function Landing({ onLogin, onDemo, language }) {
  const copy = LANGUAGE_COPY[language] || LANGUAGE_COPY.zh;
  const date = getDateContext();
  const locale = LANGUAGE_OPTIONS.find((item) => item.id === language)?.locale || "zh-CN";
  const calendarDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(date.now);
    day.setDate(date.now.getDate() - 3 + index);
    return day;
  });

  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <Tag tone="pink">
            <Sparkle size={14} weight="fill" />
             {copy.heroTag}
          </Tag>
          <h1>
            {copy.heroTitleA}
            <br />
            {copy.heroTitleB}<span>{copy.heroTitleAccent}</span>
          </h1>
          <p>
            {copy.heroCopy}
          </p>
          <div className="hero-actions">
            <button className="button button-primary button-large" type="button" onClick={onLogin}>
              {copy.start}
              <ArrowRight size={18} weight="bold" />
            </button>
            <button className="button button-ghost button-large" type="button" onClick={onDemo}>
              <Compass size={19} />
              {copy.demo}
            </button>
          </div>
          <div className="hero-proof">
            <span>
               <CheckCircle size={16} weight="fill" /> {copy.proofs[0]}
            </span>
            <span>
               <CheckCircle size={16} weight="fill" /> {copy.proofs[1]}
            </span>
            <span>
               <CheckCircle size={16} weight="fill" /> {copy.proofs[2]}
            </span>
          </div>
        </div>
        <div className="public-daily-card" aria-label="今日学习日历">
          <div className="daily-topline">
            <span><CalendarBlank size={18} /> {date.fullDate}</span>
            <Tag tone="pink">{date.weekday}</Tag>
          </div>
          <div className="daily-greeting">
            <span>{date.greeting}</span>
            <h2>{copy.daily}</h2>
            <p>{date.guidance}</p>
          </div>
          <div className="week-calendar">
            {calendarDays.map((day) => {
              const active = day.toDateString() === date.now.toDateString();
              return (
                <div className={active ? "active" : ""} key={day.toISOString()}>
                  <small>{day.toLocaleDateString(locale, { weekday: "short" }).replace("周", "")}</small>
                  <strong>{day.getDate()}</strong>
                  <i />
                </div>
              );
            })}
          </div>
          <button type="button" className="daily-prompt" onClick={onDemo}>
             <span><Sparkle size={18} weight="fill" /> {copy.prompt}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
      <section className="public-intro" id="capabilities">
        <div className="section-heading centered">
          <div>
            <span className="eyebrow">它能为你做什么</span>
            <h2>不是再多看一遍，而是把知识变成自己的话</h2>
            <p>从一份资料、一本书或一个好奇的问题出发，AI 把学习过程拆成清晰步骤。</p>
          </div>
        </div>
        <div className="capability-grid">
          <article><span><MapTrifold size={24} /></span><strong>先搭学习地图</strong><p>先看到概念全貌、先后关系和预计时间，再决定从哪里开始。</p></article>
          <article><span><BookOpen size={24} /></span><strong>先讲懂，再互动</strong><p>用故事建立直觉，临近结尾揭示概念，再完整拆解隐喻和边界。</p></article>
          <article><span><Brain size={24} /></span><strong>换你来当老师</strong><p>费曼复述和苏格拉底追问交替，让模糊处自然暴露出来。</p></article>
        </div>
      </section>
      <section className="method-strip" id="method">
        <article>
          <span>01</span>
          <div>
            <strong>先看全局</strong>
            <p>AI 从资料中整理学习地图，告诉你概念之间的关系。</p>
          </div>
        </article>
        <article>
          <span>02</span>
          <div>
            <strong>再讲完整</strong>
            <p>先用寓言故事建立直觉，揭晓后再解释概念、隐喻与边界。</p>
          </div>
        </article>
        <article>
          <span>03</span>
          <div>
            <strong>最后进入互动</strong>
            <p>先检查理解，再用费曼复述和苏格拉底追问暴露盲区。</p>
          </div>
        </article>
      </section>
      <section className="public-domains" id="domains">
        <div>
          <span className="eyebrow">精选领域</span>
          <h2>从好奇心开始，不限定学科</h2>
          <p>心理学、AI 智能体、经济学、批判性思维、沟通与谈判、数据素养……登录后进入完整领域书架，也可以上传自己的资料。</p>
        </div>
        <div className="domain-pills">
          {knowledgePacks.slice(0, 8).map((pack) => <span key={pack.id}>{pack.title}</span>)}
        </div>
      </section>
    </main>
  );
}

function AuthModal({ onClose, onSuccess, onDemo, language }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const copy = LANGUAGE_COPY[language] || LANGUAGE_COPY.zh;

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSuccess({ mode, name, email, password });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const enterDemo = async () => {
    setLoading(true);
    setError("");
    try {
      await onDemo();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="auth-modal" role="dialog" aria-modal="true" aria-label="登录">
        <button className="modal-close" type="button" onClick={onClose} aria-label="关闭">
          <X size={20} />
        </button>
        <div className="auth-brand">
          <Logo />
          <Tag tone="lavender">{copy.authTag}</Tag>
        </div>
        <h2>{mode === "login" ? copy.authTitle : copy.signupTitle}</h2>
        <p>{copy.authCopy}</p>
        <form onSubmit={submit}>
          {mode === "signup" && (
            <label>
              显示名称
              <input
                required
                maxLength={60}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="你希望我们怎么称呼你"
                autoComplete="name"
              />
            </label>
          )}
          <label>
            {copy.email}
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
            />
          </label>
          <label>
            {copy.password}
            <input
              required
              minLength={10}
              maxLength={128}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 10 位字符"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>
          <div className="form-row">
            <label className="check-label">
              <input type="checkbox" defaultChecked />
               <span>{copy.remember}</span>
            </label>
            <button type="button" className="text-button">
              忘记密码？
            </button>
          </div>
          <button className="button button-primary button-full" type="submit" disabled={loading}>
            {loading ? <CircleNotch className="spin" size={20} /> : null}
            {mode === "login" ? copy.submit : copy.signup}
          </button>
          {error && <p className="form-error" role="alert">{error}</p>}
        </form>
        <div className="auth-divider">
          <span>或者</span>
        </div>
        <button
          className="button button-soft button-full"
          type="button"
          onClick={enterDemo}
          disabled={loading}
        >
          <Sparkle size={18} weight="fill" />
          使用演示账号进入
        </button>
        <p className="auth-switch">
          {mode === "login" ? "第一次来？" : "已经有账号？"}
          <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "创建账号" : "直接登录"}
          </button>
        </p>
      </section>
    </div>
  );
}

function OnboardingTour({ onFinish }) {
  const [step, setStep] = useState(0);
  const items = [
    { icon: House, label: "今日桌面", title: "先看看今天适合怎么学", copy: "这里放着你的日历、继续学习和一条不费力的今日建议。" },
    { icon: Books, label: "领域书架", title: "再选择一个想弄懂的领域", copy: "可以直接打开预置知识包，也可以上传教材、论文、讲义或笔记。" },
    { icon: MapTrifold, label: "学习空间", title: "沿着一条清晰路径学习", copy: "资料 → 学习地图 → 故事讲解 → 互动检查 → 费曼 / 苏格拉底学习，当前位置始终可见。" },
    { icon: ChartBar, label: "学习中心", title: "最后回看你的变化", copy: "学习历史、当前薄弱环节、认知校准档案和学习画像都集中在这里。" },
  ];
  const item = items[step];
  const Icon = item.icon;

  return (
    <div className="modal-backdrop tour-backdrop" role="presentation">
      <section className="tour-modal" role="dialog" aria-modal="true" aria-label="新手引导">
        <div className="tour-preview">
          <span className="tour-icon"><Icon size={30} weight="duotone" /></span>
          <Tag tone="pink">{item.label}</Tag>
          <div className="tour-dots">{items.map((entry, index) => <i className={index === step ? "active" : ""} key={entry.label} />)}</div>
        </div>
        <div className="tour-copy">
          <span className="eyebrow">欢迎来到你的数字书桌 · {step + 1} / {items.length}</span>
          <h2>{item.title}</h2>
          <p>{item.copy}</p>
          <div className="tour-route">
            {items.map((entry, index) => (
              <span className={index === step ? "active" : index < step ? "done" : ""} key={entry.label}>
                {index < step ? <Check size={13} /> : index + 1} {entry.label}
              </span>
            ))}
          </div>
          <div className="setup-actions">
            <button className="button button-ghost" type="button" onClick={onFinish}>跳过引导</button>
            <button
              className="button button-primary"
              type="button"
              onClick={() => step === items.length - 1 ? onFinish() : setStep((value) => value + 1)}
            >
              {step === items.length - 1 ? "完成引导" : "下一步"} <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function AIConnectionModal({ serverConnected, selectedPack, onClose, onConnect, onDemo }) {
  return (
    <div className="modal-backdrop setup-backdrop" role="presentation">
      <section className="setup-modal ai-connect-modal" role="dialog" aria-modal="true" aria-label="连接 AI">
        <button className="modal-close" type="button" onClick={onClose} aria-label="关闭"><X size={20} /></button>
        <div className="setup-heading">
          <span className="setup-icon"><ShieldCheck size={25} weight="duotone" /></span>
          <div>
            <Tag tone="lavender">开始「{selectedPack?.title || "新学习"}」前</Tag>
            <h2>{serverConnected ? "AI 学习服务已就绪" : "当前使用演示学习服务"}</h2>
            <p>
              {serverConnected
                ? "模型凭证只保存在服务器环境中，浏览器不会读取或保存密钥。"
                : "完整学习流程可以直接体验；部署时配置服务器 AI 环境变量即可开启真实分析与反馈。"}
            </p>
          </div>
        </div>
        <div className="server-trust-panel">
          <div><LockKey size={19} /><span><strong>凭证不下发</strong> API Key 不进入前端代码、Local Storage 或学习记录。</span></div>
          <div><ShieldCheck size={19} /><span><strong>写操作有边界</strong> 账号与学习记录通过同源、HTTP-only 会话访问。</span></div>
        </div>
        <div className="setup-actions">
          {serverConnected ? (
            <>
              <button className="button button-ghost" type="button" onClick={onDemo}>改用演示内容</button>
              <button className="button button-primary" type="button" onClick={onConnect}>
                开始生成学习路径 <ArrowRight size={17} />
              </button>
            </>
          ) : (
            <button className="button button-primary button-full" type="button" onClick={onDemo}>
              进入演示学习 <ArrowRight size={17} />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function StudySprint({ compact = false, onOpen, onStart, onToast }) {
  const [plan, setPlan] = useState(() => readStorage("lnt_study_plan", createDefaultStudyPlan()));
  const [ready, setReady] = useState(false);
  const [syncState, setSyncState] = useState("正在读取计划");

  useEffect(() => {
    let active = true;
    api.getStudyPlan()
      .then((result) => {
        if (!active) return;
        if (result.plan) setPlan(result.plan);
        setSyncState(result.plan ? "已同步到学习账号" : "已建立新的 7 天冲刺");
      })
      .catch(() => setSyncState("已保存在当前设备"))
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    writeStorage("lnt_study_plan", plan);
    if (!ready) return undefined;
    const timer = window.setTimeout(() => {
      api.saveStudyPlan(plan)
        .then(() => setSyncState("已同步到学习账号"))
        .catch(() => setSyncState("已保存在当前设备"));
    }, 480);
    return () => window.clearTimeout(timer);
  }, [plan, ready]);

  const completed = plan.tasks.filter((task) => task.done).length;
  const progress = Math.round((completed / plan.tasks.length) * 100);
  const nextTask = plan.tasks.find((task) => !task.done) || plan.tasks.at(-1);
  const visibleTasks = compact ? plan.tasks.slice(0, 3) : plan.tasks;
  const updatePlan = (patch) => setPlan((current) => ({ ...current, ...patch }));
  const toggleTask = (id) => {
    setPlan((current) => ({
      ...current,
      tasks: current.tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task),
    }));
    onToast?.("学习冲刺进度已保存");
  };

  return (
    <section className={`study-sprint ${compact ? "study-sprint-compact" : ""}`}>
      <div className="sprint-heading">
        <div>
          <span className="eyebrow">7 天学习冲刺</span>
          {compact ? (
            <><h2>{plan.goal}</h2><p>每天留出 {plan.dailyMinutes} 分钟，把一个概念练到能解释、能举例、能迁移。</p></>
          ) : (
            <>
              <h2>把“想学会”拆成未来七天</h2>
              <p>每一天只有一个明确动作，并用可观察的证据判断是否完成。</p>
            </>
          )}
        </div>
        <div className="sprint-score">
          <strong>{progress}%</strong>
          <span>{completed} / {plan.tasks.length} 天完成</span>
        </div>
      </div>

      {!compact && (
        <div className="sprint-controls">
          <label>
            <span>本周目标</span>
            <input value={plan.goal} onChange={(event) => updatePlan({ goal: event.target.value })} />
          </label>
          <label>
            <span>每天投入</span>
            <select value={plan.dailyMinutes} onChange={(event) => updatePlan({ dailyMinutes: Number(event.target.value) })}>
              {[15, 25, 40, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} 分钟</option>)}
            </select>
          </label>
          <span className="sprint-sync"><CheckCircle size={15} weight="fill" /> {syncState}</span>
        </div>
      )}

      <div className="sprint-week" aria-label="七天学习进度">
        {plan.tasks.map((task, index) => (
          <button
            className={task.done ? "done" : task.id === nextTask?.id ? "current" : ""}
            type="button"
            key={task.id}
            onClick={() => toggleTask(task.id)}
            aria-label={`${task.day}：${task.title}，${task.done ? "已完成" : "未完成"}`}
          >
            <small>{task.day.replace("第 ", "D")}</small>
            <span>{task.done ? <Check size={13} weight="bold" /> : index + 1}</span>
            <b>{task.date}</b>
          </button>
        ))}
      </div>

      <div className="sprint-task-list">
        {visibleTasks.map((task) => (
          <article className={task.done ? "done" : task.id === nextTask?.id ? "current" : ""} key={task.id}>
            <button className="sprint-check" type="button" onClick={() => toggleTask(task.id)} aria-label={`切换任务状态：${task.title}`}>
              {task.done ? <Check size={15} weight="bold" /> : null}
            </button>
            <div>
              <small>{task.day} · {task.date} · {task.duration} 分钟</small>
              <strong>{task.title}</strong>
              {!compact && <p><b>完成证据：</b>{task.evidence}</p>}
            </div>
            <Tag tone={task.done ? "green" : task.id === nextTask?.id ? "pink" : "lavender"}>{task.done ? "已完成" : task.method}</Tag>
          </article>
        ))}
      </div>

      <div className="sprint-footer">
        {compact ? (
          <>
            <button className="button button-primary" type="button" onClick={onStart}>继续今日任务 <ArrowRight size={15} /></button>
            <button className="text-button with-icon" type="button" onClick={onOpen}>查看完整冲刺 <ArrowRight size={15} /></button>
          </>
        ) : (
          <span><Target size={17} /> 当前下一步：<strong>{nextTask?.title}</strong></span>
        )}
      </div>
    </section>
  );
}

function ReviewQueue({ compact = false, onReview, onViewAll }) {
  const visibleItems = compact ? REVIEW_ITEMS.slice(0, 2) : REVIEW_ITEMS;

  return (
    <section className={`review-queue ${compact ? "review-queue-compact" : ""}`}>
      <div className="review-heading">
        <div>
          <span className="eyebrow">间隔复习</span>
          <h2>把快忘掉的知识，及时捡回来</h2>
          <p>不是重读一遍，而是用一个例子、一个反例和一次复述，确认你还会不会用。</p>
        </div>
        <div className="review-summary" aria-label="今日复习摘要">
          <span><strong>2</strong> 今日到期</span>
          <span><strong>10</strong> 预计分钟</span>
          <span><SealCheck size={16} weight="fill" /> 以证据为完成标准</span>
        </div>
      </div>

      <div className="review-list">
        {visibleItems.map((item, index) => (
          <article className="review-item" key={item.id}>
            <span className={`review-index ${item.tone}`}>{String(index + 1).padStart(2, "0")}</span>
            <div className="review-copy">
              <div className="review-meta">
                <Tag tone={item.due === "今天" ? "pink" : "lavender"}>{item.due}</Tag>
                <span>{item.pack}</span>
                <span>{item.duration}</span>
              </div>
              <h3>{item.topic}</h3>
              <p><strong>完成证据：</strong>{item.evidence}</p>
              <div className="review-progress">
                <span><i style={{ width: `${item.mastery}%` }} /></span>
                <small>当前掌握 {item.mastery}% · {item.reason}</small>
              </div>
            </div>
            <button className="button button-soft" type="button" onClick={onReview}>
              开始复习 <ArrowRight size={15} />
            </button>
          </article>
        ))}
      </div>

      <div className="review-footer">
        <small>演示计划依据示例学习记录与认知校准生成；接入真实调度模型后再计算个人到期时间。</small>
        {compact && (
          <button className="text-button with-icon" type="button" onClick={onViewAll}>
            查看完整复习计划 <ArrowRight size={15} />
          </button>
        )}
      </div>
    </section>
  );
}

function Desk({ session, onStart, onOpenWorkspace, onNavigate, onToast }) {
  const date = getDateContext();
  const [briefTab, setBriefTab] = useState("趣事");
  const briefing = {
    趣事: {
      eyebrow: "心理学小趣事",
      title: "越容易想起的事，我们越容易高估它发生的概率",
      copy: "这叫“可得性启发”。下次看到一个令人印象深刻的案例，可以顺手问自己：它真的常见，还是只是更容易被记住？",
      action: "把它加入今日思考",
    },
    动态: {
      eyebrow: "AI 今日观察",
      title: "Agent 的重点，不只是会聊天",
      copy: "规划步骤、调用工具、读取结果并继续修正，才构成一段完整的智能体工作流。可以从“它替我完成了哪条闭环”来判断价值。",
      action: "去学习 AI 智能体",
    },
    灵感: {
      eyebrow: "学习方法灵感",
      title: "把概念讲一遍，比再看一遍更容易发现空白",
      copy: "如果某一句突然讲不下去，那不是失败，而是最有价值的信号：你刚刚找到了需要继续澄清的位置。",
      action: "开始一次费曼复述",
    },
  };
  const activeBrief = briefing[briefTab];
  const week = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(date.now);
    day.setDate(date.now.getDate() - date.now.getDay() + index);
    return day;
  });
  return (
    <main className="page desk-page">
      <section className="desk-greeting">
        <div>
          <Tag tone="pink">{date.weekday} · {date.month}</Tag>
          <h1>{date.greeting}，{session?.name || "学习者"}</h1>
          <p>今天想把哪个陌生概念，变成你能讲清楚的知识？</p>
        </div>
        <button className="button button-primary button-large" type="button" onClick={onStart}>
          <Books size={18} weight="bold" />
          去领域书架
        </button>
      </section>

      <section className="desk-date-card">
        <div className="desk-week">
          {week.map((day) => {
            const active = day.toDateString() === date.now.toDateString();
            return (
              <div className={active ? "active" : ""} key={day.toISOString()}>
                <small>{day.toLocaleDateString("zh-CN", { weekday: "short" })}</small>
                <strong>{day.getDate()}</strong>
              </div>
            );
          })}
        </div>
        <div className="weekday-guide">
          <span><Sparkle size={19} weight="fill" /></span>
          <div><small>今日学习提示</small><strong>{date.guidance}</strong></div>
        </div>
      </section>

      <section className="daily-briefing">
        <div className="briefing-rail">
          <div>
            <span className="eyebrow">今日知识播报</span>
            <h2>给好奇心一点新鲜素材</h2>
          </div>
          <nav aria-label="今日播报分类">
            {Object.keys(briefing).map((item) => (
              <button className={briefTab === item ? "active" : ""} type="button" key={item} onClick={() => setBriefTab(item)}>
                {item === "趣事" ? "小趣事" : item === "动态" ? "AI 动态" : "学习灵感"}
              </button>
            ))}
          </nav>
        </div>
        <article className="briefing-story">
          <span><Sparkle size={21} weight="fill" /></span>
          <div>
            <small>{activeBrief.eyebrow} · 今日推荐</small>
            <h3>{activeBrief.title}</h3>
            <p>{activeBrief.copy}</p>
          </div>
          <button type="button" onClick={() => briefTab === "动态" ? onStart("ai-agents") : onOpenWorkspace()}>
            {activeBrief.action} <ArrowRight size={15} />
          </button>
        </article>
        <small className="briefing-note">演示版为精选内容；正式版可按学习领域接入实时知识资讯。</small>
      </section>

      <section className="desk-grid">
        <article className="continue-card">
          <div className="card-title-row">
            <div>
              <span className="eyebrow">继续学习</span>
              <h2>双系统思维</h2>
              <p>心理学 · 已完成 3 / 8 个概念</p>
            </div>
            <MasteryRing value={36} size="medium" />
          </div>
          <div className="mini-journey">
            {["资料", "地图", "讲解", "检查", "深度"].map((item, index) => (
              <div className={index < 2 ? "complete" : index === 2 ? "current" : ""} key={item}>
                <span>{index < 2 ? <Check size={12} weight="bold" /> : index + 1}</span>
                <small>{item}</small>
              </div>
            ))}
          </div>
          <div className="continue-footer">
            <div>
              <Lightbulb size={20} weight="fill" />
              <span>
                下一步
                <strong>系统 1：快速判断是如何发生的？</strong>
              </span>
            </div>
            <button className="button button-primary" type="button" onClick={onOpenWorkspace}>
              继续学习 <ArrowRight size={16} />
            </button>
          </div>
        </article>

        <aside className="today-card">
          <span className="eyebrow">今天的节奏</span>
          <strong className="big-number">18</strong>
          <span className="big-number-unit">分钟专注学习</span>
          <div className="today-stat">
            <Target size={20} />
            <div>
              <strong>1 个概念已讲清</strong>
              <span>比昨天多 1 个</span>
            </div>
          </div>
          <div className="today-stat">
            <SealCheck size={20} />
            <div>
              <strong>连续学习 12 天</strong>
              <span>正在形成你的节奏</span>
            </div>
          </div>
        </aside>
      </section>

      <ReviewQueue compact onReview={onOpenWorkspace} onViewAll={() => onNavigate("center")} />

      <StudySprint
        compact
        onStart={onOpenWorkspace}
        onOpen={() => onNavigate("center")}
        onToast={onToast}
      />

      <section className="section-heading">
        <div>
          <span className="eyebrow">精选知识包</span>
          <h2>从一个感兴趣的问题开始</h2>
        </div>
        <button className="text-button with-icon" type="button" onClick={() => onNavigate("library")}>
          打开领域书架 <ArrowRight size={15} />
        </button>
      </section>
      <section className="pack-grid">
        {knowledgePacks.slice(0, 3).map((pack, index) => (
          <article className={`pack-card pack-${pack.accent}`} key={pack.id}>
            <div className="pack-icon">
              {index === 0 ? <Brain size={24} /> : index === 1 ? <ChartBar size={24} /> : <Compass size={24} />}
            </div>
            <Tag tone={pack.accent}>{pack.title}</Tag>
            <h3>{pack.subtitle}</h3>
            <p>{pack.meta}</p>
            <button type="button" onClick={() => onStart(pack.id)}>
              打开知识包 <ArrowRight size={16} />
            </button>
          </article>
        ))}
      </section>

      <section className="desk-bottom-grid">
        <article className="calibration-preview">
          <div className="card-title-row compact">
            <div>
              <span className="eyebrow">认知校准档案</span>
              <h2>把模糊处留在案头</h2>
            </div>
            <button className="icon-button" type="button" aria-label="查看认知校准档案" onClick={() => onNavigate("center")}>
              <ArrowRight size={18} />
            </button>
          </div>
          {calibrationItems.slice(0, 2).map((item) => (
            <div className="calibration-row" key={item.title}>
              <span className={item.type === "已校准" ? "good" : ""}>
                {item.type === "已校准" ? <Check size={15} /> : <Question size={15} />}
              </span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
              <Tag tone={item.type === "已校准" ? "green" : "peach"}>{item.type}</Tag>
            </div>
          ))}
        </article>
        <article className="learning-profile-preview">
          <span className="eyebrow">你的学习画像</span>
          <h2>你擅长从例子开始理解</h2>
          <p>最近的学习记录显示：先看到真实场景，再抽象概念时，你更容易完成复述与迁移。</p>
          <div className="profile-bars">
            <label>
              <span>例子联想</span>
              <i><b style={{ width: "86%" }} /></i>
            </label>
            <label>
              <span>概念复述</span>
              <i><b style={{ width: "72%" }} /></i>
            </label>
            <label>
              <span>连续推理</span>
              <i><b style={{ width: "58%" }} /></i>
            </label>
          </div>
          <button className="text-button with-icon" type="button" onClick={() => onNavigate("center")}>
            查看完整画像 <CaretRight size={15} />
          </button>
        </article>
      </section>
    </main>
  );
}

function Library({ onSelectPack, onUpload }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部");
  const inputRef = useRef(null);
  const categories = ["全部", ...new Set(knowledgePacks.map((pack) => pack.category))];
  const visiblePacks = knowledgePacks.filter((pack) => {
    const categoryMatch = category === "全部" || pack.category === category;
    const text = `${pack.title}${pack.subtitle}${pack.category}`.toLowerCase();
    return categoryMatch && text.includes(query.trim().toLowerCase());
  });
  const discoveryPrompts = [
    { pack: knowledgePacks.find((item) => item.id === "ai-agents"), question: "AI 智能体为什么不只是聊天机器人？", tone: "lavender" },
    { pack: knowledgePacks.find((item) => item.id === "behavioral-economics"), question: "为什么“免费”会让人改变原本的判断？", tone: "peach" },
    { pack: knowledgePacks.find((item) => item.id === "systems-thinking"), question: "为什么解决一个问题，有时会制造另一个问题？", tone: "pink" },
  ].filter((item) => item.pack);

  return (
    <main className="page library-page">
      <section className="library-hero">
        <div>
          <Tag tone="pink"><Books size={15} /> 领域书架</Tag>
          <h1>今天，想进入哪个新领域？</h1>
          <p>先选一个知识包，或者把自己的教材、论文、讲义放上书桌。系统会在开始前带你完成 AI 配置。</p>
        </div>
        <button className="button button-primary button-large" type="button" onClick={() => inputRef.current?.click()}>
          <UploadSimple size={18} weight="bold" /> 上传我的资料
        </button>
        <input
          className="visually-hidden"
          ref={inputRef}
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
      </section>

      <section className="library-toolbar">
        <div className="library-search-row">
          <label className="library-search">
            <MagnifyingGlass size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索领域或概念" />
          </label>
          <span>{knowledgePacks.length} 个主题 · {categories.length - 1} 类领域 · 支持自有资料</span>
        </div>
        <div className="filter-row">
          <span><SlidersHorizontal size={18} /> 按领域筛选</span>
          <div className="category-filter">
            {categories.map((item) => (
              <button className={category === item ? "active" : ""} type="button" key={item} onClick={() => setCategory(item)}>{item}</button>
            ))}
          </div>
        </div>
      </section>

      {category === "全部" && !query && (
        <section className="discovery-shelf">
          <div className="shelf-heading">
            <div><span className="eyebrow">今天适合探索</span><h2>也可以从一个问题开始</h2></div>
            <span>3 个好奇心入口</span>
          </div>
          <div className="discovery-grid">
            {discoveryPrompts.map(({ pack, question, tone }, index) => (
              <article className={`discovery-card ${tone}`} key={pack.id}>
                <span>0{index + 1}</span>
                <div><small>{pack.category} · {pack.level}</small><h3>{question}</h3><p>{pack.meta}</p></div>
                <button type="button" aria-label={`开始学习${pack.title}`} onClick={() => onSelectPack(pack)}><ArrowRight size={17} /></button>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="shelf-section">
        <div className="shelf-heading">
          <div><span className="eyebrow">预置知识包</span><h2>{category === "全部" ? "为好奇心准备的一整面书架" : category}</h2></div>
          <span>{visiblePacks.length} 本可学习</span>
        </div>
        <div className="book-shelf">
          {visiblePacks.map((pack, index) => {
            const Icon = [Brain, ChartBar, Compass, Sparkle, TrendUp, Question][index % 6];
            return (
              <article className={`book-card book-${pack.accent}`} key={pack.id}>
                <div className="book-cover">
                  <span className="book-category">{pack.category}</span>
                  <Icon size={30} weight="duotone" />
                  <div><small>{pack.level}</small><h3>{pack.title}</h3></div>
                  <i />
                </div>
                <div className="book-info">
                  <p>{pack.subtitle}</p>
                  <div className="book-highlights">
                    <span>学习路径</span><span>生活例子</span><span>互动复述</span>
                  </div>
                  <span>{pack.meta}</span>
                  <button type="button" onClick={() => onSelectPack(pack)}>开始学习 <ArrowRight size={15} /></button>
                </div>
              </article>
            );
          })}
        </div>
        {visiblePacks.length === 0 && <div className="library-empty"><Books size={30} /><strong>这层书架暂时没有结果</strong><span>换一个关键词，或上传自己的资料开始。</span></div>}
      </section>

      <section className="upload-shelf" onClick={() => inputRef.current?.click()}>
        <span><Plus size={25} /></span>
        <div><strong>没有找到想学的？自己放一本上来</strong><p>支持教材、论文、PDF、文档、笔记等资料。演示版先展示上传入口与完整学习流程。</p></div>
        <button className="button button-soft" type="button">选择文件</button>
      </section>
    </main>
  );
}

function AppSidebar({ page, onNavigate }) {
  const items = [
    { id: "desk", label: "今日桌面", copy: "问候与继续学习", icon: House },
    { id: "library", label: "领域书架", copy: "选知识包或上传", icon: Books },
    { id: "workspace", label: "学习空间", copy: "地图与互动学习", icon: MapTrifold },
    { id: "center", label: "学习中心", copy: "记录、薄弱点与画像", icon: ChartBar },
  ];
  return (
    <aside className="app-sidebar">
      <span className="sidebar-eyebrow">你的学习路径</span>
      <nav aria-label="应用主导航">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <button className={page === item.id ? "active" : ""} type="button" key={item.id} onClick={() => onNavigate(item.id)}>
              <span className="sidebar-index">{index + 1}</span>
              <Icon size={19} weight={page === item.id ? "fill" : "regular"} />
              <span><strong>{item.label}</strong><small>{item.copy}</small></span>
              <CaretRight size={15} />
            </button>
          );
        })}
      </nav>
      <div className="sidebar-help">
        <Sparkle size={18} weight="fill" />
        <div><strong>第一次使用？</strong><span>按 1 → 4 的顺序走，就不会迷路。</span></div>
      </div>
    </aside>
  );
}

function StageNav({ activeStage, onChange }) {
  const activeIndex = STAGES.findIndex((item) => item.id === activeStage);
  return (
    <nav className="stage-nav" aria-label="学习阶段">
      {STAGES.map((stage, index) => {
        const Icon = stage.icon;
        const completed = index < activeIndex;
        return (
          <button
            key={stage.id}
            type="button"
            className={`${stage.id === activeStage ? "active" : ""} ${completed ? "completed" : ""}`}
            onClick={() => onChange(stage.id)}
          >
            <span>
              {completed ? <Check size={15} weight="bold" /> : <Icon size={18} weight={stage.id === activeStage ? "fill" : "regular"} />}
            </span>
            <div><strong>{stage.label}</strong><small>{stage.copy}</small></div>
            {index < STAGES.length - 1 && <i />}
          </button>
        );
      })}
    </nav>
  );
}

function SourceDrawer({ uploadedFile, onUpload, experience, compact = false }) {
  const inputRef = useRef(null);
  return (
    <aside className={`source-drawer ${compact ? "compact" : ""}`}>
      <div className="drawer-heading">
        <span className="eyebrow">我的资料</span>
        <button className="icon-button" type="button" aria-label="添加资料" onClick={() => inputRef.current?.click()}>
          <Plus size={17} />
        </button>
      </div>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="*/*"
        onChange={(event) => event.target.files?.[0] && onUpload(event.target.files[0])}
      />
      <div className="source-file active">
        {uploadedFile ? <FileText size={20} weight="fill" /> : <FilePdf size={20} weight="fill" />}
        <div>
          <strong>{uploadedFile?.name || experience.sourceLabel}</strong>
          <span>{uploadedFile ? "本地资料 · 已就绪" : "当前知识包 · 已就绪"}</span>
        </div>
        <CheckCircle size={18} weight="fill" />
      </div>
      {!compact && (
        <>
          <span className="eyebrow drawer-subtitle">精选知识包</span>
          {knowledgePacks.map((pack) => (
            <button className="drawer-pack" type="button" key={pack.id}>
              <BookOpen size={18} />
              <span>
                <strong>{pack.title}</strong>
                <small>{pack.meta.split(" · ")[0]}</small>
              </span>
              <CaretRight size={15} />
            </button>
          ))}
          <button className="upload-dashed" type="button" onClick={() => inputRef.current?.click()}>
            <UploadSimple size={18} />
            导入新资料
          </button>
        </>
      )}
      {compact && (
        <div className="compact-excerpts">
          <span className="eyebrow">相关摘录</span>
          {experience.sourceExcerpts.map((excerpt, index) => (
            <article key={excerpt}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <p>{excerpt}</p>
            </article>
          ))}
        </div>
      )}
    </aside>
  );
}

function ProgressAside({ mastery, stage, onNavigate, onViewPath, experience }) {
  return (
    <aside className="progress-aside">
      <section className="mastery-card">
        <div className="card-title-row compact">
          <strong>当前掌握度</strong>
          <Question size={16} />
        </div>
        <MasteryRing value={mastery} size="medium" />
        <p>{mastery < 50 ? "仍需巩固 · 慢慢来" : "理解正在变得稳定"}</p>
        {stage === "deep" && (
          <div className="mastery-breakdown">
            <label>
              <span>概念边界</span>
              <i><b style={{ width: "80%" }} /></i>
              <strong>80%</strong>
            </label>
            <label>
              <span>例子迁移</span>
              <i><b style={{ width: "68%" }} /></i>
              <strong>68%</strong>
            </label>
            <label>
              <span>连续推理</span>
              <i><b style={{ width: "55%" }} /></i>
              <strong>55%</strong>
            </label>
          </div>
        )}
      </section>
      <section className="map-progress-card">
        <div className="card-title-row compact">
          <span>
            <MapTrifold size={18} />
            本次学习路径
          </span>
          <button type="button" onClick={onViewPath}>查看</button>
        </div>
        <strong>{stage === "deep" ? "6" : stage === "lesson" || stage === "check" ? "2" : "1"} / 6</strong>
        <span>个学习步骤</span>
        <div className="linear-progress">
          <i style={{ width: stage === "deep" ? "100%" : stage === "lesson" || stage === "check" ? "34%" : "17%" }} />
        </div>
      </section>
      <section className="calibration-aside">
        <div className="card-title-row compact">
          <strong>认知校准档案</strong>
          <FileText size={17} />
        </div>
        <div className="aside-observation">
          <span />
          <p>{experience.boundary}</p>
        </div>
        <button type="button" onClick={() => onNavigate("center")}>
          查看档案 <ArrowRight size={15} />
        </button>
      </section>
      <div className="aside-links">
        <button type="button" onClick={() => onNavigate("center")}>
          <ClockCounterClockwise size={18} />
          学习历史
          <CaretRight size={15} />
        </button>
        <button type="button" onClick={() => onNavigate("center")}>
          <User size={18} />
          学习画像
          <CaretRight size={15} />
        </button>
      </div>
    </aside>
  );
}

function MaterialsStage({ uploadedFile, onUpload, onGenerate, analyzing, selectedPack, onSelectPack }) {
  const inputRef = useRef(null);
  const activePack = selectedPack?.id === "upload" ? null : selectedPack;

  return (
    <section className="materials-stage">
      <div className="workspace-heading">
        <div>
          <Tag tone="pink">第一步 · 准备资料</Tag>
          <h1>{selectedPack ? `为“${selectedPack.title}”准备学习路径` : "今天想学什么？"}</h1>
          <p>确认当前主题，或换成自己的资料。AI 会把内容整理成一条可以照着走、也能检验掌握程度的学习路径。</p>
        </div>
      </div>
      {activePack && (
        <div className="selected-pack-summary" aria-label="当前选择的知识包">
          <span className={`pack-icon pack-${activePack.accent}`}><BookOpen size={22} /></span>
          <div>
            <small>已从领域书架选择</small>
            <strong>{activePack.title}</strong>
            <p>{activePack.subtitle}</p>
          </div>
          <Tag tone={activePack.accent}>{activePack.level} · {activePack.category}</Tag>
        </div>
      )}
      <div className="materials-grid">
        <button className="big-upload" type="button" onClick={() => inputRef.current?.click()}>
          <input
            ref={inputRef}
            className="visually-hidden"
            type="file"
            accept="*/*"
            onChange={(event) => event.target.files?.[0] && onUpload(event.target.files[0])}
          />
          <span className="big-upload-icon">
            {uploadedFile ? <CheckCircle size={30} weight="fill" /> : <UploadSimple size={30} />}
          </span>
          <strong>{uploadedFile ? uploadedFile.name : "把资料放到这里"}</strong>
          <p>
            {uploadedFile
              ? "文件已在本地读取，可以开始生成学习路径"
              : "支持教材、论文、笔记、网页导出等常见格式"}
          </p>
          <span className="button button-soft">{uploadedFile ? "更换文件" : "选择文件"}</span>
        </button>
        <div className="or-divider"><span>或者从精选知识包开始</span></div>
        <div className="material-pack-list">
          {knowledgePacks.map((pack, index) => (
            <button
              className={activePack?.id === pack.id ? "selected" : ""}
              type="button"
              onClick={() => onSelectPack(pack)}
              key={pack.id}
            >
              <span className={`pack-icon pack-${pack.accent}`}>
                {index === 0 ? <Brain size={23} /> : index === 1 ? <ChartBar size={23} /> : <Compass size={23} />}
              </span>
              <div>
                <Tag tone={pack.accent}>{pack.title}</Tag>
                <strong>{pack.subtitle}</strong>
                <small>{pack.meta}</small>
              </div>
              <span className="radio-mark">{activePack?.id === pack.id && <Check size={14} weight="bold" />}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="stage-footer">
        <div>
          <ShieldCheck size={18} weight="fill" />
          <span>演示版仅在当前浏览器中处理所选文件，不会上传。</span>
        </div>
        <button className="button button-primary button-large" type="button" onClick={onGenerate} disabled={analyzing}>
          {analyzing ? (
            <>
              <CircleNotch className="spin" size={19} /> 正在分析资料…
            </>
          ) : (
            <>
              生成学习路径 <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </section>
  );
}

function MapStage({ selectedNode, onSelectNode, onStartLesson, experience }) {
  const selectedStep = experience.path.find((item) => item.id === selectedNode) || experience.path[0];
  return (
    <section className="map-stage">
      <div className="map-stage-header">
        <div>
          <Tag tone="lavender">第二步 · 确认学习路径</Tag>
          <h1>{experience.conceptTitle}，会这样一步一步学</h1>
          <p>这不是一张知识脑图，而是本次学习的实际顺序。每一步都说明学什么、怎么学，以及做到什么才算完成。</p>
        </div>
        <span className="path-total"><ClockCounterClockwise size={17} /> {experience.totalDuration} · {experience.path.length} 个步骤</span>
      </div>
      <div className="learning-path-list">
        {experience.path.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={`path-step ${item.status} ${selectedNode === item.id ? "selected" : ""}`}
            onClick={() => onSelectNode(item.id)}
          >
            <span className="path-step-number">{item.status === "completed" ? <Check size={16} weight="bold" /> : index + 1}</span>
            <div className="path-step-main">
              <span>{item.status === "completed" ? "已完成" : item.status === "current" ? "从这里开始" : `第 ${index + 1} 步`}</span>
              <strong>{item.title}</strong>
              <p>{item.goal}</p>
            </div>
            <div className="path-step-method">
              <small>学习方式</small>
              <strong>{item.method}</strong>
            </div>
            <span className="path-step-duration">{item.duration}</span>
            <CaretRight size={17} />
          </button>
        ))}
      </div>
      <article className="path-confirmation">
        <span className="path-confirmation-icon"><Target size={22} weight="duotone" /></span>
        <div>
          <small>完成标准</small>
          <h2>{selectedStep.title}</h2>
          <p>{selectedStep.doneWhen}</p>
        </div>
        <button className="button button-primary" type="button" onClick={onStartLesson}>
          确认路径，从故事讲解开始 <ArrowRight size={17} />
        </button>
      </article>
    </section>
  );
}

function LessonStage({ onCheck, onBack }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [chapter, setChapter] = useState(0);
  const chapters = [
    { label: "故事铺陈", copy: "先进入情境" },
    { label: "临近结尾", copy: "让主题浮现" },
    { label: "完整解读", copy: "拆开隐喻与边界" },
  ];

  return (
    <section className="lesson-stage">
      <button className="back-link" type="button" onClick={onBack}>
        <ArrowLeft size={16} /> 返回学习地图
      </button>
      <article className={`lesson-paper narrative-paper chapter-${chapter}`}>
        <div className="lesson-title-row">
          <div>
            <Tag tone={chapter === 2 ? "lavender" : "pink"}>讲解阶段 · {chapter + 1} / 3</Tag>
            <h1>
              {chapter === 0 && "雾港城的两位调度员"}
              {chapter === 1 && "暴雨夜里，谁该接过控制台？"}
              {chapter === 2 && "揭晓：你刚刚遇见的是“双系统思维”"}
            </h1>
            <p className="narrative-subtitle">
              {chapter === 0 && "先不记定义，也不急着回答问题。跟着故事建立第一层直觉。"}
              {chapter === 1 && "故事已经接近结尾，真正的主题会在这次“交棒”中慢慢浮现。"}
              {chapter === 2 && "现在把故事翻译成专业概念，并检查每一个隐喻是否准确。"}
            </p>
          </div>
          <button
            className={`icon-button ${bookmarked ? "active" : ""}`}
            type="button"
            onClick={() => setBookmarked((value) => !value)}
            aria-label="收藏知识点"
          >
            <Star size={22} weight={bookmarked ? "fill" : "regular"} />
          </button>
        </div>

        <nav className="narrative-progress" aria-label="故事讲解进度">
          {chapters.map((item, index) => (
            <button
              key={item.label}
              type="button"
              className={index === chapter ? "active" : index < chapter ? "completed" : ""}
              onClick={() => index <= chapter && setChapter(index)}
              disabled={index > chapter}
            >
              <span>{index < chapter ? <Check size={14} weight="bold" /> : index + 1}</span>
              <div><strong>{item.label}</strong><small>{item.copy}</small></div>
            </button>
          ))}
        </nav>

        {chapter === 0 && (
          <section className="story-chapter story-opening">
            <div className="story-scene-label"><Sparkle size={17} weight="fill" /> 先听故事，概念名暂时保密</div>
            <p className="story-paragraph story-dropcap">
              雾港城的列车每天穿过上百条轨道。清晨第一班车启动前，控制室里总有两位调度员：
              林快坐在最前面，听一声汽笛、扫一眼信号灯，就能立刻判断列车该往哪走；陈深坐在后面的长桌旁，
              桌上摊着线路图、时刻表和一叠演算纸。
            </p>
            <div className="story-character-grid">
              <article>
                <span className="story-character fast"><Sparkle size={22} weight="fill" /></span>
                <div><small>前台调度员</small><strong>林快</strong><p>依靠多年经验迅速反应，熟悉的情况几乎从不需要停下来计算。</p></div>
              </article>
              <article>
                <span className="story-character slow"><PencilSimple size={22} weight="fill" /></span>
                <div><small>分析调度员</small><strong>陈深</strong><p>面对陌生、复杂或风险很高的情况，会逐项核对条件再给出方案。</p></div>
              </article>
            </div>
            <blockquote className="story-quote">
              平常的日子里，林快让整座城市保持流动；遇到新线路和重大改道时，陈深才会把椅子拉到控制台前。
            </blockquote>
            <div className="narrative-actions">
              <div><ClockCounterClockwise size={17} /><span>预计阅读 2 分钟 · 暂时不用作答</span></div>
              <button className="button button-primary" type="button" onClick={() => setChapter(1)}>
                继续：暴雨来了 <ArrowRight size={17} />
              </button>
            </div>
          </section>
        )}

        {chapter === 1 && (
          <section className="story-chapter story-climax">
            <div className="storm-banner">
              <span><Brain size={24} weight="duotone" /></span>
              <div><small>故事临近结尾</small><strong>熟悉的规则突然失效了</strong></div>
            </div>
            <p className="story-paragraph">
              节庆当晚，一场暴雨淹没了三处轨道。林快凭直觉连续切换信号，前几班列车顺利绕行；
              可当临时站台也开始拥堵时，旧经验把人群引向了同一个出口。陈深接过控制台，重新计算承载量、
              换乘时间和备用路线，城市终于恢复秩序。
            </p>
            <p className="story-paragraph">
              凌晨，主机短暂断电，陈深来不及重新演算。林快又凭借对轨道的熟悉维持住基本运行。
              市长这才明白：城市从来不需要在两位调度员中淘汰一个，而需要知道什么时候应该交棒。
            </p>
            <div className="concept-reveal">
              <small>故事真正指向的专业概念</small>
              <span className="reveal-line" />
              <h2>双系统思维 · Dual-Process Theory</h2>
              <p>人的判断并非只靠一种思考方式，而是在快速、自动的加工与缓慢、需要注意力的分析之间协同切换。</p>
            </div>
            <div className="narrative-actions">
              <button className="button button-ghost" type="button" onClick={() => setChapter(0)}>
                <ArrowLeft size={17} /> 回看故事开头
              </button>
              <button className="button button-primary" type="button" onClick={() => setChapter(2)}>
                完整解读概念与隐喻 <ArrowRight size={17} />
              </button>
            </div>
          </section>
        )}

        {chapter === 2 && (
          <section className="story-chapter story-decode">
            <section className="concept-definition">
              <span><BookOpen size={22} weight="fill" /></span>
              <div>
                <small>正式定义</small>
                <h2>同一个大脑，会调用不同特征的认知加工</h2>
                <p>
                  双系统理论用“系统 1”和“系统 2”描述两类加工特征：前者快速、自动、依赖联想与经验；
                  后者缓慢、需要注意力，擅长规则、比较和连续推理。它们是功能模型，不是大脑里两个真实分开的器官。
                </p>
              </div>
            </section>

            <div className="metaphor-heading">
              <div><Tag tone="pink">隐喻拆解</Tag><h2>故事里的每个角色，对应什么？</h2></div>
              <span>4 个对应关系</span>
            </div>
            <div className="metaphor-grid">
              <article><b>01</b><strong>雾港城</strong><p>你每天面对的真实世界：信息不完整、时间有限，任务熟悉度不断变化。</p><span>认知环境</span></article>
              <article><b>02</b><strong>林快</strong><p>自动、快速、基于模式识别的加工。它高效，但在陌生变化中可能沿用错误经验。</p><span>系统 1</span></article>
              <article><b>03</b><strong>陈深</strong><p>需要注意力的分析加工。它能核对规则与条件，但速度慢，也受精力和工作记忆限制。</p><span>系统 2</span></article>
              <article><b>04</b><strong>交接控制台</strong><p>元认知监控：意识到当前判断可能不够可靠，并主动从直觉切换到分析。</p><span>认知切换</span></article>
            </div>

            <div className="analogy-note always-visible">
              <span><Lightbulb size={21} weight="fill" /></span>
              <div>
                <strong>换回你的生活场景</strong>
                <p>
                  你在常去的咖啡店里点单，几乎不用想，这是系统 1；当店员递来一张复杂的会员方案表，
                  你开始比较长期成本，系统 2 就接过了控制台。
                </p>
              </div>
            </div>

            <div className="systems-compare">
              <section>
                <span className="system-number lavender">1</span>
                <div>
                  <Tag tone="lavender">快思考</Tag>
                  <h2>系统 1</h2>
                  <p>自动、快速、几乎不费力。依赖经验与联想，在熟悉情境里非常高效。</p>
                  <ul>
                    <li><Check size={15} /> 优势：迅速识别模式</li>
                    <li><Check size={15} /> 风险：把旧经验套到新问题</li>
                  </ul>
                </div>
              </section>
              <div className="brain-divider" aria-label="双系统协同">
                <Brain size={54} weight="duotone" />
                <strong>直觉 ↔ 分析</strong>
                <span>关键在于知道何时交棒</span>
              </div>
              <section>
                <span className="system-number peach">2</span>
                <div>
                  <Tag tone="peach">慢思考</Tag>
                  <h2>系统 2</h2>
                  <p>有意识、缓慢、需要精力。适合陌生、复杂、重要或需要规则推理的问题。</p>
                  <ul>
                    <li><Check size={15} /> 优势：检查条件与边界</li>
                    <li><Check size={15} /> 风险：注意力有限、容易疲劳</li>
                  </ul>
                </div>
              </section>
            </div>

            <div className="lesson-insight advanced-boundary">
              <Lightbulb size={23} weight="fill" />
              <div>
                <strong>研究生层级的边界提醒</strong>
                <p>
                  “系统 1 / 系统 2”不是非黑即白的二分法。很多任务包含连续谱上的多种加工；
                  专业训练还可能把原本费力的分析逐渐自动化为可靠直觉。模型的价值在于解释加工特征，而不是给每次思考贴死标签。
                </p>
              </div>
            </div>

            <div className="source-citation">
              <FilePdf size={18} weight="fill" />
              <div>
                <small>资料来源</small>
                <strong>《思考，快与慢》· 第 20—38 页</strong>
              </div>
              <CaretRight size={16} />
            </div>
            <div className="lesson-actions">
              <button className="button button-primary button-large" type="button" onClick={onCheck}>
                讲解完成，进入互动学习 <ArrowRight size={18} />
              </button>
              <span>下一步先做理解检查，再选择费曼学习法或苏格拉底学习法</span>
            </div>
          </section>
        )}
      </article>
      <div className="lesson-interaction-gate">
        {chapter < 2 ? <LockKey size={17} /> : <CheckCircle size={17} weight="fill" />}
        <span>{chapter < 2 ? "互动学习会在完整讲解后开启" : "讲解已完成，可以进入互动学习"}</span>
      </div>
    </section>
  );
}

function TopicLessonStage({ experience, onCheck, onBack }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [chapter, setChapter] = useState(0);
  const lesson = experience.lesson || {
    titles: [
      `先从一个真实问题走近“${experience.conceptTitle}”`,
      "当原来的解释遇到一个反例",
      `揭晓：这条路径真正要理解的是“${experience.conceptTitle}”`,
    ],
    subtitles: [
      "先不背定义，用一个具体情境建立第一层直觉。",
      "让故事里的冲突暴露概念真正要解决的问题。",
      "现在把故事翻译成正式概念，并检查证据与边界。",
    ],
    opening: `一支团队遇到了一个看似熟悉的问题。他们先凭经验给出答案，却发现同样的方法换到新情境后失效了。于是团队回到“${experience.conceptTitle}”所关注的核心问题：我们究竟在解释什么，又凭什么相信这个解释？`,
    actors: [
      ["快速答案", "经验派", "先用熟悉做法推进，优点是速度快，风险是把过去的条件当成今天仍然成立。"],
      ["结构检查", "研究派", "把主张、证据、前提和结果逐一连起来，再判断结论能否迁移。"],
    ],
    quote: "学习不是把答案记得更牢，而是知道答案为什么成立、在什么地方会失效。",
    climax: [
      "团队把原来的答案带到另一个案例里，结果出现了相反现象。他们没有立刻换一条口号，而是检查两种情境之间究竟少了哪个条件。",
      `当关键前提被说清后，“${experience.conceptTitle}”不再是一段需要背诵的文字，而变成了一套可以用于观察、解释和修正判断的工具。`,
    ],
    reveal: `对“${experience.conceptTitle}”的可靠理解，应同时包含核心主张、支持证据、适用条件与反例。`,
    definitionTitle: "把概念放回它要解决的问题里",
    definition: `本演示知识包先用故事建立直觉，再把“${experience.conceptTitle}”拆成可解释、可举例、可验证的结构。正式学习时，还会继续连接原始资料和领域证据。`,
    metaphors: [
      ["01", "真实问题", "概念不是孤立名词，它首先回应一个需要解释或解决的问题。", "问题"],
      ["02", "核心主张", "你暂时认为成立的解释，需要用自己的话准确说出来。", "主张"],
      ["03", "支持证据", "案例、数据或推理让主张不只是听起来合理。", "证据"],
      ["04", "失效情境", "反例和边界帮助你知道什么时候不该套用结论。", "边界"],
    ],
    analogy: "像学习一张地图：记住地名不等于会走路；你还需要知道地标之间的关系、什么时候该转弯，以及地图没有覆盖哪些路段。",
    compare: [
      ["表面熟悉", "记住", "能认出原句和术语，但换一种问法后容易失去线索。", "优势：进入快", "风险：难以迁移"],
      ["结构掌握", "理解", "能解释、举例、找反例，并在新情境中修正自己的判断。", "优势：可以迁移", "风险：需要主动练习"],
    ],
  };
  const chapters = [
    { label: "故事铺陈", copy: "先进入情境" },
    { label: "临近结尾", copy: "让主题浮现" },
    { label: "完整解读", copy: "拆开概念与边界" },
  ];

  return (
    <section className="lesson-stage">
      <button className="back-link" type="button" onClick={onBack}>
        <ArrowLeft size={16} /> 返回学习地图
      </button>
      <article className={`lesson-paper narrative-paper chapter-${chapter}`}>
        <div className="lesson-title-row">
          <div>
            <Tag tone={chapter === 2 ? "lavender" : "pink"}>讲解阶段 · {chapter + 1} / 3</Tag>
            <h1>{lesson.titles[chapter]}</h1>
            <p className="narrative-subtitle">{lesson.subtitles[chapter]}</p>
          </div>
          <button
            className={`icon-button ${bookmarked ? "active" : ""}`}
            type="button"
            onClick={() => setBookmarked((value) => !value)}
            aria-label="收藏知识点"
          >
            <Star size={22} weight={bookmarked ? "fill" : "regular"} />
          </button>
        </div>

        <nav className="narrative-progress" aria-label="故事讲解进度">
          {chapters.map((item, index) => (
            <button
              key={item.label}
              type="button"
              className={index === chapter ? "active" : index < chapter ? "completed" : ""}
              onClick={() => index <= chapter && setChapter(index)}
              disabled={index > chapter}
            >
              <span>{index < chapter ? <Check size={14} weight="bold" /> : index + 1}</span>
              <div><strong>{item.label}</strong><small>{item.copy}</small></div>
            </button>
          ))}
        </nav>

        {chapter === 0 && (
          <section className="story-chapter story-opening">
            <div className="story-scene-label"><Sparkle size={17} weight="fill" /> 先听故事，概念名暂时保密</div>
            <p className="story-paragraph story-dropcap">{lesson.opening}</p>
            <div className="story-character-grid">
              {lesson.actors.map(([eyebrow, name, copy], index) => (
                <article key={name}>
                  <span className={`story-character ${index === 0 ? "fast" : "slow"}`}>
                    {index === 0 ? <Sparkle size={22} weight="fill" /> : <PencilSimple size={22} weight="fill" />}
                  </span>
                  <div><small>{eyebrow}</small><strong>{name}</strong><p>{copy}</p></div>
                </article>
              ))}
            </div>
            <blockquote className="story-quote">{lesson.quote}</blockquote>
            <div className="narrative-actions">
              <div><ClockCounterClockwise size={17} /><span>预计阅读 2 分钟 · 暂时不用作答</span></div>
              <button className="button button-primary" type="button" onClick={() => setChapter(1)}>
                继续看变化 <ArrowRight size={17} />
              </button>
            </div>
          </section>
        )}

        {chapter === 1 && (
          <section className="story-chapter story-climax">
            <div className="storm-banner">
              <span><Brain size={24} weight="duotone" /></span>
              <div><small>故事临近结尾</small><strong>真正的差别开始出现</strong></div>
            </div>
            {lesson.climax.map((paragraph) => <p className="story-paragraph" key={paragraph}>{paragraph}</p>)}
            <div className="concept-reveal">
              <small>故事真正指向的专业概念</small>
              <span className="reveal-line" />
              <h2>{experience.conceptTitle} · {experience.conceptEnglish}</h2>
              <p>{lesson.reveal}</p>
            </div>
            <div className="narrative-actions">
              <button className="button button-ghost" type="button" onClick={() => setChapter(0)}>
                <ArrowLeft size={17} /> 回看故事开头
              </button>
              <button className="button button-primary" type="button" onClick={() => setChapter(2)}>
                完整解读概念与边界 <ArrowRight size={17} />
              </button>
            </div>
          </section>
        )}

        {chapter === 2 && (
          <section className="story-chapter story-decode">
            <section className="concept-definition">
              <span><BookOpen size={22} weight="fill" /></span>
              <div><small>正式定义</small><h2>{lesson.definitionTitle}</h2><p>{lesson.definition}</p></div>
            </section>
            <div className="metaphor-heading">
              <div><Tag tone="pink">隐喻拆解</Tag><h2>故事里的每个角色，对应什么？</h2></div>
              <span>{lesson.metaphors.length} 个对应关系</span>
            </div>
            <div className="metaphor-grid">
              {lesson.metaphors.map(([number, title, copy, label]) => (
                <article key={number}><b>{number}</b><strong>{title}</strong><p>{copy}</p><span>{label}</span></article>
              ))}
            </div>
            <div className="analogy-note always-visible">
              <span><Lightbulb size={21} weight="fill" /></span>
              <div><strong>换回你的生活场景</strong><p>{lesson.analogy}</p></div>
            </div>
            <div className="systems-compare">
              {lesson.compare.map(([tag, title, copy, advantage, risk], index) => (
                <Fragment key={title}>
                  {index === 1 && (
                    <div className="brain-divider" aria-label={`${lesson.compare[0][1]}与${title}对照`}>
                      <Brain size={54} weight="duotone" />
                      <strong>{lesson.compare[0][1]} ↔ {title}</strong>
                      <span>关键在于按任务选择合适边界</span>
                    </div>
                  )}
                  <section>
                    <span className={`system-number ${index === 0 ? "lavender" : "peach"}`}>{index + 1}</span>
                    <div>
                      <Tag tone={index === 0 ? "lavender" : "peach"}>{tag}</Tag>
                      <h2>{title}</h2>
                      <p>{copy}</p>
                      <ul><li><Check size={15} /> {advantage}</li><li><Check size={15} /> {risk}</li></ul>
                    </div>
                  </section>
                </Fragment>
              ))}
            </div>
            <div className="lesson-insight advanced-boundary">
              <Lightbulb size={23} weight="fill" />
              <div><strong>边界提醒</strong><p>{experience.boundary}</p></div>
            </div>
            <div className="source-citation">
              <FileText size={18} weight="fill" />
              <div><small>资料来源</small><strong>{experience.sourceLabel}</strong></div>
              <CaretRight size={16} />
            </div>
            <div className="lesson-actions">
              <button className="button button-primary button-large" type="button" onClick={onCheck}>
                讲解完成，进入互动学习 <ArrowRight size={18} />
              </button>
              <span>下一步先做理解检查，再选择费曼学习法或苏格拉底学习法</span>
            </div>
          </section>
        )}
      </article>
      <div className="lesson-interaction-gate">
        {chapter < 2 ? <LockKey size={17} /> : <CheckCircle size={17} weight="fill" />}
        <span>{chapter < 2 ? "互动学习会在完整讲解后开启" : "讲解已完成，可以进入互动学习"}</span>
      </div>
    </section>
  );
}

function CheckStage({ selectedAnswer, onSelect, onDeep, onBack, experience }) {
  const { options, correctIndex } = experience.check;
  return (
    <section className="check-stage">
      <button className="back-link" type="button" onClick={onBack}>
        <ArrowLeft size={16} /> 返回讲解
      </button>
      <article className="check-card">
        <div className="check-progress">
          <span>理解检查</span>
          <strong>1 / 2</strong>
          <i><b style={{ width: "50%" }} /></i>
        </div>
        <Tag tone="peach">先凭自己的理解回答</Tag>
        <h1>{experience.check.question}</h1>
        <div className="answer-list">
          {options.map((option, index) => {
            const chosen = selectedAnswer === index;
            const correct = index === correctIndex;
            return (
              <button
                type="button"
                key={option}
                className={`${chosen ? "selected" : ""} ${chosen && correct ? "correct" : ""} ${chosen && !correct ? "wrong" : ""}`}
                onClick={() => onSelect(index)}
              >
                <span>{String.fromCharCode(65 + index)}</span>
                <strong>{option}</strong>
                {chosen && (correct ? <CheckCircle size={22} weight="fill" /> : <X size={22} weight="bold" />)}
              </button>
            );
          })}
        </div>
        {selectedAnswer !== null && (
          <div className={`answer-feedback ${selectedAnswer === correctIndex ? "success" : "retry"}`}>
            {selectedAnswer === correctIndex ? <CheckCircle size={23} weight="fill" /> : <Lightbulb size={23} weight="fill" />}
            <div>
              <strong>{selectedAnswer === correctIndex ? "理解准确" : "再看一眼关键区别"}</strong>
              <p>{selectedAnswer === correctIndex ? experience.check.success : experience.check.retry}</p>
            </div>
          </div>
        )}
        <div className="check-actions">
          <button className="button button-ghost" type="button" onClick={onBack}>
            回看讲解
          </button>
          <button className="button button-primary" type="button" onClick={onDeep} disabled={selectedAnswer !== correctIndex}>
            进入深度学习 <ArrowRight size={17} />
          </button>
        </div>
      </article>
    </section>
  );
}

function DeepStage({ mode, onMode, mastery, onMastery, onToast, onBackMap, experience }) {
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [thinking, setThinking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [listening, setListening] = useState(false);

  const submit = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setSubmitted(trimmed);
    setInput("");
    setFeedback(null);
    setThinking(true);
    try {
      const result = await api.teachback({
        mode,
        topic: experience.conceptTitle,
        input: trimmed,
      });
      setFeedback({
        recap: result.feedback,
        probe: mode === "feynman"
          ? "现在请补一个反例：在什么情境下，你刚才的解释会失效？"
          : "先只回答这一问，再决定是否需要修改原来的判断。",
      });
      setThinking(false);
      onMastery(Math.max(mastery, 68));
    } catch (requestError) {
      setThinking(false);
      setFeedback(experience.feedback[mode]);
      if (requestError.code !== "AI_NOT_CONFIGURED") onToast(`真实 AI 暂不可用，已切换为演示反馈：${requestError.message}`);
      onMastery(Math.max(mastery, 68));
    }
  };

  const switchMode = (nextMode) => {
    onMode(nextMode);
    setFeedback(null);
    setSubmitted("");
  };

  const toggleMic = () => {
    setListening((value) => !value);
    onToast(listening ? "已停止语音输入演示" : "麦克风为交互占位，正式版将接入语音转写");
  };

  return (
    <section className="deep-stage">
      <div className="deep-main">
        <div className="deep-heading">
          <div>
            <Tag tone="lavender">深度学习 · 费曼 / 苏格拉底</Tag>
            <h1>{mode === "feynman" ? "费曼学习法：你讲，我来找遗漏" : "苏格拉底学习法：我问，你来推理"}</h1>
            <p>随时切换两种方式；系统会保留同一个知识点与学习进度。</p>
          </div>
          <button className="map-return" type="button" onClick={onBackMap}>
            <MapTrifold size={17} /> 回看学习路径
          </button>
        </div>
        <div className="mode-switch" role="tablist" aria-label="学习模式">
          <button
            type="button"
            className={mode === "feynman" ? "active" : ""}
            onClick={() => switchMode("feynman")}
          >
            <span><GraduationCap size={22} weight="fill" /></span>
            <div>
              <strong>费曼学习法</strong>
              <small>你讲，我复述并找出遗漏</small>
            </div>
            <i>{mode === "feynman" && <Check size={13} weight="bold" />}</i>
          </button>
          <button
            type="button"
            className={mode === "socratic" ? "active" : ""}
            onClick={() => switchMode("socratic")}
          >
            <span><Question size={22} weight="bold" /></span>
            <div>
              <strong>苏格拉底学习法</strong>
              <small>我连续追问，陪你检查假设</small>
            </div>
            <i>{mode === "socratic" && <Check size={13} weight="bold" />}</i>
          </button>
        </div>
        <div className="conversation">
          <article className="ai-message">
            <span className="ai-avatar"><Sparkle size={18} weight="fill" /></span>
            <div>
              <small>AI 学习伙伴 · 当前为{mode === "feynman" ? "费曼学习法" : "苏格拉底学习法"}</small>
              <p>
                {mode === "feynman"
                  ? experience.prompts.feynman
                  : experience.prompts.socratic}
              </p>
            </div>
          </article>
          {submitted && (
            <article className="user-message">
              <div>
                <small>你的讲解</small>
                <p>{submitted}</p>
              </div>
              <span className="avatar">LX</span>
            </article>
          )}
          {thinking && (
            <article className="ai-message thinking-message">
              <span className="ai-avatar"><Sparkle size={18} weight="fill" /></span>
              <div>
                <small>正在整理你的表达</small>
                <p><i /><i /><i /></p>
              </div>
            </article>
          )}
          {feedback && (
            <article className="teacher-feedback">
              <div>
                <span className="feedback-icon recap"><PencilSimple size={19} weight="fill" /></span>
                <div>
                  <strong>我先复述一下你的意思</strong>
                  <p>{feedback.recap}</p>
                </div>
              </div>
              <div>
                <span className="feedback-icon probe"><Question size={19} weight="bold" /></span>
                <div>
                  <strong>我想再追问一处</strong>
                  <p>{feedback.probe}</p>
                </div>
              </div>
              <div className="feedback-meta">
                <Tag tone="green">掌握度 +16%</Tag>
                <span>已写入认知校准档案</span>
              </div>
            </article>
          )}
        </div>
        <div className={`deep-composer ${listening ? "listening" : ""}`}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              mode === "feynman"
                ? "像教一个完全不了解的人那样讲讲看…"
                : "写下你的判断，AI 会继续追问…"
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
          />
          <div>
            <button
              className={`mic-button ${listening ? "active" : ""}`}
              type="button"
              onClick={toggleMic}
              aria-label="语音输入"
            >
              <Microphone size={20} weight={listening ? "fill" : "regular"} />
              <span>{listening ? "正在聆听" : "语音"}</span>
            </button>
            <span>Enter 发送 · Shift + Enter 换行</span>
            <button className="button button-primary" type="button" onClick={submit} disabled={!input.trim()}>
              发送 <PaperPlaneTilt size={17} weight="fill" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function EvidenceNotebook({ experience, note, onChange, onClose, onToast }) {
  const fields = [note.example, note.boundary, note.question];
  const completed = fields.filter((value) => value.trim()).length;
  const update = (field, value) => onChange({ ...note, [field]: value });
  const exportMarkdown = () => {
    const markdown = [
      `# ${experience.conceptTitle} · 证据笔记`,
      "",
      `> 来源：${experience.sourceLabel}`,
      "",
      "## 资料证据",
      experience.sourceExcerpts.map((excerpt) => `- ${excerpt}`).join("\n"),
      "",
      "## 我的例子",
      note.example || "（待补充）",
      "",
      "## 边界与反例",
      note.boundary || "（待补充）",
      "",
      "## 仍想追问",
      note.question || "（待补充）",
    ].join("\n");
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${experience.conceptTitle}-证据笔记.md`;
    link.click();
    URL.revokeObjectURL(url);
    onToast("证据笔记已导出为 Markdown");
  };

  return (
    <div className="notebook-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="evidence-notebook" role="dialog" aria-modal="true" aria-labelledby="notebook-title">
        <header>
          <div>
            <Tag tone="pink"><PencilSimple size={14} /> 证据笔记本</Tag>
            <h2 id="notebook-title">把“看懂了”留下可验证的痕迹</h2>
            <p>{experience.conceptTitle} · 已完成 {completed} / 3 个主动学习证据</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭证据笔记本"><X size={18} /></button>
        </header>

        <div className="notebook-source">
          <span><FileText size={19} /></span>
          <div>
            <small>资料证据 · {experience.sourceLabel}</small>
            <strong>{experience.sourceExcerpts[0]}</strong>
            <p>这段摘录来自当前学习资料，用来约束例子与结论，不让笔记脱离来源。</p>
          </div>
        </div>

        <div className="notebook-fields">
          <label>
            <span><b>01</b><strong>我的例子</strong><small>把抽象概念落到自己经历过的场景</small></span>
            <textarea value={note.example} onChange={(event) => update("example", event.target.value)} placeholder="例如：我看到熟悉的界面就直接点击，是系统 1 在快速调用经验……" />
          </label>
          <label>
            <span><b>02</b><strong>边界与反例</strong><small>写下它什么时候不成立，避免过度概括</small></span>
            <textarea value={note.boundary} onChange={(event) => update("boundary", event.target.value)} placeholder={experience.boundary} />
          </label>
          <label>
            <span><b>03</b><strong>仍想追问</strong><small>把模糊处留给下一次复习或苏格拉底追问</small></span>
            <textarea value={note.question} onChange={(event) => update("question", event.target.value)} placeholder="我还不确定：专业直觉和普通偏见应该怎样区分？" />
          </label>
        </div>

        <footer>
          <span><CheckCircle size={17} weight="fill" /> 自动保存在学习记录中</span>
          <div>
            <button className="button button-ghost" type="button" onClick={exportMarkdown}><FileText size={16} /> 导出 Markdown</button>
            <button className="button button-primary" type="button" onClick={() => { onToast("证据笔记已保存"); onClose(); }}>保存并关闭</button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function Workspace({
  stage,
  setStage,
  selectedPack,
  onSelectPack,
  uploadedFile,
  onUpload,
  mastery,
  setMastery,
  onNavigate,
  onToast,
}) {
  const experience = useMemo(() => getLearningExperience(selectedPack), [selectedPack]);
  const [selectedNode, setSelectedNode] = useState(experience.path[0].id);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [mode, setMode] = useState("feynman");
  const [analyzing, setAnalyzing] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [notebook, setNotebook] = useState(() => readStorage("lnt_evidence_notebook", {}));
  const learningRecordId = useRef(null);
  const learningRecordRequest = useRef(null);
  const currentNote = useMemo(
    () => notebook[experience.conceptTitle] || EMPTY_NOTE,
    [experience.conceptTitle, notebook],
  );

  useEffect(() => {
    setSelectedNode(experience.path[0].id);
    setSelectedAnswer(null);
    setMode("feynman");
    setSourceOpen(false);
    setNoteOpen(false);
    learningRecordId.current = null;
    learningRecordRequest.current = null;
  }, [experience]);

  useEffect(() => {
    writeStorage("lnt_evidence_notebook", notebook);
  }, [notebook]);

  useEffect(() => {
    if (stage === "materials") return undefined;
    const timer = window.setTimeout(async () => {
      const noteEvidence = [
        currentNote.example.trim() ? "已记录自己的例子" : "",
        currentNote.boundary.trim() ? "已记录边界或反例" : "",
        currentNote.question.trim() ? "已留下待追问问题" : "",
      ].filter(Boolean);
      const record = {
        packId: selectedPack?.id || "psychology",
        packTitle: selectedPack?.title || "心理学",
        conceptTitle: experience.conceptTitle,
        stage,
        mastery,
        evidence: [
          ...(stage === "deep" && mastery >= 68 ? ["完成一次互动复述"] : []),
          ...noteEvidence,
        ],
        notes: JSON.stringify(currentNote),
      };
      try {
        if (learningRecordId.current) {
          await api.updateLearningSession(learningRecordId.current, record);
          return;
        }
        if (!learningRecordRequest.current) {
          learningRecordRequest.current = api.createLearningSession(record);
        }
        const result = await learningRecordRequest.current;
        learningRecordId.current = result.session.id;
      } catch (requestError) {
        learningRecordRequest.current = null;
        if (requestError.code !== "AUTH_REQUIRED") console.warn("Learning progress sync failed", requestError);
      }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [currentNote, experience, mastery, selectedPack, stage]);

  const generateMap = () => {
    setAnalyzing(true);
    window.setTimeout(() => {
      setAnalyzing(false);
      setStage("map");
      onToast(`${experience.conceptTitle}学习路径已生成：共 ${experience.path.length} 个可执行步骤`);
    }, 900);
  };

  const chooseAnswer = (index) => {
    setSelectedAnswer(index);
    if (index === experience.check.correctIndex) setMastery(Math.max(mastery, 52));
  };

  return (
    <>
    <main className="workspace-page">
      <header className="workspace-topbar">
        <div className="workspace-breadcrumb">
          <button type="button" onClick={() => onNavigate("library")}><ArrowLeft size={17} /> 返回领域书架</button>
          <span />
          <div>
            <small>{selectedPack?.id === "upload" ? "本地资料" : `${selectedPack?.title || "心理学"}知识包`}</small>
            <strong>{experience.conceptTitle}</strong>
          </div>
        </div>
        <div className="workspace-topbar-actions">
          {stage !== "materials" && (
            <>
              <button className={sourceOpen ? "active" : ""} type="button" onClick={() => setSourceOpen((value) => !value)}>
                <FileText size={17} /> {sourceOpen ? "隐藏资料侧栏" : "查看资料摘录"}
              </button>
              <button className={noteOpen ? "active" : ""} type="button" onClick={() => setNoteOpen(true)}>
                <PencilSimple size={17} /> 证据笔记
              </button>
            </>
          )}
          <button type="button" onClick={() => onNavigate("desk")}><House size={17} /> 回到今日桌面</button>
        </div>
      </header>
      <StageNav activeStage={stage} onChange={setStage} />
      <div className={`workspace-layout stage-${stage} ${sourceOpen && stage !== "materials" ? "source-visible" : "source-hidden"}`}>
        {stage !== "materials" && sourceOpen && (
          <SourceDrawer uploadedFile={uploadedFile} onUpload={onUpload} experience={experience} compact={stage === "deep"} />
        )}
        <div className="workspace-content">
          {stage === "materials" && (
            <MaterialsStage
              uploadedFile={uploadedFile}
              onUpload={onUpload}
              onGenerate={generateMap}
              analyzing={analyzing}
              selectedPack={selectedPack}
              onSelectPack={onSelectPack}
            />
          )}
          {stage === "map" && (
            <MapStage
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              onStartLesson={() => setStage("lesson")}
              experience={experience}
            />
          )}
          {stage === "lesson" && (
            selectedPack?.id === "psychology" || !selectedPack ? (
              <LessonStage onCheck={() => setStage("check")} onBack={() => setStage("map")} />
            ) : (
              <TopicLessonStage experience={experience} onCheck={() => setStage("check")} onBack={() => setStage("map")} />
            )
          )}
          {stage === "check" && (
            <CheckStage
              selectedAnswer={selectedAnswer}
              onSelect={chooseAnswer}
              onDeep={() => setStage("deep")}
              onBack={() => setStage("lesson")}
              experience={experience}
            />
          )}
          {stage === "deep" && (
            <DeepStage
              mode={mode}
              onMode={setMode}
              mastery={mastery}
              onMastery={setMastery}
              onToast={onToast}
              onBackMap={() => setStage("map")}
              experience={experience}
            />
          )}
        </div>
        {stage !== "materials" && (
          <ProgressAside
            mastery={mastery}
            stage={stage}
            onNavigate={onNavigate}
            onViewPath={() => setStage("map")}
            experience={experience}
          />
        )}
      </div>
    </main>
    {noteOpen && (
      <EvidenceNotebook
        experience={experience}
        note={currentNote}
        onChange={(note) => setNotebook((current) => ({ ...current, [experience.conceptTitle]: note }))}
        onClose={() => setNoteOpen(false)}
        onToast={onToast}
      />
    )}
    </>
  );
}

function LearningCenter({ onOpenSettings, onToast, onReview }) {
  const [tab, setTab] = useState("overview");
  const [savedSessions, setSavedSessions] = useState([]);
  const [homeReminder, setHomeReminder] = useState(true);
  const [voice, setVoice] = useState(false);
  const [exampleFirst, setExampleFirst] = useState(true);
  const [personality, setPersonality] = useState("balanced");
  const [warmth, setWarmth] = useState(72);
  const [challenge, setChallenge] = useState(64);
  const [depth, setDepth] = useState(78);
  const [initiative, setInitiative] = useState(58);
  useEffect(() => {
    let active = true;
    api.listLearningSessions()
      .then((result) => {
        if (active) setSavedSessions(result.sessions);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [tab]);
  const visibleHistory = savedSessions.length
    ? savedSessions.map((item) => ({
      topic: item.conceptTitle,
      pack: item.packTitle,
      mastery: Math.round(item.mastery),
      date: new Date(item.updatedAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
      status: item.stage === "completed" ? "已完成" : "学习中",
    }))
    : historyItems;
  return (
    <main className="page center-page">
      <section className="center-hero">
        <div className="center-profile">
          <span className="avatar avatar-large">LX</span>
          <div>
            <Tag tone="lavender">个人学习中心</Tag>
            <h1>Lia Xuan</h1>
            <p>在这里回看你的学习历史、认知校准记录和逐渐形成的学习画像。</p>
          </div>
        </div>
        <button className="button button-ghost" type="button" onClick={onOpenSettings}>
          <Gear size={18} /> 个人设置
        </button>
      </section>
      <nav className="center-tabs" aria-label="学习中心分类">
        {[
          ["overview", "学习概览"],
          ["sprint", "7 天冲刺"],
          ["review", "复习计划"],
          ["history", "学习历史"],
          ["calibration", "认知校准档案"],
          ["profile", "学习画像"],
          ["preferences", "学习偏好"],
        ].map(([id, label]) => (
          <button className={tab === id ? "active" : ""} type="button" key={id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "sprint" && <StudySprint onStart={onReview} onToast={onToast} />}
      {tab === "review" && <ReviewQueue onReview={onReview} />}

      {tab === "overview" && (
        <>
          <section className="stat-grid">
            <article>
              <span className="stat-icon pink"><BookOpen size={22} /></span>
              <div><strong>12</strong><span>已学习概念</span></div>
              <Tag tone="green">本周 +4</Tag>
            </article>
            <article>
              <span className="stat-icon lavender"><ClockCounterClockwise size={22} /></span>
              <div><strong>4.6h</strong><span>深度学习时间</span></div>
              <Tag tone="lavender">连续 12 天</Tag>
            </article>
            <article>
              <span className="stat-icon peach"><TrendUp size={22} /></span>
              <div><strong>74%</strong><span>平均掌握度</span></div>
              <Tag tone="green">提升 9%</Tag>
            </article>
            <article>
              <span className="stat-icon green"><SealCheck size={22} /></span>
              <div><strong>8</strong><span>已完成校准</span></div>
              <Tag tone="peach">3 个待验证</Tag>
            </article>
          </section>
          <section className="learner-observation">
            <div className="observation-intro">
              <span className="observation-avatar"><Sparkle size={24} weight="fill" /></span>
              <div>
                <span className="eyebrow">AI 学习伙伴观察</span>
                <h2>你理解得快，也愿意把概念讲成自己的话</h2>
                <p>根据最近 12 个概念、3 次互动复述与认知校准记录生成。随着学习继续，这段描述也会更新。</p>
              </div>
              <Tag tone="lavender">场景驱动型</Tag>
            </div>
            <div className="observation-columns">
              <article className="observation-praise">
                <span><SealCheck size={20} weight="fill" /></span>
                <div>
                  <small>值得表扬</small>
                  <strong>你很会用具体例子抓住抽象概念</strong>
                  <p>在心理学和产品分析中，你能迅速找到生活场景，还会主动用自己的语言复述。这让你的理解不容易停留在“看懂了”。</p>
                </div>
              </article>
              <article className="observation-improve">
                <span><TrendUp size={20} weight="bold" /></span>
                <div>
                  <small>优先改进</small>
                  <strong>把推理再往后多走两步</strong>
                  <p>你的第一层判断通常很准，但遇到复杂问题时，容易略过中间条件。接下来要多练“为什么成立、什么时候不成立”。</p>
                </div>
              </article>
              <article className="observation-next">
                <span><Target size={20} weight="bold" /></span>
                <div>
                  <small>接下来怎么练</small>
                  <strong>每次复述都补一个反例</strong>
                  <p>先举自己的例子，再解释成立原因，最后补一个边界反例。建议本周完成 3 次 10 分钟的苏格拉底追问。</p>
                </div>
                <button type="button" onClick={() => setTab("profile")}>查看完整建议 <ArrowRight size={15} /></button>
              </article>
            </div>
          </section>
          <section className="center-grid">
            <article className="history-panel">
              <div className="panel-heading">
                <div><span className="eyebrow">最近学习</span><h2>继续你的学习轨迹</h2></div>
                <button className="text-button" type="button" onClick={() => setTab("history")}>查看全部</button>
              </div>
              <HistoryTable items={visibleHistory} />
            </article>
            <article className="profile-panel">
              <span className="eyebrow">学习画像摘要</span>
              <h2>偏好“例子 → 概念”</h2>
              <p>你在先看到具体场景时，能更快形成稳定理解。</p>
              <div className="profile-score">
                <label><span>例子联想</span><i><b style={{ width: "86%" }} /></i><strong>86</strong></label>
                <label><span>概念复述</span><i><b style={{ width: "72%" }} /></i><strong>72</strong></label>
                <label><span>连续推理</span><i><b style={{ width: "58%" }} /></i><strong>58</strong></label>
                <label><span>迁移应用</span><i><b style={{ width: "64%" }} /></i><strong>64</strong></label>
              </div>
              <button className="button button-soft button-full" type="button" onClick={() => setTab("profile")}>
                查看完整画像
              </button>
            </article>
          </section>
          <section className="weakness-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">当前薄弱环节</span>
                <h2>最值得优先澄清的 3 个地方</h2>
                <p>这是认知校准档案里仍未稳定掌握的部分，不等于“做错了”。</p>
              </div>
              <button className="button button-soft" type="button" onClick={() => setTab("calibration")}>查看校准档案</button>
            </div>
            <div className="weakness-grid">
              <article><span>01</span><div><strong>复杂概念的连续推理</strong><p>能理解每一步，但跨三步以上时容易漏掉中间条件。</p></div><Tag tone="peach">优先练习</Tag></article>
              <article><span>02</span><div><strong>反例与边界条件</strong><p>复述主结论很清楚，还需要主动补充“不适用的情境”。</p></div><Tag tone="lavender">待验证</Tag></article>
              <article><span>03</span><div><strong>跨场景迁移</strong><p>熟悉案例中表现稳定，换到陌生领域时需要更多提示。</p></div><Tag tone="pink">可提升</Tag></article>
            </div>
          </section>
        </>
      )}

      {tab === "history" && (
        <section className="full-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">学习历史</span><h2>每一次理解都留有轨迹</h2></div>
            <button className="button button-soft" type="button"><FileText size={17} /> 导出记录</button>
          </div>
          <HistoryTable items={visibleHistory} detailed />
        </section>
      )}

      {tab === "calibration" && (
        <section className="full-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">认知校准档案</span>
              <h2>记录仍需澄清、验证与迁移的地方</h2>
              <p>它不是“错题本”，而是一份不断修正理解边界的专业记录。</p>
            </div>
            <Tag tone="peach">3 项待处理</Tag>
          </div>
          <div className="calibration-list">
            {calibrationItems.map((item) => (
              <article key={item.title}>
                <span className={`calibration-state ${item.type === "已校准" ? "done" : ""}`}>
                  {item.type === "已校准" ? <Check size={17} weight="bold" /> : <Question size={17} weight="bold" />}
                </span>
                <div>
                  <div><strong>{item.title}</strong><Tag tone={item.type === "已校准" ? "green" : "peach"}>{item.type}</Tag></div>
                  <p>{item.detail}</p>
                  <small>{item.date}</small>
                </div>
                <button className="icon-button" type="button" aria-label={`打开校准记录：${item.title}`}><CaretRight size={18} /></button>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "profile" && (
        <section className="profile-deep-grid">
          <article className="full-panel profile-story">
            <Tag tone="lavender">你的学习方式</Tag>
            <h2>你是一位“场景驱动型”学习者</h2>
            <p>你会先寻找概念在真实世界里的落点，再从例子中提炼结构。比起一次接收大量定义，你更适合小步讲解、短反馈和频繁复述。</p>
            <div className="profile-facts">
              <span><strong>理解入口</strong> 真实案例</span>
              <span><strong>最佳节奏</strong> 10–20 分钟</span>
              <span><strong>适合模式</strong> 费曼优先</span>
              <span><strong>反馈偏好</strong> 先肯定再追问</span>
            </div>
            <div className="profile-highlight">
              <Lightbulb size={24} weight="fill" />
              <div>
                <strong>给你的建议</strong>
                <p>每学完一个概念，先举一个自己的例子，再向 AI 解释“为什么这个例子成立”；最后补一个反例，训练边界判断。</p>
              </div>
            </div>
          </article>
          <article className="full-panel">
            <span className="eyebrow">能力侧写</span>
            <h2>理解速度快，迁移能力正在形成</h2>
            <p className="ability-summary">你擅长把抽象概念映射到熟悉场景；下一阶段的关键是延长推理链，并主动寻找反例。</p>
            <div className="profile-score large">
              <label><span>例子联想</span><i><b style={{ width: "86%" }} /></i><strong>86</strong></label>
              <label><span>概念复述</span><i><b style={{ width: "72%" }} /></i><strong>72</strong></label>
              <label><span>连续推理</span><i><b style={{ width: "58%" }} /></i><strong>58</strong></label>
              <label><span>迁移应用</span><i><b style={{ width: "64%" }} /></i><strong>64</strong></label>
            </div>
            <div className="next-practice">
              <Target size={21} />
              <div><strong>下一次练习建议</strong><span>选择“苏格拉底模式 · 严格反馈”，重点练习连续追问。</span></div>
            </div>
          </article>
        </section>
      )}

      {tab === "preferences" && (
        <section className="preferences-center">
          <div className="preferences-heading">
            <div>
              <Tag tone="lavender">学习偏好与个性化</Tag>
              <h2>把 AI 学习搭档调成适合你的样子</h2>
              <p>这些设置会影响讲解顺序、反馈语气、追问力度和主动提示的频率。</p>
            </div>
            <button className="button button-primary" type="button" onClick={() => onToast("学习偏好已保存")}>
              保存偏好
            </button>
          </div>

          <div className="preferences-layout">
            <article className="full-panel preference-basics">
              <div className="panel-heading">
                <div><span className="eyebrow">学习方式</span><h2>什么时候提醒，怎么开始讲</h2></div>
              </div>
              <SettingToggle
                icon={Bell}
                title="首页学习提醒"
                description="只在你打开今日桌面时显示温和提醒，不发送系统推送"
                checked={homeReminder}
                onChange={setHomeReminder}
              />
              <SettingToggle
                icon={Microphone}
                title="保留语音输入入口"
                description="优先使用文字；需要时可以切换语音复述"
                checked={voice}
                onChange={setVoice}
              />
              <SettingToggle
                icon={BookOpen}
                title="先例子，后定义"
                description="新概念优先从生活场景开始，再总结正式定义"
                checked={exampleFirst}
                onChange={setExampleFirst}
              />
              <div className="reminder-boundary">
                <ShieldCheck size={18} weight="fill" />
                <span><strong>提醒边界</strong> 不申请系统推送权限，也不会向邮箱发送催学消息。</span>
              </div>
            </article>

            <article className="full-panel personalization-panel">
              <div className="panel-heading">
                <div><span className="eyebrow">个性与智能性</span><h2>先选一种基础风格</h2><p>类似 ChatGPT 的个性化方式：先选整体风格，再微调具体特质。</p></div>
                <Tag tone="pink">随时可改</Tag>
              </div>
              <div className="personality-grid expanded">
                {[
                  ["balanced", "均衡", "清楚、自然，保留思考空间", Sparkle],
                  ["warm", "温暖", "更耐心地复述与鼓励", SealCheck],
                  ["candid", "直率", "直接指出漏洞，减少客套", Target],
                  ["creative", "灵感型", "多用类比与跨领域连接", Lightbulb],
                ].map(([id, title, copy, Icon]) => (
                  <button className={personality === id ? "selected" : ""} type="button" key={id} onClick={() => setPersonality(id)}>
                    <span><Icon size={21} weight="duotone" /></span>
                    <strong>{title}</strong>
                    <small>{copy}</small>
                    {personality === id && <CheckCircle size={18} weight="fill" />}
                  </button>
                ))}
              </div>
              <div className="trait-sliders">
                {[
                  ["温暖程度", warmth, setWarmth, "从冷静克制到温和陪伴"],
                  ["挑战强度", challenge, setChallenge, "从多给提示到持续追问"],
                  ["解释深度", depth, setDepth, "从快速结论到完整推导"],
                  ["主动程度", initiative, setInitiative, "从等你提问到主动建议下一步"],
                ].map(([label, value, setter, copy]) => (
                  <label key={label}>
                    <span><strong>{label}</strong><small>{copy}</small></span>
                    <input type="range" min="0" max="100" value={value} onChange={(event) => setter(Number(event.target.value))} />
                    <b>{value}</b>
                  </label>
                ))}
              </div>
            </article>
          </div>

          <article className="full-panel custom-context-panel">
            <div className="panel-heading">
              <div><span className="eyebrow">让 AI 更了解你</span><h2>补充少量背景，就能得到更贴合的讲解</h2></div>
            </div>
            <div className="custom-context-grid">
              <label>AI 应该怎么称呼你？<input defaultValue="Lia" /></label>
              <label>你现在主要在做什么？<input defaultValue="AI 产品经理，正在学习智能体、Workflow 与连接器" /></label>
              <label>你希望 AI 具备哪些特质？<textarea defaultValue="先复述我的意思，再指出遗漏；讲解要简单但不要过度简化。" /></label>
              <label>还有什么需要了解？<textarea defaultValue="我喜欢从真实案例开始，也希望被追问概念的边界和反例。" /></label>
            </div>
          </article>
        </section>
      )}
    </main>
  );
}

function HistoryTable({ items, detailed = false }) {
  return (
    <div className="history-table">
      {items.map((item) => (
        <article key={item.topic}>
          <span className="history-icon"><BookOpen size={19} /></span>
          <div className="history-topic">
            <strong>{item.topic}</strong>
            <span>{item.pack} · {item.date}</span>
          </div>
          {detailed && <span className="history-mode">费曼模式 2 次</span>}
          <div className="history-mastery">
            <span>{item.mastery}%</span>
            <i><b style={{ width: `${item.mastery}%` }} /></i>
          </div>
          <Tag tone={item.status === "已完成" ? "green" : item.status === "学习中" ? "pink" : "lavender"}>
            {item.status}
          </Tag>
          <button className="icon-button" type="button" aria-label={`打开学习记录：${item.topic}`}><CaretRight size={17} /></button>
        </article>
      ))}
    </div>
  );
}

function SettingsPage({
  session,
  serviceConfig,
  onLogout,
  onBack,
  onToast,
  language,
  onLanguage,
}) {
  const [tab, setTab] = useState("account");
  const exportLearningData = async () => {
    try {
      const result = await api.listLearningSessions();
      const blob = new Blob([JSON.stringify({
        exportedAt: new Date().toISOString(),
        account: { name: session?.name, email: session?.email },
        learningSessions: result.sessions,
      }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `learn-new-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      onToast("学习记录已导出");
    } catch (requestError) {
      onToast(requestError.message);
    }
  };

  const clearLearningData = async () => {
    const confirmation = window.prompt("此操作会永久清除当前账号的学习记录。请输入账号邮箱确认：");
    if (!confirmation) return;
    try {
      const result = await api.clearLearningSessions(confirmation);
      onToast(`已清除 ${result.deleted} 条学习记录`);
    } catch (requestError) {
      onToast(requestError.message);
    }
  };

  return (
    <main className="page settings-page">
      <button className="back-link" type="button" onClick={onBack}><ArrowLeft size={16} /> 返回数字书桌</button>
      <div className="settings-heading">
        <div><Tag tone="lavender">个人设置</Tag><h1>让书桌更适合你</h1></div>
      </div>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="设置分类">
          <button className={tab === "account" ? "active" : ""} type="button" onClick={() => setTab("account")}><UserCircle size={19} /> 账号与资料</button>
          <button className={tab === "ai" ? "active" : ""} type="button" onClick={() => setTab("ai")}><Key size={19} /> AI 服务</button>
          <button className={tab === "privacy" ? "active" : ""} type="button" onClick={() => setTab("privacy")}><ShieldCheck size={19} /> 隐私与数据</button>
          <button className="logout" type="button" onClick={onLogout}><SignOut size={19} /> 退出登录</button>
        </nav>
        <section className="settings-panel">
          {tab === "account" && (
            <>
              <div className="panel-heading"><div><h2>账号与资料</h2><p>这些信息只用于你的学习空间。</p></div></div>
              <div className="profile-edit">
                <span className="avatar avatar-large">LX</span>
                <button className="button button-soft" type="button">更换头像</button>
              </div>
              <div className="settings-form-grid">
                <label>显示名称<input defaultValue={session?.name || "Lia Xuan"} /></label>
                <label>邮箱<input defaultValue={session?.email || "demo@example.com"} /></label>
                <label>界面语言<select value={language} onChange={(event) => onLanguage(event.target.value)}>{LANGUAGE_OPTIONS.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
                <label>所在时区<select defaultValue="shanghai"><option value="shanghai">Asia / Shanghai</option></select></label>
              </div>
              <div className="settings-save-row"><button className="button button-primary" type="button" onClick={() => onToast("个人资料已保存")}>保存修改</button></div>
            </>
          )}
          {tab === "ai" && (
            <>
              <div className="panel-heading">
                <div><h2>AI 服务</h2><p>模型凭证由部署环境管理，浏览器只接收学习反馈。</p></div>
                <Tag tone={serviceConfig.ai ? "green" : "peach"}>{serviceConfig.ai ? "服务器已连接" : "演示模式"}</Tag>
              </div>
              <div className={`provider-card ${serviceConfig.ai ? "selected" : ""}`}>
                <span>{serviceConfig.ai ? <Sparkle size={20} weight="fill" /> : <ShieldCheck size={20} weight="fill" />}</span>
                <div>
                  <strong>{serviceConfig.ai ? "OpenAI-compatible 服务已就绪" : "安全演示反馈"}</strong>
                  <p>{serviceConfig.ai ? "真实请求通过同源后端代理，密钥不会下发到浏览器" : "保留完整交互流程，不会发起外部模型请求"}</p>
                </div>
                {serviceConfig.ai ? <CheckCircle size={20} weight="fill" /> : <LockKey size={20} />}
              </div>
              <div className="server-trust-panel">
                <div><LockKey size={19} /><span><strong>密钥边界</strong> 只在服务器环境变量中配置，不写入仓库、页面或学习记录。</span></div>
                <div><ShieldCheck size={19} /><span><strong>请求边界</strong> 只有已登录用户可以调用教学反馈接口，跨站写请求会被拒绝。</span></div>
              </div>
              <div className="settings-save-row"><button className="button button-soft" type="button" onClick={() => onToast(serviceConfig.ai ? "AI 服务连接正常" : "当前部署尚未配置 AI 环境变量")}>检查服务状态</button></div>
            </>
          )}
          {tab === "privacy" && (
            <>
              <div className="panel-heading"><div><h2>隐私与数据</h2><p>管理账号与服务器端学习记录。</p></div></div>
              <div className="privacy-data-card">
                <span><ShieldCheck size={24} weight="fill" /></span>
                <div><strong>你的资料由你掌控</strong><p>登录凭证使用 HTTP-only 会话；模型密钥不进入浏览器；学习记录按账号隔离保存。</p></div>
              </div>
              <div className="data-row"><div><strong>学习历史</strong><span>导出当前账号的完整学习记录</span></div><button className="button button-soft" type="button" onClick={exportLearningData}>导出</button></div>
              <div className="data-row"><div><strong>清除学习记录</strong><span>需要输入当前账号邮箱确认，不会删除账号</span></div><button className="button button-danger" type="button" onClick={clearLearningData}>清除</button></div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function SettingToggle({ icon: Icon, title, description, checked, onChange }) {
  return (
    <div className="setting-toggle">
      <span><Icon size={21} /></span>
      <div><strong>{title}</strong><small>{description}</small></div>
      <button className={`toggle ${checked ? "on" : ""}`} type="button" onClick={() => onChange(!checked)} aria-pressed={checked}><i /></button>
    </div>
  );
}

function MobileNav({ page, onNavigate }) {
  return (
    <nav className="mobile-nav" aria-label="手机端导航">
      <button className={page === "desk" ? "active" : ""} type="button" onClick={() => onNavigate("desk")}><House size={20} /><span>今日</span></button>
      <button className={page === "library" ? "active" : ""} type="button" onClick={() => onNavigate("library")}><Books size={20} /><span>书架</span></button>
      <button className={page === "workspace" ? "active" : ""} type="button" onClick={() => onNavigate("workspace")}><MapTrifold size={20} /><span>学习</span></button>
      <button className={page === "center" ? "active" : ""} type="button" onClick={() => onNavigate("center")}><ChartBar size={20} /><span>中心</span></button>
    </nav>
  );
}

export function App() {
  const [session, setSession] = useState(null);
  const [serviceConfig, setServiceConfig] = useState({ auth: false, ai: false, demo: true });
  const [onboarded, setOnboarded] = useState(() => readStorage("lnt_onboarded", false));
  const [page, setPage] = useState("home");
  const [authOpen, setAuthOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [stage, setStage] = useState("materials");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [mastery, setMastery] = useState(36);
  const [toast, setToast] = useState("");
  const [language, setLanguage] = useState(() => readStorage("lnt_language", "zh"));

  const apiConnected = serviceConfig.ai;

  const changeLanguage = (nextLanguage) => {
    const option = LANGUAGE_OPTIONS.find((item) => item.id === nextLanguage) || LANGUAGE_OPTIONS[0];
    setLanguage(option.id);
    writeStorage("lnt_language", option.id);
    document.documentElement.lang = option.locale;
  };

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      const [configResult, sessionResult] = await Promise.allSettled([api.config(), api.session()]);
      if (!active) return;
      if (configResult.status === "fulfilled") setServiceConfig(configResult.value);
      if (sessionResult.status === "fulfilled") {
        setSession(sessionResult.value.user);
        setPage("desk");
      }
    };
    restore();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const option = LANGUAGE_OPTIONS.find((item) => item.id === language) || LANGUAGE_OPTIONS[0];
    document.documentElement.lang = option.locale;
  }, [language]);

  const navigate = (nextPage) => {
    if (!session && nextPage !== "home") {
      setAuthOpen(true);
      return;
    }
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const login = async ({ mode, name, email, password }) => {
    const result = mode === "signup"
      ? await api.register({ name, email, password })
      : await api.login({ email, password });
    setSession(result.user);
    setAuthOpen(false);
    setPage("desk");
    if (!onboarded) setTourOpen(true);
  };

  const demoLogin = async () => {
    const result = await api.demo();
    setSession(result.user);
    setAuthOpen(false);
    setPage("desk");
    setTourOpen(true);
  };

  const finishTour = () => {
    setOnboarded(true);
    writeStorage("lnt_onboarded", true);
    setTourOpen(false);
    setToast("引导完成，今天从一个小概念开始吧");
  };

  const startLearning = () => {
    if (!session) {
      setAuthOpen(true);
      return;
    }
    setPage("library");
  };

  const enterPack = (pack) => {
    setSelectedPack(pack);
    if (!apiConnected) {
      setConnectOpen(true);
      return;
    }
    setStage("materials");
    setPage("workspace");
  };

  const enterUploadedFile = (file) => {
    setUploadedFile(file);
    setSelectedPack({ id: "upload", title: file.name });
    setToast(`${file.name} 已放到书桌上`);
    if (!apiConnected) {
      setConnectOpen(true);
      return;
    }
    setStage("materials");
    setPage("workspace");
  };

  const finishConnection = () => {
    setConnectOpen(false);
    setStage("materials");
    setPage("workspace");
    setToast("AI 学习服务已就绪，正在准备学习地图");
  };

  const continueDemo = () => {
    setConnectOpen(false);
    setStage("materials");
    setPage("workspace");
    setToast("已进入演示模式，不会发起真实 AI 请求");
  };

  const openExistingLearning = () => {
    setSelectedPack(knowledgePacks.find((pack) => pack.id === "psychology"));
    setStage("lesson");
    setPage("workspace");
  };

  const logout = async () => {
    await api.logout().catch(() => {});
    setSession(null);
    setPage("home");
    setToast("已退出登录");
  };

  return (
    <div className="app">
      <AppHeader
        session={session}
        apiConnected={apiConnected}
        onLogo={() => navigate(session ? "desk" : "home")}
        onLogin={() => setAuthOpen(true)}
        onNavigate={navigate}
        onLogout={logout}
        language={language}
        onLanguage={changeLanguage}
      />

      {page === "home" && <Landing onLogin={() => setAuthOpen(true)} onDemo={demoLogin} language={language} />}
      {session && page !== "home" && (
        <div className={`signed-layout signed-page-${page}`}>
          <AppSidebar page={page} onNavigate={navigate} />
          <div className="signed-main">
            {page === "desk" && (
              <Desk
                session={session}
                onStart={startLearning}
                onOpenWorkspace={openExistingLearning}
                onNavigate={navigate}
                onToast={setToast}
              />
            )}
            {page === "library" && <Library onSelectPack={enterPack} onUpload={enterUploadedFile} />}
            {page === "workspace" && (
              <Workspace
                stage={stage}
                setStage={setStage}
                selectedPack={selectedPack}
                onSelectPack={(pack) => {
                  setSelectedPack(pack);
                  setUploadedFile(null);
                }}
                uploadedFile={uploadedFile}
                onUpload={(file) => {
                  setUploadedFile(file);
                  setSelectedPack({ id: "upload", title: file.name });
                  setToast(`${file.name} 已加入书桌`);
                }}
                mastery={mastery}
                setMastery={setMastery}
                onNavigate={navigate}
                onToast={setToast}
              />
            )}
            {page === "center" && (
              <LearningCenter
                onOpenSettings={() => navigate("settings")}
                onToast={setToast}
                onReview={openExistingLearning}
              />
            )}
            {page === "settings" && (
              <SettingsPage
                session={session}
                serviceConfig={serviceConfig}
                onLogout={logout}
                onBack={() => navigate("desk")}
                onToast={setToast}
                language={language}
                onLanguage={changeLanguage}
              />
            )}
          </div>
        </div>
      )}

      {session && page !== "home" && <MobileNav page={page} onNavigate={navigate} />}
      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onSuccess={login}
          onDemo={demoLogin}
          language={language}
        />
      )}
      {tourOpen && <OnboardingTour onFinish={finishTour} />}
      {connectOpen && (
        <AIConnectionModal
          serverConnected={apiConnected}
          selectedPack={selectedPack}
          onClose={() => setConnectOpen(false)}
          onConnect={finishConnection}
          onDemo={continueDemo}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle size={19} weight="fill" />
          {toast}
        </div>
      )}
    </div>
  );
}
