import Image from "next/image";
import styles from "./page.module.css";

const values = [
  ["训练企业专属模型", "用企业资料、专家访谈、历史案例，训练更懂你业务的大牛模型。"],
  ["接入企业知识库", "RAG 调用文档、制度、案例、图纸和 FAQ，回答有依据。"],
  ["部署在企业本地", "模型、知识库、权限和日志都在本地，核心数据不出门。"],
];

const deliverables = ["大牛一体机", "企业专属模型", "RAG 知识库", "专家经验采集", "员工问答入口", "权限与审计后台"];
const scenes = ["老师傅经验沉淀", "售后排障", "销售报价", "方案标书", "新人培训", "制度问答"];
const steps = ["业务盘点", "资料整理", "专家访谈", "模型训练", "本地部署", "持续优化"];
const plans = [["试点版", "3-8 万", "先跑通一个高价值场景"], ["标准版", "8-20 万", "训练企业专属大牛并正式上线"], ["行业版", "20 万起", "按行业流程深度共建"]];

export default function Home() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <a href="#top" className={styles.logoLink} aria-label="大牛首页">
          <Image src="/brand/daniu-logo.svg" alt="大牛" width={132} height={43} priority />
        </a>
        <div className={styles.navLinks}>
          <a href="#value">产品</a>
          <a href="#deliver">交付</a>
          <a href="#plans">价格</a>
          <a href="#contact">联系</a>
        </div>
        <a className={styles.navButton} href="#contact">预约评估</a>
      </nav>

      <section className={styles.hero} id="top">
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>企业专属大模型一体机</p>
          <h1>把企业里的老师傅，训练成随时可问的大牛</h1>
          <p>算法团队为企业训练专属模型，叠加 RAG 企业知识库，本地部署到公司内部。让模型真正懂你的产品、流程和经验。</p>
          <div className={styles.actions}>
            <a className={styles.primaryButton} href="#contact">预约一次企业评估</a>
            <a className={styles.secondaryButton} href="#value">看看怎么做</a>
          </div>
        </div>
        <div className={styles.heroImageWrap}>
          <Image src="/brand/hero-appliance.png" alt="大牛企业专属大模型一体机" width={1200} height={900} priority />
        </div>
      </section>

      <section className={styles.valueSection} id="value">
        <div className={styles.sectionTitle}>
          <p className={styles.kicker}>不是套壳，不是普通知识库</p>
          <h2>大牛交付的是一套企业 AI 能力</h2>
        </div>
        <div className={styles.valueGrid}>
          {values.map(([title, text]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.imageStatement}>
        <Image src="/brand/expert-workshop.png" alt="企业专家访谈和经验采集" width={1200} height={800} />
        <div>
          <p className={styles.kicker}>先把经验拿回来</p>
          <h2>很多企业的问题，不是没有知识，而是知识不在公司手里</h2>
          <p>大牛会把专家、业务骨干、合作方和历史项目里的经验收集起来，变成企业自己的模型能力和知识资产。</p>
        </div>
      </section>

      <section className={styles.deliverSection} id="deliver">
        <div className={styles.sectionTitle}>
          <p className={styles.kicker}>最终交付</p>
          <h2>看得见，也能用起来</h2>
        </div>
        <div className={styles.deliverLayout}>
          <div className={styles.deliverList}>{deliverables.map((item) => <span key={item}>{item}</span>)}</div>
          <Image src="/brand/console-dashboard.png" alt="大牛控制台" width={1000} height={700} />
        </div>
      </section>

      <section className={styles.darkSection}>
        <div className={styles.sectionTitleDark}>
          <p className={styles.kicker}>适合先落地的场景</p>
          <h2>从最值钱、最依赖人的地方开始</h2>
        </div>
        <div className={styles.sceneGrid}>{scenes.map((item) => <span key={item}>{item}</span>)}</div>
      </section>

      <section className={styles.flowSection}>
        <div className={styles.sectionTitle}>
          <p className={styles.kicker}>交付流程</p>
          <h2>不是卖设备，是陪企业把大牛训练出来</h2>
        </div>
        <div className={styles.flowGrid}>{steps.map((item, index) => <div key={item}><small>{String(index + 1).padStart(2, "0")}</small><strong>{item}</strong></div>)}</div>
      </section>

      <section className={styles.plansSection} id="plans">
        <div className={styles.sectionTitle}>
          <p className={styles.kicker}>价格和服务</p>
          <h2>先试点，再扩展</h2>
        </div>
        <div className={styles.planGrid}>{plans.map(([name, price, desc]) => <article key={name}><span>{name}</span><strong>{price}</strong><p>{desc}</p></article>)}</div>
      </section>

      <section className={styles.contactSection} id="contact">
        <div>
          <p className={styles.kicker}>先做一次评估</p>
          <h2>看看你的企业，适合训练什么样的大牛</h2>
          <p>我们会根据资料情况、专家经验、业务场景和部署要求，给出第一期落地建议。</p>
        </div>
        <a className={styles.primaryButton} href="mailto:hello@daniu.ai?subject=预约大牛企业评估">预约企业评估</a>
      </section>

      <footer className={styles.footer}>
        <Image src="/brand/daniu-logo.svg" alt="大牛" width={118} height={39} />
        <p>专属模型训练 + RAG 知识增强 + 本地部署</p>
      </footer>
    </main>
  );
}
