# AI 简历筛选系统

基于 AI 的简历筛选与管理平台，支持简历自动解析、AI 智能评分、邮件群发、团队协作。

## 功能

### 1. 用户认证
- 邮箱注册/登录，JWT 双令牌机制
- GitHub OAuth 第三方登录
- 前后端双重路由守卫
- **前端**: `client/src/pages/login/Login.tsx` `client/src/pages/auth/GithubCallback.tsx` `client/src/components/login/` `client/src/store/Login.ts`
- **后端**: `server/src/routes/login.ts` `server/src/routes/auth.ts` `server/src/routes/github.ts` `server/src/routes/githubAuth.ts` `server/src/services/login/` `server/src/middleware/auth.ts`

### 2. 简历管理
- 支持 PDF / DOCX / DOC 上传，自动解析文本并提取姓名、邮箱、电话
- 通过 IMAP 连接邮箱，自动抓取简历附件入库
- 支持关键词搜索、评分筛选、日期范围筛选、状态筛选
- 待处理 / 通过 / 拒绝 状态管理，支持批量操作
- **前端**: `client/src/pages/resumes/` `client/src/components/resumes/` `client/src/api/resume.ts`
- **后端**: `server/src/routes/resume.ts` `server/src/services/resume/` `server/src/utils/uploadPaths.ts`

### 3. AI 智能筛选
- 7 维度评估：专业技能、项目经验、工作经历、教育背景、岗位匹配、沟通协作、在校经历
- 综合评分 0-100，支持通过/拒绝/待定建议
- 支持单份或批量筛选
- 兼容 OpenAI 格式和阿里云通义千问原生格式
- **前端**: `client/src/pages/aiscreening/aiscreening.tsx` `client/src/components/aiscreening/` `client/src/api/ai.ts`
- **后端**: `server/src/routes/setting.ts` `server/src/services/setting/ai.ts`
- **组件目录**:
  - `AiScreening.tsx` — 主组件：候选人列表 + 右侧详情 Drawer（评分圆环、雷达图、AI 推理）
  - `AiScreeningSettingsModal.tsx` — 岗位要求与 AI 配置弹窗
  - `AiReasoningContent.tsx` — AI 评估理由 Markdown 渲染
  - `PreFilterModal.tsx` — 预筛选条件弹窗（关键词、最低分、日期范围）
  - `DeleteResumeConfirmModal.tsx` — 删除简历二次确认弹窗
  - `ResumePreviewModal.tsx` — 简历文件预览弹窗
  - `screeningConstants.ts` — 状态元数据（颜色、标签、图标）
  - `matchDimensions.ts` — 7 维评分数据解析与雷达图数据转换
  - `preFilterUtils.ts` — 预筛选条件的默认值、空判断、序列化
  - `components/CandidateCard.tsx` — 候选人卡片视图
  - `components/FilterPanel.tsx` — 列表筛选与搜索面板
  - `components/ScreeningCandidateTable.tsx` — 候选人表格（含排序、选中、操作）
  - `components/StatsBar.tsx` — 筛选结果统计栏（各状态计数、平均分）

### 4. AI 面试题生成
- 根据简历内容生成定制化面试问题
- 覆盖项目经验、技术知识点、行为面试等类别
- 可指定题目数量（1-50），支持自定义考察重点
- 生成的面试题支持外部链接分享
- **前端**: `client/src/pages/interview/InterviewQuestions.tsx` `client/src/pages/share/ShareQuestion.tsx` `client/src/api/ai.ts`
- **后端**: `server/src/routes/setting.ts` `server/src/services/setting/ai.ts`

### 5. 邮件系统
- 自定义邮件模板，支持变量替换（`{{name}}`、`{{email}}`、`{{phone}}`）
- 通过 SMTP 批量群发，支持按状态筛选收件人
- 多邮箱 IMAP/SMTP 配置，授权码加密存储
- 发送统计（总发送量、今日/本月）
- **前端**: `client/src/pages/emails/EmailTemplates.tsx` `client/src/components/emails/` `client/src/api/email.ts` `client/src/api/email-template.ts`
- **后端**: `server/src/routes/emailTemplate.ts` `server/src/services/email/template.ts`

### 6. 筛选模板
- 保存常用的筛选条件组合
- 支持设置默认模板，删除时自动提升
- 支持模板复制
- **前端**: `client/src/pages/screeningtemplate/ScreeningTemplate.tsx` `client/src/api/screeningTemplate.ts`
- **后端**: `server/src/routes/screeningTemplate.ts`

### 7. 团队协作
- 创建团队、成员管理
- Owner / Admin / Member 三级角色权限
- 基于链接 + Token 的邀请系统，7 天有效期
- 申请 → 审批/拒绝流程
- 团队成员可共享查看简历数据
- **前端**: `client/src/pages/invite/InvitePage.tsx` `client/src/components/setting/team.tsx` `client/src/api/team.ts`
- **后端**: `server/src/routes/team.ts` `server/src/services/team/team.ts`

### 8. 仪表盘
- 统计概览（总数、各状态数、今日新增）
- 本周新增趋势
- 最近操作日志
- 完整的分页活动审计日志
- **前端**: `client/src/pages/dashboard/Dashboard.tsx` `client/src/pages/activities/Activities.tsx` `client/src/components/dashboard/` `client/src/api/dashboard.ts`
- **后端**: `server/src/routes/dashboard.ts` `server/src/services/dashboard/`

### 9. 个人设置
- 修改用户名、头像
- AI 供应商配置管理，API Key 加密存储
- 邮箱 IMAP/SMTP 配置管理
- 明/暗主题切换
- **前端**: `client/src/pages/settings/Settings.tsx` `client/src/components/setting/` `client/src/store/theme.ts`
- **后端**: `server/src/routes/setting.ts` `server/src/services/setting/` `server/src/utils/crypto.ts`
