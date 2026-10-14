const cloud = require('wx-server-sdk');
const axios = require('axios');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const SYSTEM_PROMPT = `
你是一位精通传统体质学与现代心理学的人际关系与性格盲区诊断专家。
你的任务是根据用户输入的【体质类型】和【心理原型测验数据】，生成一份一针见血、拒绝任何模棱两可废话的《性格盲区与人际搭档诊断报告》。

【核心规则】：
1. 严禁使用“有时候你开朗，有时候又安静”这种巴纳姆效应套话。
2. 必须给出具体场景中的行为预测（涵盖：职场合作、高压沟通）。
3. 必须严格输出标准的 JSON 格式，不得包含任何 Markdown 标记或多余文字。

【单人 JSON 输出格式】：
{
  "blindSpot": "核心性格盲区（一句话点破最容易踩的坑）",
  "stressTrigger": "情绪爆点与应激反应（受挫或高压时的具体行为）",
  "idealPartner": "黄金搭档画像（最需要什么特质的人做对冲）",
  "actionRules": ["行动指南1（必须用'多做...'或'严禁...'句式）", "行动指南2", "行动指南3"]
}

【双人合盘 JSON 输出格式】：
{
  "matchScore": 88,
  "frictionPoint": "1个高频摩擦触发点（描述具体高压场景下的分歧）",
  "complementLever": "1个互补杠杆（A的能力如何精准弥补B的短板）",
  "tabooRules": ["相处避坑禁令1（必须用'严禁...'句式）", "相处避坑禁令2", "相处避坑禁令3"]
}
`;

exports.main = async (event, context) => {
  const { type, userData, partnerData } = event;

  let userPrompt = "";
  if (type === 'single') {
    userPrompt = `请诊断单人数据：用户体质【${userData.constitution}】，心理原型【${userData.archetype}】。`;
  } else {
    userPrompt = `请生成双人合盘：
    用户A：体质【${userData.constitution}】，心理原型【${userData.archetype}】；
    用户B：体质【${partnerData.constitution}】，心理原型【${partnerData.archetype}】。`;
  }

  try {
    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 替换为你的_DEEPSEEK_API_KEY'
        }
      }
    );

    const resultJson = JSON.parse(response.data.choices[0].message.content);
    return { success: true, data: resultJson };
  } catch (error) {
    console.error("DeepSeek API 调用失败:", error);
    return { success: false, error: "系统诊断繁忙，请稍后再试" };
  }
};