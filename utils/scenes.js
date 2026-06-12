const sceneGroups = [
  {
    group: "日常高频",
    options: [
      { name: "上班", formality: 4, styles: ["通勤", "极简", "Clean Fit"], avoid: ["运动裤"], note: "通勤穿得体，正式不呆板" },
      { name: "上学", formality: 2, styles: ["学院风", "运动休闲", "基础款"], avoid: ["晚宴"], note: "上学舒适耐看，活动起来也轻松" },
      { name: "居家", formality: 1, styles: ["基础款", "运动休闲"], avoid: ["西装"], note: "居家以舒适为先，放松不邋遢" },
      { name: "运动", formality: 1, styles: ["运动休闲", "户外机能"], avoid: ["皮鞋"], note: "运动场景轻便透气，行动更自在" }
    ]
  },
  {
    group: "社交约会",
    options: [
      { name: "约会", formality: 3, styles: ["法式", "甜酷", "极简"], avoid: ["运动裤"], note: "约会氛围轻松，精致但不过度用力" },
      { name: "聚会", formality: 3, styles: ["街头", "复古", "甜酷"], avoid: ["居家"], note: "聚会需要一点记忆点，整体更有存在感" },
      { name: "见家长", formality: 4, styles: ["通勤", "学院风", "Quiet Luxury"], avoid: ["露肤", "破洞"], note: "见家长端庄清爽，亲和又得体" },
      { name: "逛街", formality: 2, styles: ["街头", "运动休闲", "Clean Fit"], avoid: ["高跟鞋"], note: "逛街强调舒适和耐走，拍照也不单调" }
    ]
  },
  {
    group: "特殊场合",
    options: [
      { name: "婚礼", formality: 5, styles: ["法式", "Quiet Luxury", "新中式"], avoid: ["全黑"], note: "婚礼场合优雅克制，避免喧宾夺主" },
      { name: "面试", formality: 5, styles: ["通勤", "极简", "Quiet Luxury"], avoid: ["夸张", "运动"], note: "面试需要干净利落，专业感更稳定" },
      { name: "旅行", formality: 2, styles: ["户外机能", "运动休闲", "基础款"], avoid: ["难打理"], note: "旅行优先轻便耐穿，兼顾拍照效果" },
      { name: "晚宴", formality: 5, styles: ["Quiet Luxury", "法式", "复古"], avoid: ["运动鞋"], note: "晚宴保持精致质感，轮廓更利落" }
    ]
  }
];

const quickScenes = ["上班", "约会", "休闲", "运动"];
const casualScene = { name: "休闲", formality: 2, styles: ["基础款", "Clean Fit", "运动休闲"], avoid: [], note: "休闲场景自然松弛，干净不费力" };

function allScenes() {
  const scenes = sceneGroups.flatMap((group) => group.options);
  return scenes.concat(casualScene).filter((scene, index, list) => list.findIndex((item) => item.name === scene.name) === index);
}

function getScene(name) {
  return allScenes().find((scene) => scene.name === name) || casualScene;
}

function getDefaultSceneName(date) {
  const current = date || new Date();
  const day = current.getDay();
  const hour = current.getHours();
  if (day === 0 || day === 6) return "休闲";
  if (hour >= 8 && hour <= 10) return "上班";
  return "休闲";
}

module.exports = {
  sceneGroups,
  quickScenes,
  getScene,
  getDefaultSceneName
};
