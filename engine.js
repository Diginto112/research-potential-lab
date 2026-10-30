import { scenarios, specialQuestionPools, publicQuestionPool, allQuestions } from "./questions.js";

export const strategies = {
  rigorous: { name: "严谨求证", scores: [88, 84, 93, 85] },
  spark: { name: "抽象脑洞", scores: [98, 92, 38, 78] },
  slacker: { name: "松弛摆烂", scores: [22, 30, 36, 96] },
  grind: { name: "极限爆肝", scores: [65, 75, 86, 61] }
};
export const metricNames = ["innovation", "frontier", "feasibility", "resilience"];
export const personas = {
  rigorous: { name: "冉冉升起的科研巨星", badge: "✦", description: "离谱的选题到了你手里，也能长出对照组、记录表和证据链。你知道‘听起来很新’和‘确实有用’之间，还差一套经得起追问的实验。", comment: "你的超能力：把一地鸡毛整理成可复现的方法。", tags: ["证据链完整", "靠谱合作者", "先验证再吹"] },
  spark: { name: "脑洞过载的课题发明家", badge: "✧", description: "别人看到一只鸽子，你看到三个跨学科方向；导师刚问为什么，你已经给新领域起好了名字。你敢把日常现象拧成离谱选题，也愿意拽回一点现实，让想法有机会落地。", comment: "选题已经跑出实验室，方法还在穿鞋。", tags: ["万物皆可选题", "脑洞先行", "方法追赶中"] },
  slacker: { name: "带薪观测型科研咸鱼", badge: "☁", description: "你会观察天色、观察饭点，也会顺便观察研究对象。进度可以慢一点，生活不能完全消失。论文暂时没长大，但你至少把自己养活了。", comment: "你相信最好的科研工具里，应该有一张舒服的床。", tags: ["低耗能科研", "边界感", "下班积极"] },
  grind: { name: "截止日期的人形代打", badge: "↗", description: "导师刚提需求，你已经开始建文件夹。你擅长把‘可能来不及’压缩成‘我今晚试试’，论文的每个附录里都藏着你的周末。", comment: "论文在推进，你的睡眠在持续修回。", tags: ["补位王", "行动派", "自带充电线"] },
  mixed: { name: "中规中矩的科研牛马", badge: "⇄", description: "你在严谨、抽象、摆烂和爆肝之间灵活切换：该做时做，该躺时躺，偶尔用一句逆天发言唤醒组会。没有哪一派能完全代表你，科研生活的复杂性都在你身上了。", comment: "各项天赋势均力敌，上班状态随机刷新。", tags: ["混合型选手", "状态切换", "适应性生存"] },
  hiddenSlacker: { name: "究极摆烂·导师压力绝缘体", badge: "☾", hidden: true, description: "导师压力经过你时自动接地，截止日期在你面前失去威严。你的精神状态像一张永远不签收的催稿通知，科研路线则稳定通向奶茶店和床。", comment: "别人等待显著性，你等待外卖敲门。", tags: ["隐藏人格", "压力自动接地", "延毕也不慌"] },
  hiddenGrind: { name: "实验室永动机·究极卷王", badge: "⚡", hidden: true, description: "实验室门禁已经把你识别成固定设施，你的共同作者是咖啡、睡袋和从未休息的风扇。别人来实验室打卡，你来实验室续租。", comment: "建议把‘休息’也排进任务表，给自己留一个充电位。", tags: ["隐藏人格", "高功率运行", "工位常住人口"] },
  hiddenSpark: { name: "学术物种·不可被同行理解", badge: "✳", hidden: true, description: "你已不满足于跨学科，准备让学科跨着你跑。同行不是不认可，他们还在确认你究竟属于哪个宇宙，研究对象则正在申请更换研究者。", comment: "你已经超越研究前沿，进入研究结界。", tags: ["隐藏人格", "常识已离线", "学科边界失效"] }
};

export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildRun(scenarioId, random = Math.random) {
  if (!scenarios.some((s) => s.id === scenarioId)) throw new Error("Unknown scenario");
  const special = shuffle(specialQuestionPools[scenarioId], random).slice(0, 2);
  const common = shuffle(publicQuestionPool, random).slice(0, 4);
  return [...special, ...common].map((q, i) => ({
    ...q, source: i < 2 ? "special" : "public",
    options: shuffle(Object.entries(q.pools).map(([strategy, pool]) => ({
      ...pool[Math.floor(random() * pool.length)], strategy, questionId: q.id
    })), random)
  }));
}

// Derived only from canonical question IDs and strategy IDs, never display position or random text.
export function evaluate(answers) {
  if (answers.length !== 6 || new Set(answers.map((a) => a.questionId)).size !== 6) throw new Error("Six distinct answers required");
  const counts = Object.fromEntries(Object.keys(strategies).map((key) => [key, 0]));
  const totals = [0, 0, 0, 0];
  for (const answer of answers) {
    const q = allQuestions.find((item) => item.id === answer.questionId);
    if (!q?.pools[answer.strategy] || !strategies[answer.strategy]) throw new Error("Invalid answer");
    counts[answer.strategy] += 1;
    strategies[answer.strategy].scores.forEach((score, i) => { totals[i] += score; });
  }
  const points = Object.fromEntries(Object.entries(counts).map(([key, count]) => [key, count * 3]));
  const ranking = Object.entries(points).sort((a, b) => b[1] - a[1]);
  const leaders = ranking.filter(([, value]) => value === ranking[0][1]).map(([key]) => key);
  // A broad three-way tie is mixed; a two-way tie follows the player's most recent
  // choice among those leaders. Never use option position, fixed ID order, or chance.
  let id = leaders.length >= 3 ? "mixed" : answers.findLast((answer) => leaders.includes(answer.strategy)).strategy;
  if (counts.slacker >= 5) id = "hiddenSlacker";
  else if (counts.grind >= 5) id = "hiddenGrind";
  else if (counts.spark >= 5) id = "hiddenSpark";
  const metrics = Object.fromEntries(metricNames.map((key, i) => [key, Math.round(totals[i] / answers.length)]));
  const score = Math.round(totals.reduce((sum, value) => sum + value, 0) / (answers.length * metricNames.length));
  return { id, ...personas[id], metrics, score, points, counts, ranking };
}

export function validateSubmission(scenarioId, answers) {
  if (!scenarios.some((s) => s.id === scenarioId) || !Array.isArray(answers)) throw new Error("Invalid run");
  const specialIds = new Set(specialQuestionPools[scenarioId].map((q) => q.id));
  const publicIds = new Set(publicQuestionPool.map((q) => q.id));
  if (answers.filter((a) => specialIds.has(a.questionId)).length !== 2 || answers.filter((a) => publicIds.has(a.questionId)).length !== 4) throw new Error("Invalid question mix");
  return evaluate(answers);
}
