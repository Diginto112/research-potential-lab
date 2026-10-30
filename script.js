const STORAGE_KEY = "research-potential-lab-v1";

const opt = (text, note, scores, tags, flags = {}) => ({ text, note, scores, tags, flags });
const q = (type, title, context, options) => ({ type, title, context, options });

const scenarios = [
  { id: "dog", label: "野狗对着电线杆撒尿", title: "你在路边看到一只野狗，对着电线杆撒尿。", context: "导师刚好路过，推了推眼镜：“这个现象很有意思。”你决定如何回应？" },
  { id: "centrifuge", label: "凌晨三点自动启动的离心机", title: "凌晨三点，实验室的离心机突然自己转了起来。", context: "没人承认按过启动键。导师发来消息：“年轻人要善于发现问题。”" },
  { id: "canteen", label: "食堂阿姨颠勺次数的差异", title: "你发现食堂阿姨给不同同学的饭，颠勺次数不太一样。", context: "这可能是手感，也可能是一个尚未发表的分配机制。导师看向了你。" },
  { id: "pigeon", label: "连续七天盯着你工位的鸽子", title: "同一只鸽子连续七天停在你工位的窗外。", context: "它没有申请入组，却稳定贡献观察数据。你开始怀疑它有自己的研究计划。" },
  { id: "coffee", label: "在组会上到处流转的咖啡杯", title: "你的咖啡杯每次都在组会上出现在不同人的手里。", context: "杯子上写着你的名字，但整个课题组都说这是一个值得深入的现象。" },
  { id: "printer", label: "每次打印都多出一页的打印机", title: "实验室打印机每次打印论文，都会神秘多出一页空白纸。", context: "那一页没有字，却总是出现在你的文献综述后面。" }
];

const specialQuestionPools = {
  dog: [
    q("选题题", "导师要你根据“{{phenomenon}}”提出一个研究主题，你会选择：", "选一个你真的可能拿去和导师聊的方向。越离谱，越需要论证。", [
      opt("论它为什么选择这个目标，而不选择旁边那个", "行为生态学 × 城市基础设施", { innovation: 92, frontier: 84, feasibility: 54, resilience: 83 }, ["问题意识", "大胆命名"], { chaos: 1 }),
      opt("研究这个目标的表面材料如何影响它的选择", "看起来非常像一篇真的论文", { innovation: 76, frontier: 74, feasibility: 87, resilience: 72 }, ["稳中带新", "落地派"], { serious: 1 }),
      opt("先做一个问卷，问问大家觉得它到底想表达什么", "样本量：路过的 17 个人", { innovation: 67, frontier: 58, feasibility: 79, resilience: 80 }, ["田野直觉", "人类学魂"], { chaos: 1 }),
      opt("不如研究导师为什么觉得这能成为研究主题", "元科研：从导师的眼镜开始", { innovation: 94, frontier: 89, feasibility: 46, resilience: 91 }, ["元问题", "反身性"], { chaos: 1, rebel: 1 })
    ]),
    q("方法题", "你准备如何研究“{{phenomenon}}”？", "导师要的是方法，你脑中出现的是一场经费预算。", [
      opt("架一台摄像机，连续观察 30 天并编码行为", "先把荒谬变成时间序列", { innovation: 84, frontier: 78, feasibility: 81, resilience: 86 }, ["观察派", "能做"], { serious: 1 }),
      opt("给它做一份半结构化访谈提纲，等它愿意开口", "伦理审批暂时卡在动物同意书", { innovation: 95, frontier: 88, feasibility: 35, resilience: 79 }, ["极端田野", "想象力过剩"], { chaos: 2 }),
      opt("先写一个标题特别长的综述，证明别人没研究过", "标题越长，空白越大", { innovation: 70, frontier: 74, feasibility: 63, resilience: 73 }, ["文献考古", "标题战士"], { chaos: 1 }),
      opt("让导师先拨经费，方法可以在经费到账后出现", "科研管理学的反向实验", { innovation: 66, frontier: 59, feasibility: 42, resilience: 82 }, ["资源优先", "谈判派"], { rebel: 1 })
    ]),
    q("变量题", "如果要把“{{phenomenon}}”做成实验，你最想控制哪个变量？", "你终于开始把狗、杆子和导师都写进实验设计。", [
      opt("目标的材质、位置和气味，做一个正经的三因素设计", "统计学终于走进了这个故事", { innovation: 88, frontier: 84, feasibility: 90, resilience: 82 }, ["实验设计", "可复现"], { serious: 1 }),
      opt("导师当天的心情，毕竟他才是最大的混杂变量", "混杂因素：人类本身", { innovation: 93, frontier: 90, feasibility: 48, resilience: 96 }, ["高阶吐槽", "元分析"], { chaos: 1, rebel: 1 }),
      opt("只控制天气，其他交给命运和现场记录", "生态研究的松弛版本", { innovation: 63, frontier: 57, feasibility: 76, resilience: 75 }, ["自然主义", "随机科研"], { chaos: 1 }),
      opt("什么都不控制，先看它愿不愿意配合", "研究对象拥有最终决定权", { innovation: 54, frontier: 51, feasibility: 39, resilience: 84 }, ["边界感", "低干预"], { lazy: 1 })
    ])
  ],
  centrifuge: [
    q("选题题", "导师要你根据“{{phenomenon}}”提出一个研究主题，你会选择：", "你决定先不报警，毕竟这可能是一个课题。", [
      opt("离心机夜间自启动的幽灵机制与实验室能源消耗", "能源科学 × 校园传说", { innovation: 92, frontier: 80, feasibility: 55, resilience: 86 }, ["脑洞选题", "夜班研究员"], { chaos: 1 }),
      opt("实验设备异常启动的可观测原因与安全管理策略", "听起来像真正能立项的题目", { innovation: 75, frontier: 78, feasibility: 91, resilience: 84 }, ["安全意识", "落地派"], { serious: 1 }),
      opt("凌晨三点的实验室为什么比白天更有科研氛围", "样本：所有不睡觉的人", { innovation: 78, frontier: 68, feasibility: 67, resilience: 76 }, ["环境心理", "夜猫子"], { chaos: 1 }),
      opt("先问保安大哥有没有看见什么", "田野调查从门口开始", { innovation: 62, frontier: 50, feasibility: 82, resilience: 80 }, ["基层调研", "先问再说"], { serious: 1 })
    ]),
    q("排查题", "你准备如何排查“{{phenomenon}}”到底是谁启动的？", "每一个插头都像潜在的共同作者。", [
      opt("查日志、摄像头和电源管理记录，按证据逐项排除", "让监控成为你最可靠的合作者", { innovation: 78, frontier: 77, feasibility: 95, resilience: 92 }, ["证据链", "靠谱"], { serious: 1 }),
      opt("等它今晚再启动一次，现场抓获作案设备", "重复实验很重要，哪怕对象是离心机", { innovation: 84, frontier: 74, feasibility: 80, resilience: 88 }, ["复现实验", "行动派"], { workaholic: 1 }),
      opt("在机器旁边放一张纸：请作案者留下邮箱", "开放科学从匿名举报开始", { innovation: 88, frontier: 69, feasibility: 58, resilience: 81 }, ["仪式感", "开放调查"], { chaos: 1 }),
      opt("先把它拔掉，明天再说。科学也需要睡眠", "安全第一，论文第二", { innovation: 50, frontier: 43, feasibility: 76, resilience: 73 }, ["低耗能", "边界感"], { lazy: 2 })
    ]),
    q("伦理题", "如果发现是你自己昨晚梦游时启动了“{{phenomenon}}”，你会：", "研究者也可能是实验条件的一部分。", [
      opt("如实记录，把自己作为异常变量写进局限性", "诚实到让审稿人有点感动", { innovation: 87, frontier: 82, feasibility: 91, resilience: 93 }, ["科研诚信", "自我反思"], { serious: 1 }),
      opt("把梦游包装成一种新型人机交互行为", "创新点：人类睡着时的自动化", { innovation: 96, frontier: 91, feasibility: 49, resilience: 87 }, ["概念创新", "会包装"], { chaos: 1 }),
      opt("删掉监控记录，避免给实验室添麻烦", "这不是数据清洗，是数据失踪", { innovation: 30, frontier: 25, feasibility: 32, resilience: 38 }, ["红线边缘", "危险"], { lazy: 1, chaos: 1 }),
      opt("以后每天睡在实验室，确保第一时间观察自己", "把生活彻底变成实验", { innovation: 79, frontier: 73, feasibility: 61, resilience: 98 }, ["极限观察", "住在实验室"], { workaholic: 2 })
    ])
  ],
  canteen: [
    q("选题题", "导师要你根据“{{phenomenon}}”提出一个研究主题，你会选择：", "你的研究对象有勺子、有饭，还有复杂的人情世故。", [
      opt("颠勺次数如何影响研究生的饱腹感与学术产出", "食堂营养学 × 科研效率", { innovation: 91, frontier: 80, feasibility: 64, resilience: 83 }, ["跨界选题", "吃饱再说"], { chaos: 1 }),
      opt("不同窗口的分配动作与食物重量偏差", "可称重、可复核、可发表", { innovation: 74, frontier: 73, feasibility: 93, resilience: 78 }, ["测量派", "稳"], { serious: 1 }),
      opt("阿姨是不是能一眼识别哪个学生快没钱了", "社会观察，伦理边界另说", { innovation: 84, frontier: 69, feasibility: 72, resilience: 87 }, ["社会科学", "观察细腻"], { chaos: 1 }),
      opt("研究为什么每个人都觉得自己的那勺饭最少", "主观贫困的食堂版本", { innovation: 90, frontier: 86, feasibility: 58, resilience: 90 }, ["反直觉", "心理测量"], { rebel: 1 })
    ]),
    q("取样题", "为了研究“{{phenomenon}}”，你打算怎么取样？", "样本会影响结论，饭卡余额也会。", [
      opt("连续两周记录同一窗口的重量、时间和排队人数", "先做出一张不会被导师打回的表", { innovation: 77, frontier: 75, feasibility: 94, resilience: 85 }, ["规范取样", "表格高手"], { serious: 1 }),
      opt("只测今天看起来最香的那一勺", "方便，但代表性非常可疑", { innovation: 60, frontier: 48, feasibility: 76, resilience: 70 }, ["机会主义", "香就完事"], { chaos: 1 }),
      opt("请全组同学按饭量分层，再让导师负责监督", "层级抽样与权力关系同时出现", { innovation: 86, frontier: 82, feasibility: 71, resilience: 91 }, ["设计感", "组织能力"], { serious: 1, rebel: 1 }),
      opt("每天吃三顿，亲自成为最大的样本", "n=你本人，持续扩大", { innovation: 73, frontier: 64, feasibility: 53, resilience: 88 }, ["亲身实验", "胃容量"], { workaholic: 1 })
    ]),
    q("解释题", "如果结果显示：颠勺越多，大家越觉得饭少。你会怎么解释？", "数据终于开口了，但它没有替你写讨论部分。", [
      opt("考虑视觉、期待和参照物的共同影响，提出多个可检验机制", "从一个饭勺走向一个理论模型", { innovation: 90, frontier: 86, feasibility: 83, resilience: 88 }, ["机制意识", "理论派"], { serious: 1 }),
      opt("结论：人类永远觉得自己亏了", "一句话包打天下，暂时没有图", { innovation: 75, frontier: 57, feasibility: 59, resilience: 83 }, ["金句型", "社会观察"], { chaos: 1 }),
      opt("追加实验：换成透明餐盒，看大家还抱怨不抱怨", "视觉信息干预即将上线", { innovation: 88, frontier: 80, feasibility: 79, resilience: 86 }, ["实验派", "二次验证"], { serious: 1 }),
      opt("把结果交给食堂阿姨解释，她最懂这个系统", "专家访谈从最关键的人开始", { innovation: 71, frontier: 61, feasibility: 73, resilience: 81 }, ["田野智慧", "尊重经验"], { chaos: 1 })
    ])
  ],
  pigeon: [
    q("选题题", "导师要你根据“{{phenomenon}}”提出一个研究主题，你会选择：", "它每天准时出现，作息比你稳定。", [
      opt("城市鸽子的工位偏好与研究生压力感知关系", "城市生态 × 学术劳动", { innovation: 93, frontier: 84, feasibility: 61, resilience: 88 }, ["跨学科", "观察细"], { chaos: 1 }),
      opt("鸟类重复停留行为的时间规律与环境因素", "经典、可靠、能做", { innovation: 76, frontier: 78, feasibility: 90, resilience: 79 }, ["标准路线", "可复现"], { serious: 1 }),
      opt("鸽子是否在暗中评价我的论文进度", "主观评分量表还在设计", { innovation: 96, frontier: 91, feasibility: 41, resilience: 86 }, ["荒诞假设", "自我投射"], { chaos: 2 }),
      opt("先给它起名，再看看它愿不愿意参与实验", "研究关系从命名开始", { innovation: 70, frontier: 63, feasibility: 74, resilience: 84 }, ["关系研究", "温和派"], { serious: 1 })
    ]),
    q("追踪题", "你决定追踪“{{phenomenon}}”一个月，第一步是：", "真正的研究从记录开始，真正的鸽子从窗台开始。", [
      opt("建立时间、天气、位置和行为的每日记录表", "鸽子也值得一份规范数据字典", { innovation: 81, frontier: 78, feasibility: 92, resilience: 87 }, ["长期主义", "数据习惯"], { serious: 1 }),
      opt("给它戴一个小小的编号牌，并在论文里称它为 P-001", "样本量从一个开始", { innovation: 85, frontier: 74, feasibility: 63, resilience: 82 }, ["实验叙事", "编号控"], { chaos: 1 }),
      opt("先查它有没有自己的课题组和通讯作者", "学术共同体边界需要厘清", { innovation: 94, frontier: 83, feasibility: 47, resilience: 90 }, ["元科研", "边界探索"], { rebel: 1, chaos: 1 }),
      opt("把窗帘拉上，假装没有这回事", "负面结果也有它的价值", { innovation: 39, frontier: 34, feasibility: 71, resilience: 62 }, ["回避型", "低刺激"], { lazy: 2 })
    ]),
    q("突发题", "追踪到第 18 天，鸽子突然不来了。你会：", "消失也是一种数据，但导师可能只看见了你的空表格。", [
      opt("标记缺失值，调查环境变化，并报告追踪中断", "让不确定性也进入结果", { innovation: 85, frontier: 83, feasibility: 90, resilience: 94 }, ["诚实记录", "缺失值管理"], { serious: 1 }),
      opt("在楼下放一张寻鸽启事，标题写“项目急需共同作者”", "转化传播学正在发生", { innovation: 91, frontier: 70, feasibility: 57, resilience: 89 }, ["传播能力", "招募派"], { chaos: 1 }),
      opt("把第 18 天之后都定义为‘鸽子缺席期’，继续写论文", "分类标准由你决定", { innovation: 67, frontier: 52, feasibility: 47, resilience: 69 }, ["命名策略", "有点危险"], { chaos: 1, lazy: 1 }),
      opt("每天去窗边等它，等到它回来为止", "这是追踪，也是执念", { innovation: 64, frontier: 59, feasibility: 45, resilience: 98 }, ["长期蹲守", "实验室常驻"], { workaholic: 2 })
    ])
  ],
  coffee: [
    q("选题题", "导师要你根据“{{phenomenon}}”提出一个研究主题，你会选择：", "杯子没有固定位置，但它显然有自己的社交网络。", [
      opt("科研团队中物品流转对协作网络形成的影响", "组织行为学终于找到了杯子", { innovation: 89, frontier: 83, feasibility: 78, resilience: 84 }, ["网络思维", "跨界"], { serious: 1 }),
      opt("咖啡杯为什么总是精准出现在最需要咖啡的人手里", "需求预测 × 组会生态", { innovation: 92, frontier: 79, feasibility: 69, resilience: 89 }, ["生活科学", "问题意识"], { chaos: 1 }),
      opt("建立一套杯子借用积分系统，谁喝谁署名", "把混乱变成可视化排行榜", { innovation: 82, frontier: 67, feasibility: 85, resilience: 86 }, ["制度设计", "可执行"], { serious: 1 }),
      opt("研究大家为什么都不承认自己拿过我的杯子", "否认行为的集体动力学", { innovation: 94, frontier: 88, feasibility: 51, resilience: 92 }, ["反身性", "证词研究"], { chaos: 1, rebel: 1 })
    ]),
    q("网络题", "你准备如何绘制“{{phenomenon}}”的流转网络？", "每一条边，都可能通往一个还没洗的杯子。", [
      opt("记录借用者、时间和场景，画出有向加权网络", "网络科学终于接管了茶歇", { innovation: 90, frontier: 85, feasibility: 88, resilience: 86 }, ["结构化", "网络派"], { serious: 1 }),
      opt("谁拿走杯子就追问谁，直到网络图自己浮现", "访谈法：直接且有压迫感", { innovation: 76, frontier: 70, feasibility: 75, resilience: 91 }, ["田野调查", "追问型"], { rebel: 1 }),
      opt("用不同颜色的贴纸标记，让杯子自己形成图", "视觉化方法，严谨程度待评估", { innovation: 84, frontier: 66, feasibility: 72, resilience: 79 }, ["可视化", "手作派"], { chaos: 1 }),
      opt("只研究杯子最后落在谁桌上，过程暂时忽略", "终点比路径更重要？", { innovation: 58, frontier: 49, feasibility: 63, resilience: 73 }, ["极简主义", "低成本"], { lazy: 1 })
    ]),
    q("冲突题", "如果有人说：“一个杯子而已，别把它写成论文。”你会：", "真正的创新，往往从一句‘这也能研究？’开始。", [
      opt("承认对象很小，但解释它如何承载协作、权力与日常秩序", "把杯子放回更大的理论背景", { innovation: 90, frontier: 89, feasibility: 86, resilience: 95 }, ["理论拔高", "会回应"], { serious: 1 }),
      opt("回一句：你看，这正是我论文要解决的问题", "把质疑变成摘要第一句", { innovation: 85, frontier: 76, feasibility: 61, resilience: 97 }, ["反问高手", "抗压"], { rebel: 2 }),
      opt("把杯子拍成一条短视频，先让它火了再说", "传播效果也是一种外部验证", { innovation: 83, frontier: 62, feasibility: 70, resilience: 75 }, ["传播派", "先上热搜"], { chaos: 1 }),
      opt("不写了，拿回杯子，今天先把咖啡喝完", "有些问题需要先被解决", { innovation: 46, frontier: 39, feasibility: 78, resilience: 72 }, ["现实主义", "先喝为敬"], { lazy: 2 })
    ])
  ],
  printer: [
    q("选题题", "导师要你根据“{{phenomenon}}”提出一个研究主题，你会选择：", "空白页像沉默的审稿人，等你解释。", [
      opt("打印设备在学术写作流程中的隐性反馈机制", "人机交互 × 学术生产", { innovation: 89, frontier: 85, feasibility: 74, resilience: 86 }, ["跨界", "隐性机制"], { serious: 1 }),
      opt("空白纸是否代表论文里尚未被发现的创新点", "把缺失当作信号", { innovation: 96, frontier: 90, feasibility: 42, resilience: 90 }, ["缺失研究", "脑洞大开"], { chaos: 1 }),
      opt("打印一页多一页，说明打印机正在尝试发表", "机器作者的早期职业生涯", { innovation: 92, frontier: 83, feasibility: 34, resilience: 82 }, ["科幻科研", "作者扩展"], { chaos: 2 }),
      opt("先换一个打印机，问题解决了就不研究了", "可行性最高，论文性最低", { innovation: 48, frontier: 38, feasibility: 92, resilience: 71 }, ["务实派", "快速止损"], { lazy: 1 })
    ]),
    q("复现题", "为了验证“{{phenomenon}}”，你要先做哪件事？", "复现不是重复按打印键，而是确认世界确实如此。", [
      opt("在不同文件、纸张和时间点重复打印并记录条件", "把玄学变成实验日志", { innovation: 82, frontier: 79, feasibility: 91, resilience: 86 }, ["复现能力", "记录党"], { serious: 1 }),
      opt("换三台电脑，确认是不是文档本身在作怪", "设备、软件和文件三方会谈", { innovation: 78, frontier: 70, feasibility: 88, resilience: 83 }, ["排查派", "工程脑"], { serious: 1 }),
      opt("每次多出的空白页都编号，等它形成自己的序列", "时间序列也可以很有诗意", { innovation: 88, frontier: 74, feasibility: 65, resilience: 80 }, ["长期记录", "纸张考古"], { chaos: 1 }),
      opt("接受它，论文以后多出来的内容就当附录", "意外成为结构设计", { innovation: 54, frontier: 45, feasibility: 69, resilience: 77 }, ["顺其自然", "低干预"], { lazy: 1 })
    ]),
    q("投稿题", "审稿人说：“你对空白页的解释过度了。”你会：", "对方可能没看懂，也可能看得太懂。", [
      opt("收窄结论，把它改成可被数据支持的设备异常现象", "让故事回到证据边界", { innovation: 81, frontier: 79, feasibility: 92, resilience: 94 }, ["边界意识", "会修改"], { serious: 1 }),
      opt("坚持这是打印机对学术体制的无声抗议", "理论立场非常坚定，数据还在路上", { innovation: 94, frontier: 91, feasibility: 39, resilience: 95 }, ["理论斗士", "拒绝低头"], { rebel: 2, chaos: 1 }),
      opt("把空白页放到补充材料里，标题叫‘未尽之言’", "审稿人也许会被文学性打动", { innovation: 78, frontier: 66, feasibility: 61, resilience: 72 }, ["包装感", "补充材料"], { chaos: 1 }),
      opt("直接接受审稿意见，顺便申请延期三个月", "修改和拖延同时发生", { innovation: 59, frontier: 51, feasibility: 68, resilience: 73 }, ["延迟型科研", "先缓缓"], { lazy: 2 })
    ])
  ]
};

const publicQuestionPool = [
  q("创新题", "导师说：“你的创新点还不够。”你会怎么做？", "这是科研路上最常见的一句话。你准备如何接住这一球？", [
    opt("反问老师：这不是你给我的选题吗？", "场面一度安静，创新性暂时无法量化", { innovation: 82, frontier: 67, feasibility: 61, resilience: 96 }, ["高压抗性", "直球选手"], { rebel: 2 }),
    opt("重新梳理问题，找一个更窄但更深的切口", "把“再想想”变成可执行的修改清单", { innovation: 84, frontier: 86, feasibility: 88, resilience: 83 }, ["迭代能力", "靠谱"], { serious: 1 }),
    opt("把摘要里的 every 改成 the first ever，然后祈祷审稿人没发现", "语言学创新，风险自负", { innovation: 70, frontier: 77, feasibility: 73, resilience: 63 }, ["包装大师", "边缘创新"], { chaos: 1 }),
    opt("先打开外卖软件压压惊，明天再说", "延期也是一种时间序列策略", { innovation: 42, frontier: 35, feasibility: 53, resilience: 48 }, ["延迟满足失败", "人间清醒"], { lazy: 2 })
  ]),
  q("数据题", "实验做了三个月，结果完全不显著。你会：", "p 值像一只冷漠的猫，趴在你的结果上。接下来怎么办？", [
    opt("诚实报告，重新检查假设与实验设计，再决定下一步", "让数据说话，哪怕它只说了“喵”", { innovation: 79, frontier: 82, feasibility: 92, resilience: 90 }, ["科研诚信", "复盘高手"], { serious: 1 }),
    opt("把图的纵轴换一种写法，视觉上先显著一下", "美化数据不能改变数据的心情", { innovation: 36, frontier: 30, feasibility: 25, resilience: 40 }, ["危险操作", "红线试探"], { chaos: 1, lazy: 1 }),
    opt("扩大样本量到所有认识的人，直到结果开始尊重我", "统计功效与社交能力的双重考验", { innovation: 71, frontier: 65, feasibility: 68, resilience: 93 }, ["执着", "样本狂人"], { workaholic: 1 }),
    opt("先去睡一觉，醒来如果它还不显著，就接受命运", "睡眠是最古老的科研工具", { innovation: 48, frontier: 40, feasibility: 66, resilience: 70 }, ["睡眠优先", "低耗能科研"], { lazy: 2 })
  ]),
  q("组会题", "组会上有人问：“你的工作和已有研究有什么区别？”", "全场的目光像显微镜一样扫过来。你选择怎样展示你的贡献？", [
    opt("打开一张清晰的对比表：问题、方法、数据和边界都讲明白", "没有烟花，但每个逻辑都站得住", { innovation: 78, frontier: 82, feasibility: 94, resilience: 84 }, ["结构清晰", "可信赖"], { serious: 1 }),
    opt("先说一句“这个问题问得非常好”，然后开始绕", "语言组织能力即将接受压力测试", { innovation: 68, frontier: 61, feasibility: 58, resilience: 76 }, ["缓冲大师", "话术流"], { chaos: 1 }),
    opt("把所有相关论文的标题做成一张词云，颜色越鲜艳越创新", "图很大，贡献很小，但气势很足", { innovation: 61, frontier: 66, feasibility: 48, resilience: 71 }, ["视觉派", "气氛组"], { chaos: 1 }),
    opt("提前三天找同门模拟拷问，直到自己能从梦里答出来", "把组会当作一场小型答辩马拉松", { innovation: 81, frontier: 79, feasibility: 82, resilience: 99 }, ["备战狂", "抗压型选手"], { workaholic: 2 })
  ]),
  q("生存题", "距离投稿截止还有 48 小时，你的稿子还差一半。", "现在是选择科研策略的时候了：冲刺、沟通，或者假装时间不存在。", [
    opt("拆成清单，先完成关键结果，再和合作者明确分工", "把混乱变成一件件可交付的事情", { innovation: 80, frontier: 83, feasibility: 96, resilience: 92 }, ["项目管理", "靠谱合作者"], { serious: 1 }),
    opt("通宵 48 小时，咖啡就是我的共同一作", "短期爆发，长期需要体检", { innovation: 76, frontier: 75, feasibility: 72, resilience: 88 }, ["极限冲刺", "咖啡依赖"], { workaholic: 2 }),
    opt("给导师发消息：老师，我觉得这个截止日期值得重新讨论", "把时间管理提升到制度设计", { innovation: 84, frontier: 69, feasibility: 51, resilience: 85 }, ["边界感", "谈判派"], { rebel: 1 }),
    opt("关掉电脑，去看一场电影。论文不会因为我盯着它而变好", "你说得对，但截止日期也说得对", { innovation: 54, frontier: 46, feasibility: 40, resilience: 73 }, ["松弛感", "延毕预备"], { lazy: 2 })
  ]),
  q("审稿题", "审稿人说：“这个结果很有趣，但解释完全不够。”", "你已经把讨论部分改了四版，现在轮到你回应意见。", [
    opt("逐条回应，补充分析，并明确哪些结论仍然不能说", "让论文知道自己的边界", { innovation: 83, frontier: 86, feasibility: 94, resilience: 95 }, ["回应清晰", "严谨派"], { serious: 1 }),
    opt("回信里写：感谢审稿人的深刻洞察，然后什么都不改", "礼貌是一种低成本策略", { innovation: 55, frontier: 58, feasibility: 45, resilience: 72 }, ["礼貌拖延", "话术"], { chaos: 1, lazy: 1 }),
    opt("新增一张图，图题写成一段小论文", "让视觉材料替你继续辩论", { innovation: 79, frontier: 73, feasibility: 70, resilience: 83 }, ["补图派", "图多有理"], { chaos: 1 }),
    opt("约同门开一个紧急读稿会，把每个字都过一遍", "把审稿意见变成团队运动", { innovation: 81, frontier: 80, feasibility: 85, resilience: 99 }, ["团队型", "抗压"], { workaholic: 2 })
  ]),
  q("合作题", "合作者三天没有回复，你的结果卡在他的分析上。你会：", "科研是一项协作运动，也是一项等待运动。", [
    opt("发一封清晰的邮件，附上截止时间、当前进度和可选方案", "把催促写成项目管理", { innovation: 77, frontier: 80, feasibility: 95, resilience: 88 }, ["沟通能力", "项目推进"], { serious: 1 }),
    opt("在群里发一个‘大家最近还好吗’的表情包", "间接沟通，直接心虚", { innovation: 61, frontier: 54, feasibility: 61, resilience: 72 }, ["社交缓冲", "温和催促"], { chaos: 1 }),
    opt("自己把分析重做一遍，顺便把他的名字先留着", "能力越大，工位越晚关", { innovation: 84, frontier: 75, feasibility: 79, resilience: 92 }, ["补位能力", "能者多劳"], { workaholic: 2 }),
    opt("等他回复，先研究一下为什么人类会消失", "缺失数据：合作者版本", { innovation: 64, frontier: 58, feasibility: 45, resilience: 76 }, ["哲学等待", "低耗能"], { lazy: 2 })
  ]),
  q("复现题", "你发现别人的经典结果在你的实验里完全复现不出来。", "这次轮到你的实验对经典说：不一定。", [
    opt("逐步核对材料、代码、参数与环境，记录所有偏差", "复现失败也是可发表的信息", { innovation: 86, frontier: 84, feasibility: 94, resilience: 93 }, ["可复现", "排查高手"], { serious: 1 }),
    opt("先把自己的结果再做一遍，确认不是今天状态不好", "重复实验像给自己发第二次机会", { innovation: 74, frontier: 67, feasibility: 80, resilience: 89 }, ["稳妥", "重复验证"], { workaholic: 1 }),
    opt("宣布经典结论进入‘待重新审视’名单", "公告很快，证据稍后", { innovation: 91, frontier: 79, feasibility: 51, resilience: 90 }, ["大胆质疑", "话题制造"], { rebel: 1, chaos: 1 }),
    opt("把失败归因于水土不服，换个课题", "转向也是一种研究策略", { innovation: 45, frontier: 41, feasibility: 55, resilience: 65 }, ["快速转场", "止损"], { lazy: 1 })
  ]),
  q("摆烂题", "导师发来消息：“有空吗？聊一下最近的进展。”你会：", "这句话的字面意思和实际含义之间，隔着一整个学期。", [
    opt("马上整理进展、问题和下一步，带着材料去聊", "把‘有空吗’变成一次小型汇报", { innovation: 82, frontier: 81, feasibility: 91, resilience: 96 }, ["主动汇报", "准备充分"], { serious: 1 }),
    opt("回复：老师我一直在思考，具体内容还在形成", "信息量不多，哲学意味很足", { innovation: 63, frontier: 55, feasibility: 58, resilience: 72 }, ["模糊表达", "缓冲"], { chaos: 1 }),
    opt("把状态改成忙碌，假装正在做一个重要实验", "数字化隐身术", { innovation: 38, frontier: 31, feasibility: 49, resilience: 55 }, ["消失艺术", "低耗能"], { lazy: 2 }),
    opt("直接问：老师您希望我带几个版本的进展？", "把压力反向变成需求澄清", { innovation: 87, frontier: 78, feasibility: 85, resilience: 94 }, ["边界沟通", "高效"], { rebel: 1, serious: 1 })
  ])
];

const state = {
  currentScreen: "landing",
  questionIndex: 0,
  selectedIndex: null,
  scenario: scenarios[0],
  questionQueue: [],
  rerollUsed: false,
  answers: [],
  metrics: { innovation: 0, frontier: 0, feasibility: 0, resilience: 0 },
  flags: { lazy: 0, workaholic: 0, chaos: 0, serious: 0, rebel: 0 },
  stats: loadStats()
};

const els = {
  landing: document.querySelector("#landingScreen"),
  quiz: document.querySelector("#quizScreen"),
  result: document.querySelector("#resultScreen"),
  start: document.querySelector("#startButton"),
  how: document.querySelector("#howButton"),
  brand: document.querySelector("#brandButton"),
  statsButtons: [document.querySelector("#statsButton"), document.querySelector("#resultStatsButton")],
  back: document.querySelector("#backToLandingButton"),
  acceptScenario: document.querySelector("#acceptScenarioButton"),
  reroll: document.querySelector("#rerollButton"),
  scenarioActions: document.querySelector("#scenarioActions"),
  answerList: document.querySelector("#answerList"),
  answerFooter: document.querySelector("#answerFooter"),
  next: document.querySelector("#nextButton"),
  selectionHint: document.querySelector("#selectionHint"),
  progressLabel: document.querySelector("#progressLabel"),
  progressPercent: document.querySelector("#progressPercent"),
  progressValue: document.querySelector("#progressValue"),
  questionIndex: document.querySelector("#questionIndex"),
  questionType: document.querySelector("#questionType"),
  quizTitle: document.querySelector("#quizTitle"),
  questionContext: document.querySelector("#questionContext"),
  landingUnlockCount: document.querySelector("#landingUnlockCount"),
  statsModal: document.querySelector("#statsModal"),
  closeStats: document.querySelector("#closeStatsButton"),
  resetStats: document.querySelector("#resetStatsButton"),
  toast: document.querySelector("#toast"),
  share: document.querySelector("#shareButton"),
  restart: document.querySelector("#restartButton")
};

function loadStats() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      views: saved?.views || 0,
      starts: saved?.starts || 0,
      completions: saved?.completions || 0,
      personas: Array.isArray(saved?.personas) ? saved.personas : [],
      unlockCount: saved?.unlockCount || 2847
    };
  } catch {
    return { views: 0, starts: 0, completions: 0, personas: [], unlockCount: 2847 };
  }
}

function saveStats() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.stats)); }

function bootStats() {
  state.stats.views += 1;
  saveStats();
  els.landingUnlockCount.textContent = state.stats.unlockCount.toLocaleString("en-US");
}

function showScreen(name) {
  state.currentScreen = name;
  [els.landing, els.quiz, els.result].forEach((screen) => {
    const active = screen.id.toLowerCase().startsWith(name);
    screen.hidden = !active;
    screen.classList.toggle("is-active", active);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetRun() {
  state.questionIndex = 0;
  state.selectedIndex = null;
  state.scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  state.questionQueue = [];
  state.rerollUsed = false;
  state.answers = [];
  state.metrics = { innovation: 0, frontier: 0, feasibility: 0, resilience: 0 };
  state.flags = { lazy: 0, workaholic: 0, chaos: 0, serious: 0, rebel: 0 };
  renderScenarioStage();
}

function startQuiz() {
  state.stats.starts += 1;
  saveStats();
  resetRun();
  showScreen("quiz");
}

function renderScenarioStage() {
  const progress = 0;
  els.progressLabel.textContent = "第 1 / 7 题";
  els.progressPercent.textContent = `${progress}%`;
  els.progressValue.style.width = `${progress}%`;
  els.questionIndex.textContent = "01";
  els.questionType.textContent = "观察题";
  els.quizTitle.textContent = state.scenario.title;
  els.questionContext.textContent = state.scenario.context;
  els.scenarioActions.hidden = false;
  els.answerList.hidden = true;
  els.answerFooter.hidden = true;
  els.reroll.classList.toggle("is-used", state.rerollUsed);
  els.reroll.disabled = state.rerollUsed;
  els.reroll.innerHTML = state.rerollUsed ? "换题机会已用完 <span>（本轮仅 1 次）</span>" : "换个问题 <span>（仅 1 次）</span>";
}

function renderQuestionStage() {
  const question = state.questionQueue[state.questionIndex];
  const displayNumber = String(state.questionIndex + 2).padStart(2, "0");
  const totalQuestions = state.questionQueue.length + 1;
  const progress = Math.round(((state.questionIndex + 1) / totalQuestions) * 100);
  els.progressLabel.textContent = `第 ${state.questionIndex + 2} / ${totalQuestions} 题`;
  els.progressPercent.textContent = `${progress}%`;
  els.progressValue.style.width = `${progress}%`;
  els.questionIndex.textContent = displayNumber;
  els.questionType.textContent = question.type;
  const hydrate = (value) => value.replaceAll("{{phenomenon}}", state.scenario.label);
  els.quizTitle.textContent = hydrate(question.title);
  els.questionContext.textContent = hydrate(question.context);
  els.scenarioActions.hidden = true;
  els.answerFooter.hidden = false;
  els.answerList.hidden = false;
  els.next.disabled = true;
  els.selectionHint.textContent = "先选一个最像你的答案";
  state.selectedIndex = null;
  els.answerList.innerHTML = question.options.map((option, index) => `
    <button class="answer-option" type="button" data-answer-index="${index}">
      <span class="answer-letter">${String.fromCharCode(65 + index)}</span>
      <span class="answer-copy">${hydrate(option.text)}<small class="answer-note">${hydrate(option.note)}</small></span>
    </button>
  `).join("");
  els.answerList.querySelectorAll(".answer-option").forEach((button) => {
    button.addEventListener("click", () => selectAnswer(Number(button.dataset.answerIndex)));
  });
}

function selectAnswer(index) {
  state.selectedIndex = index;
  els.answerList.querySelectorAll(".answer-option").forEach((button, buttonIndex) => {
    button.classList.toggle("is-selected", index === buttonIndex);
  });
  els.next.disabled = false;
  els.selectionHint.textContent = "这个答案会写进你的科研人格档案";
}

function mergeAnswer(option) {
  Object.entries(option.scores).forEach(([metric, value]) => { state.metrics[metric] += value; });
  Object.entries(option.flags || {}).forEach(([flag, value]) => { state.flags[flag] += value; });
  state.answers.push(option);
}

function submitAnswer() {
  if (state.selectedIndex === null) return;
  const option = state.questionQueue[state.questionIndex].options[state.selectedIndex];
  mergeAnswer(option);
  if (state.questionIndex >= state.questionQueue.length - 1) {
    finishQuiz();
    return;
  }
  state.questionIndex += 1;
  renderQuestionStage();
}

function chooseScenario() {
  state.questionIndex = 0;
  const specialPool = specialQuestionPools[state.scenario.id] || [];
  const specialQuestions = shuffle(specialPool).slice(0, 2).map((question) => ({ ...question, source: "special" }));
  const publicQuestions = shuffle(publicQuestionPool).slice(0, 4).map((question) => ({ ...question, source: "public" }));
  state.questionQueue = [...specialQuestions, ...publicQuestions];
  renderQuestionStage();
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function rerollScenario() {
  if (state.rerollUsed) return;
  state.rerollUsed = true;
  const current = state.scenario.title;
  const available = scenarios.filter((item) => item.title !== current);
  state.scenario = available[Math.floor(Math.random() * available.length)];
  renderScenarioStage();
  showToast("已换题。科研机会只有一次，和投稿窗口一样。", 3000);
}

function getPersona() {
  const average = Object.values(state.metrics).reduce((sum, value) => sum + value, 0) / state.questionQueue.length;
  const score = Math.max(34, Math.min(98, Math.round(average)));
  let persona;
  if (state.flags.lazy >= 5 && state.flags.workaholic === 0) {
    persona = { name: "究极摆烂的科研观测员", badge: "☁", description: "你对导师压力、截止日期和显著性结果都保持一种平静的距离。别人卷实验，你研究如何不被实验研究。", comment: "你和科研之间，隔着一张非常舒服的躺椅。", tags: ["低耗能生存", "延毕免疫", "心态稳定"] };
  } else if (state.flags.workaholic >= 4 && state.flags.lazy === 0) {
    persona = { name: "实验室永动机·卷王", badge: "⚡", description: "你不需要闹钟，离心机的嗡嗡声就是你的晨曲。你把截止日期当作启动按钮，把休息当作一个待验证的假设。", comment: "你和睡眠之间，只差一篇补充材料。", tags: ["高强度运行", "实验室常住", "咖啡共同一作"] };
  } else if (score >= 86) {
    persona = { name: "冉冉升起的科研巨星", badge: "✦", description: "你能在荒诞现象里抓住问题，也愿意把灵感落成实验。导师嘴上说着“再想想”，心里已经开始给你排会议了。", comment: "你和“做出来”之间，只差一个截止日期。", tags: ["问题意识", "迭代能力", "抗压型选手"] };
  } else if (score >= 72) {
    persona = { name: "会把选题做成的人", badge: "↗", description: "你的想法不一定每次都能震动学界，但你知道怎样把一个荒诞问题拆成可执行的下一步。科研最稀缺的能力，可能就是这个。", comment: "你不一定先发 Nature，但很可能先把东西做出来。", tags: ["落地派", "稳中带新", "靠谱合作者"] };
  } else if (score >= 57) {
    persona = { name: "茶歇区的学术大拿", badge: "☕", description: "你在组会上拥有很好的气场，在茶歇区拥有更好的表达。只要把灵感及时写进文档，你的科研地图会更清晰。", comment: "你的创新点经常出现在第二杯咖啡之后。", tags: ["气氛组", "元问题", "灵感游牧"] };
  } else {
    persona = { name: "拉完了的科研狗屎", badge: "☄", description: "你不是没有潜力，只是今天的潜力正在排队，前面还有外卖、短视频和一场非常必要的午睡。", comment: "导师说再想想，你想的是晚饭吃什么。", tags: ["松弛感", "随机科研", "明日复明日"] };
  }
  return { ...persona, score };
}

function finishQuiz() {
  const persona = getPersona();
  const resultKey = persona.name;
  if (!state.stats.personas.includes(resultKey)) state.stats.personas.push(resultKey);
  state.stats.completions += 1;
  state.stats.unlockCount += 1;
  saveStats();
  renderResult(persona);
  showScreen("result");
}

function renderResult(persona) {
  document.querySelector("#resultBadge").textContent = persona.badge;
  document.querySelector("#resultTitle").textContent = persona.name;
  document.querySelector("#resultDescription").textContent = persona.description;
  document.querySelector("#scoreComment").textContent = persona.comment;
  document.querySelector("#overallScore").textContent = persona.score;
  document.querySelector("#resultRank").textContent = `NO. ${state.stats.unlockCount.toLocaleString("en-US")}`;
  document.querySelector("#resultUnlockNumber").textContent = `第 ${state.stats.unlockCount.toLocaleString("en-US")} 位`;
  document.querySelector("#resultTags").innerHTML = persona.tags.map((tag) => `<span class="result-tag">${tag}</span>`).join("");
  const degrees = Math.round(persona.score * 3.6);
  document.querySelector("#scoreRing").style.background = `conic-gradient(var(--blue) 0deg, var(--blue) ${degrees}deg, var(--paper-deep) ${degrees}deg)`;
  const max = state.questionQueue.length * 100;
  Object.entries(state.metrics).forEach(([metric, value]) => {
    const score = Math.round(value / max * 100);
    const row = document.querySelector(`[data-metric="${metric}"]`);
    row.querySelector("b").textContent = score;
    setTimeout(() => { row.querySelector("i").style.width = `${score}%`; }, 120);
  });
}

function updateStatsModal() {
  document.querySelector("#statViews").textContent = state.stats.views;
  document.querySelector("#statStarts").textContent = state.stats.starts;
  document.querySelector("#statCompletions").textContent = state.stats.completions;
  document.querySelector("#statPersonas").textContent = state.stats.personas.length;
}

function openStats() { updateStatsModal(); els.statsModal.hidden = false; }
function closeStats() { els.statsModal.hidden = true; }

function showToast(message, duration = 2400) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => els.toast.classList.remove("is-visible"), duration);
}

async function shareResult() {
  const title = "我测出了自己的科研人格";
  const text = `我在“科研潜力实验室”测出了「${document.querySelector("#resultTitle").textContent}」，综合科研指数 ${document.querySelector("#overallScore").textContent} 分。你敢来测吗？`;
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url: window.location.href });
      return;
    }
    await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
    showToast("结果文案和链接已复制，发给你的科研搭子吧！");
  } catch (error) {
    if (error?.name !== "AbortError") showToast("复制失败了，可以手动截图分享结果。", 3000);
  }
}

els.start.addEventListener("click", startQuiz);
els.how.addEventListener("click", () => showToast("选一个答案，看看你的科研人格会不会暴露。每次开始测试都有一次换题机会。", 4200));
els.brand.addEventListener("click", () => showScreen("landing"));
els.back.addEventListener("click", () => showScreen("landing"));
els.acceptScenario.addEventListener("click", chooseScenario);
els.reroll.addEventListener("click", rerollScenario);
els.next.addEventListener("click", submitAnswer);
els.restart.addEventListener("click", () => {
  startQuiz();
});
els.share.addEventListener("click", shareResult);
els.statsButtons.forEach((button) => button.addEventListener("click", openStats));
els.closeStats.addEventListener("click", closeStats);
els.statsModal.addEventListener("click", (event) => { if (event.target === els.statsModal) closeStats(); });
els.resetStats.addEventListener("click", () => {
  state.stats = { views: 0, starts: 0, completions: 0, personas: [], unlockCount: 2847 };
  saveStats();
  bootStats();
  updateStatsModal();
  showToast("本机演示统计已清除");
});
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeStats(); });

bootStats();
