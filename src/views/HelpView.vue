<template>
  <div class="help-page">
    <header class="help-header">
      <h1>帮助中心</h1>
      <p>关于 WildCard 的常见问题与玩法说明。深入主题请查看完整教程文档站。</p>
    </header>

    <section class="docs-hero">
      <div class="docs-hero-text">
        <h2>完整教程文档</h2>
        <p>规则引擎构建、组件参考、对局接口说明、示例规则 walkthrough，都在文档站。</p>
        <a
          class="docs-hero-link"
          :href="DOCS_BASE_URL"
          target="_blank"
          rel="noopener noreferrer"
        >前往 WildCard 文档站 →</a>
      </div>
      <div class="docs-quick-links">
        <a
          v-for="link in QUICK_LINKS"
          :key="link.href"
          class="docs-quick-link"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="docs-quick-link-title">{{ link.title }}</div>
          <div class="docs-quick-link-desc">{{ link.description }}</div>
        </a>
      </div>
    </section>

    <section class="faq-section">
      <h2>账号与登录</h2>
      <div class="faq-item">
        <h3>如何注册？</h3>
        <p>左侧导航点「用户中心」→「立即注册」，填写邮箱、用户名、密码、邮箱验证码即可。</p>
      </div>
      <div class="faq-item">
        <h3>验证码收不到？</h3>
        <p>请先检查垃圾邮件箱。若仍未收到，30 秒后重新发送，或换一个邮箱重试。</p>
      </div>
      <div class="faq-item">
        <h3>头像上传后显示破损？</h3>
        <p>请刷新页面（Ctrl+Shift+R）再次查看。若仍异常，重新上传一次。</p>
      </div>
    </section>

    <section class="faq-section">
      <h2>规则市场</h2>
      <div class="faq-item">
        <h3>规则市场里都有什么？</h3>
        <p>有 WildCard 内置的若干预设规则（War 拼点战争、99 累加、大老二极简版、21 点伪版等），也有玩家自己用规则构建器创作的规则。</p>
      </div>
      <div class="faq-item">
        <h3>什么是 Fork？</h3>
        <p>在规则详情页或市场卡片上点「Fork」按钮，会把该规则克隆为你的草稿并跳转到创作中心，你可以在画布上任意修改。原规则不受影响。</p>
      </div>
      <div class="faq-item">
        <h3>怎么给规则评分 / 评价？</h3>
        <p>进入规则详情页，下方有评分和评论区。同一用户对同一规则只保留最近一次评价（重复提交会覆盖）。</p>
      </div>
    </section>

    <section class="faq-section">
      <h2>规则创作</h2>
      <div class="faq-item">
        <h3>规则构建器怎么用？</h3>
        <p>左侧导航「创作中心」→「新建规则」即可进入可视化画布。详细教程请看文档站的<a :href="`${DOCS_BASE_URL}tutorials/rule-builder-overview/`" target="_blank" rel="noopener noreferrer">规则构建总览</a>。</p>
      </div>
      <div class="faq-item">
        <h3>草稿和发布的区别？</h3>
        <p>草稿只有自己能看到；发布后会进入规则市场，所有用户都可以使用、评论、Fork。</p>
      </div>
      <div class="faq-item">
        <h3>能不能导入已有规则的 JSON？</h3>
        <p>可以。在创作中心点「导入 JSON」按钮，粘贴规则 JSON 即可解析为画布组件。这是 Fork 之外另一种二次创作的入口。</p>
      </div>
    </section>

    <section class="faq-section">
      <h2>对局与房间</h2>
      <div class="faq-item">
        <h3>怎么和朋友一起玩？</h3>
        <p>在「创建房间」选择规则后会得到一个 6 位房间号，把房间号发给朋友，对方在「加入房间」输入即可。</p>
      </div>
      <div class="faq-item">
        <h3>对局期间断线了？</h3>
        <p>对局状态保存在服务器，刷新或重连后访问同一房间号即可恢复。</p>
      </div>
    </section>

    <section class="faq-section">
      <h2>反馈与建议</h2>
      <div class="faq-item">
        <h3>遇到 Bug 怎么办？</h3>
        <p>请到「联系我们」找开发者反馈，或者在 <a href="https://github.com/BUAA-ISET" target="_blank" rel="noopener noreferrer">GitHub 仓库</a> 提交 issue。我们会尽快处理。</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const DOCS_BASE_URL = 'https://buaa-iset.github.io/WildCard_Docs/'

const QUICK_LINKS = [
  {
    title: '规则构建总览',
    description: '从零开始理解规则引擎的核心抽象与画布编辑流程',
    href: `${DOCS_BASE_URL}tutorials/rule-builder-overview/`,
  },
  {
    title: '最小示例',
    description: '一步步搭出一个可玩的最小规则，理解流程图基本骨架',
    href: `${DOCS_BASE_URL}tutorials/example-minimal/`,
  },
  {
    title: '组件参考',
    description: '所有可用组件（共 28 种）的语义、字段、典型用法',
    href: `${DOCS_BASE_URL}reference/components/`,
  },
  {
    title: '常见坑',
    description: '搭规则时经常踩的坑：死循环、未连线节点、缺少 next…',
    href: `${DOCS_BASE_URL}reference/pitfalls/`,
  },
]
</script>

<style scoped>
.help-page {
  max-width: 920px;
  margin: 0 auto;
  padding: 32px 28px 64px;
  color: #252633;
  text-align: left;
}

.help-header {
  padding-bottom: 24px;
  border-bottom: 1px solid #e6e8f0;
  margin-bottom: 24px;
}

.help-header h1 {
  margin: 0 0 8px;
  font-size: 30px;
  letter-spacing: 0;
}

.help-header p {
  margin: 0;
  color: #687083;
  font-size: 15px;
}

.docs-hero {
  display: grid;
  grid-template-columns: minmax(260px, 320px) 1fr;
  gap: 24px;
  padding: 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ece6fa, #e6f0ff);
  margin-bottom: 36px;
}

.docs-hero-text h2 {
  margin: 0 0 10px;
  font-size: 20px;
  color: #3a2a8f;
}

.docs-hero-text p {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.65;
  color: #515770;
}

.docs-hero-link {
  display: inline-block;
  padding: 9px 18px;
  border-radius: 8px;
  background: #4a3aa3;
  color: #fff;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s;
}

.docs-hero-link:hover {
  background: #382a82;
}

.docs-quick-links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.docs-quick-link {
  display: block;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(74, 58, 163, 0.15);
  border-radius: 8px;
  color: inherit;
  text-decoration: none;
  transition: background 0.15s, transform 0.12s;
}

.docs-quick-link:hover {
  background: #fff;
  transform: translateY(-1px);
}

.docs-quick-link-title {
  font-size: 14.5px;
  font-weight: 600;
  color: #3a2a8f;
  margin-bottom: 4px;
}

.docs-quick-link-desc {
  font-size: 12.5px;
  color: #687083;
  line-height: 1.5;
}

.faq-section {
  margin-bottom: 32px;
}

.faq-section h2 {
  font-size: 20px;
  margin: 0 0 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid #ece6fa;
  color: #4a3aa3;
}

.faq-item {
  padding: 14px 16px;
  border: 1px solid #eef0f6;
  border-radius: 8px;
  margin-bottom: 10px;
  background: #fff;
  transition: box-shadow 0.18s;
}

.faq-item:hover {
  box-shadow: 0 4px 12px rgba(82, 96, 162, 0.08);
}

.faq-item h3 {
  margin: 0 0 6px;
  font-size: 16px;
  color: #252633;
}

.faq-item p {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.65;
  color: #515770;
}

.faq-item a {
  color: #4a3aa3;
  text-decoration: none;
  font-weight: 500;
}

.faq-item a:hover {
  text-decoration: underline;
}

@media (max-width: 720px) {
  .docs-hero {
    grid-template-columns: 1fr;
  }

  .docs-quick-links {
    grid-template-columns: 1fr;
  }
}
</style>
