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
          primary: '#0B72E7',
          'primary-light': '#E8F2FF',
          danger: '#FF5A5F',
          badge: '#9A9A9A',
        },
      },
    },
    plugins: [],
}
