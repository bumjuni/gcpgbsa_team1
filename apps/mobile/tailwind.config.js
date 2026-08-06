/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
      './App.{js,jsx,ts,tsx}',
      './src/**/*.{js,jsx,ts,tsx}',
    ],
    presets: [require('nativewind/preset')],
    theme: {
      extend: {
        colors: {
          // 프로젝트 전용 커스텀 컬러 정의
          primary: {
            DEFAULT: '#0069C0',
            pressed: '#00559B',
            dark: '#4DA9F0',
            subtle: '#E8F2FC'
          },
          ink: {
            DEFAULT: '#16181C',
            on_primary: '#FFFFFF',
            secondary: '#5A6068',
            teriary: '#8B9198',
          },
          surface: {
            canvas: '#FFFFFF',
            muted: '#F4F6F8',
            hairline: '#E4E7EB',
            strong: '#C4C9D0',
          },
          status: {
            present: '#0E9F6E',
            absent: '#8B9198',
            warning: '#D97706',
            danger: '#DC2626',
            presnet_subtle: '#E6F6F0',
            warning_subtle: '#FEF3E2',
            danger_subtle: '#FDECEC',
          }
        },
        borderRadius: {
          none: '0px',
          sm: '8px',
          md: '12px',
          lg: '16px',
          xl: '24px',
          pill: 'pill',
        },
        spacing: {
          xxs: '4px',
          xs: '8px',
          sm: '12px',
          md: '16px',
          lg: '24px',
          xl: '32px',
          xxl: '48px',
        },
      },
    },
    plugins: [],
}
