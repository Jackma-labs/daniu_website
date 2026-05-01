export const memoryCategories = [
  {
    slug: "product",
    title: "产品资料",
    count: "328",
    unit: "条",
    meta: "常被引用 126 次",
    level: "92%",
    description: "产品参数、型号差异、安装要求和推荐场景，是销售、售后和交付最常用的基础能力。",
    focus: ["型号参数", "安装要求", "推荐场景", "交付边界"],
  },
  {
    slug: "after-sales",
    title: "售后案例",
    count: "512",
    unit: "条",
    meta: "还有 9 个问题待学习",
    level: "86%",
    description: "沉淀故障现象、排查路径、处理结果和复盘结论，让新售后也能按老师傅的方法处理问题。",
    focus: ["故障现象", "排查路径", "处理方案", "复盘结论"],
  },
  {
    slug: "pricing",
    title: "报价规则",
    count: "86",
    unit: "条",
    meta: "建议本周更新",
    level: "74%",
    description: "整理渠道保护、折扣审批、非标服务和项目报价边界，降低销售报价的随意性。",
    focus: ["折扣审批", "渠道保护", "非标条款", "服务范围"],
  },
  {
    slug: "projects",
    title: "项目方案",
    count: "147",
    unit: "条",
    meta: "最近更新 2 天前",
    level: "81%",
    description: "复用过往项目的需求、方案、交付和验收经验，把项目经验从个人脑子里留到企业资产库。",
    focus: ["客户需求", "技术方案", "交付计划", "验收经验"],
  },
  {
    slug: "rules",
    title: "公司制度",
    count: "72",
    unit: "条",
    meta: "命中率 91%",
    level: "91%",
    description: "把内部制度、流程、权限和审批规范沉淀下来，让大牛回答时知道企业自己的规则。",
    focus: ["流程规范", "权限边界", "审批要求", "操作标准"],
  },
  {
    slug: "experts",
    title: "专家访谈",
    count: "39",
    unit: "条",
    meta: "来自 4 位专家",
    level: "69%",
    description: "将专家、大牛和老师傅的访谈内容整理成可检索、可复用、可训练的企业经验。",
    focus: ["专家判断", "隐性经验", "关键口径", "训练样本"],
  },
] as const;

export type MemoryCategory = (typeof memoryCategories)[number];

export function getMemoryCategory(slug: string) {
  return memoryCategories.find((category) => category.slug === slug);
}
