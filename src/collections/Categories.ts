import { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',

  admin: {
    useAsTitle: 'name',
    group: '内容管理',
  },

  fields: [
    {
      name: 'name',
      label: '名称',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      label: 'URL标识',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'description',
      label: '描述',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'icon',
      label: '图标',
      type: 'text',
      admin: {
        description: 'Emoji 或图标标识符',
      },
    },
    {
      name: 'order',
      label: '排序',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: '显示顺序 (小的在前)',
      },
    },
  ],
}
