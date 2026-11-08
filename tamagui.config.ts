import { defaultConfig } from '@tamagui/config/v6'
import { createTamagui } from 'tamagui'

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    light: {
      ...defaultConfig.themes.light,
      background: '#FFFFFF',
      surface: '#F5F7FA',
      brand: '#2F6BFF',
      ink: '#050505',
      muted: '#65676B',
      line: '#CED0D4',
      danger: '#E41E3F',
    },
    dark: {
      ...defaultConfig.themes.dark,
      background: '#18191A',
      surface: '#242526',
      brand: '#2F6BFF', 
      ink: '#E4E6EB',
      muted: '#B0B3B8',
      line: '#3E4042',
      danger: '#FA383E',
    },
  },
})

export type AppConfig = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}