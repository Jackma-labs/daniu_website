import Link from "next/link";
import styles from "./console.module.css";

export const metadata = {
  title: "登录控制台 | 大牛",
  description: "大牛专家资产控制台登录入口。",
};

export default function ConsolePage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link className={styles.brand} href="/">
          <span>牛</span>
          <strong>大牛控制台</strong>
        </Link>
        <div className={styles.copy}>
          <p>企业专家资产控制台</p>
          <h1>管理你的企业大牛</h1>
          <span>知识采集、权限审计、问答测试和设备状态将在这里统一管理。</span>
        </div>
        <form className={styles.form}>
          <label>
            企业账号
            <input type="text" placeholder="请输入企业账号" />
          </label>
          <label>
            管理员密码
            <input type="password" placeholder="请输入密码" />
          </label>
          <button type="button">登录控制台</button>
        </form>
        <Link className={styles.backLink} href="/">返回官网</Link>
      </section>
    </main>
  );
}
