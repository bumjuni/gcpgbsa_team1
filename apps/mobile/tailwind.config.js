/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
      './App.{js,jsx,ts,tsx}',
      './src/**/*.{js,jsx,ts,tsx}',
    ],
    presets: [require('nativewind/preset')],
    theme: {
      extend: {
        // Typography
        fontSize: {
          'display': ['32px', { lineHeight: '125%', fontWeight: '700' }],
          'title-lg': ['24px', { lineHeight: '130%', fontWeight: '700' }],
          'title-md': ['20px', { lineHeight: '135%', fontWeight: '600' }],
          'title-sm': ['17px', { lineHeight: '140%', fontWeight: '600' }],
          'body': ['16px', { lineHeight: '160%', fontWeight: '400' }],
          'body-strong': ['16px', { lineHeight: '160%', fontWeight: '600' }],
          'metric': ['28px', { lineHeight: '110%', fontWeight: '700' }],
          'metric-unit': ['14px', { lineHeight: '110%', fontWeight: '500' }],
          'caption': ['14px', { lineHeight: '150%', fontWeight: '400' }],
          'caption-strong': ['14px', { lineHeight: '150%', fontWeight: '600' }],
          'button': ['17px', { lineHeight: '100%', fontWeight: '600' }],
          'button-sm': ['15px', { lineHeight: '100%', fontWeight: '600' }],
          'label': ['13px', { lineHeight: '140%', fontWeight: '500' }],
          'legal': ['12px', { lineHeight: '150%', fontWeight: '400' }],
        },

        // Colors
        colors: {
          primary: {
            DEFAULT: '#0069C0',
            pressed: '#00559B',
            'on-dark': '#4DA9F0',
            subtle: '#E8F2FC'
          },
          ink: {
            DEFAULT: '#16181C',
            'on-primary': '#FFFFFF',
            secondary: '#5A6068',
            tertiary: '#8B9198',
          },
          canvas: {
            DEFAULT: '#FFFFFF',
            muted: '#F4F6F8',
          },
          hairline: {
            DEFAULT: '#E4E7EB',
            'border-strong': '#C4C9D0',
          },
          status: {
            present: '#0E9F6E',
            'present-subtle': '#E6F6F0',
            absent: '#8B9198',
            warning: '#D97706',
            'warning-subtle': '#FEF3E2',
            danger: '#DC2626',
            'danger-subtle': '#FDECEC',
          }
        },

        // Rounded
        borderRadius: {
          none: '0px',
          sm: '8px',
          md: '12px',
          lg: '16px',
          xl: '24px',
          pill: 'pill',
        },

        // Spacing
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
