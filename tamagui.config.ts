import { defaultConfig } from '@tamagui/config/v6'
import { createTamagui } from 'tamagui'

export const tamaguiConfig = createTamagui({
    ...defaultConfig,
    themes: {
        ...defaultConfig.themes,
        light: {
            ...defaultConfig.themes.light,
            brand: '#0084FF',
            ink: '#050505',
            muted: '#65676B',
            line: '#CED0D4',
            danger: '#E41E3F',
        },
    },
})