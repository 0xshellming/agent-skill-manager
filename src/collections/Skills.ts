import { CollectionConfig } from 'payload'

export const Skills: CollectionConfig = {
  slug: 'skills',

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'author', 'crawlStatus', 'category', 'stars', 'updatedAt'],
    group: '内容管理',
  },

  versions: {
    drafts: true,
  },

  fields: [
    {
      name: 'crawlStatus',
      label: '抓取状态',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { label: '待抓取', value: 'pending' },
        { label: '抓取中', value: 'processing' },
        { label: '已完成', value: 'completed' },
        { label: '失败', value: 'failed' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'skillPath',
      label: '技能路径',
      type: 'text',
      required: true,
      admin: {
        description: '格式: owner/repo/path (用于抓取)',
      },
    },
    {
      name: 'branch',
      label: '分支',
      type: 'text',
      defaultValue: 'main',
    },
    {
      name: 'name',
      label: '名称',
      type: 'text',
      localized: true,
      admin: {
        description: '技能的显示名称',
      },
    },
    {
      name: 'slug',
      label: 'URL标识',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL友好的标识符',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.name) {
              return data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'description',
      label: '描述',
      type: 'textarea',
      localized: true,
      admin: {
        description: '简短描述 (用于SEO meta description)',
      },
    },
    {
      name: 'author',
      label: '作者',
      type: 'text',
      index: true,
      admin: {
        description: 'GitHub 用户名或组织名',
      },
    },
    {
      name: 'githubUrl',
      label: 'GitHub链接',
      type: 'text',
    },
    {
      name: 'sourceRepo',
      label: '源仓库',
      type: 'text',
      admin: {
        description: '格式: owner/repo',
      },
    },
    {
      name: 'stars',
      label: 'Star数',
      type: 'number',
      defaultValue: 0,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'category',
      label: '分类',
      type: 'select',
      index: true,
      options: [
        { label: '文档处理', value: 'document-processing' },
        { label: '开发工具', value: 'development' },
        { label: '数据分析', value: 'data-analysis' },
        { label: '商业营销', value: 'business-marketing' },
        { label: '沟通写作', value: 'communication' },
        { label: '创意媒体', value: 'creative-media' },
        { label: '效率工具', value: 'productivity' },
        { label: '安全工具', value: 'security' },
        { label: '其他', value: 'other' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      label: '标签',
      type: 'array',
      admin: {
        description: '搜索和筛选关键词',
      },
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'compatibility',
      label: '兼容平台',
      type: 'select',
      hasMany: true,
      defaultValue: ['claude'],
      options: [
        { label: 'Claude', value: 'claude' },
        { label: 'OpenAI Codex', value: 'openai' },
        { label: 'Cursor', value: 'cursor' },
        { label: '其他', value: 'other' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'useCases',
      label: '使用场景',
      type: 'array',
      localized: true,
      admin: {
        description: '什么时候使用这个技能',
      },
      fields: [
        {
          name: 'useCase',
          type: 'text',
        },
      ],
    },
    {
      name: 'prerequisites',
      label: '前置要求',
      type: 'array',
      admin: {
        description: '需要的工具或依赖',
      },
      fields: [
        {
          name: 'prerequisite',
          type: 'text',
        },
      ],
    },
    {
      name: 'installCommand',
      label: '安装命令',
      type: 'text',
      admin: {
        description: '例如: askm install author/skill',
      },
    },
    {
      name: 'rawSkillMd',
      label: '原始SKILL.md',
      type: 'textarea',
      admin: {
        description: 'SKILL.md 原始内容',
        condition: (data) => Boolean(data?.rawSkillMd),
      },
    },
  ],
}
