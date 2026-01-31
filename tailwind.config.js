/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        extend: {
            colors: {
                // Brand Colors
                primary: {
                    50: '#eff8ff', // Extremely light sky blue
                    100: '#dbeafe', // Light background blue
                    200: '#a6b6c9', // <--- Your requested color (Muted Steel Blue)
                    300: '#7db1f4', // Soft blue
                    400: '#3ea1f1', // Bright blue
                    500: '#0c88ea', // Base/Default
                    600: '#006ed3', // Hover state
                    700: '#0057aa', // Deep blue
                    800: '#004a8f', // Dark blue
                    900: '#003e78', // Contrast/Text blue
                    950: '#002245', // Darkest navy
                },
                secondary: {
                    50: '#FFF9E6', // Lightest cream yellow
                    100: '#FFF0BF', // Pale lemon
                    200: '#FFE694', // Soft buttercup
                    300: '#FFDB66', // Light golden
                    400: '#FFD033', // Bright sunshine
                    500: '#EDA528', // Vibrant golden yellow (Base)
                    600: '#D18F00', // Deep gold
                    700: '#B87A00', // Rich amber
                    800: '#8F6000', // Dark honey
                    900: '#664400'  // Bronze brown
                },
                accent: {
                    50: '#000000',
                    100: '#000000',
                    200: '#000000',
                    300: '#000000',
                    400: '#000000',
                    500: '#000000',
                    600: '#000000',
                    700: '#000000',
                    800: '#000000',
                    900: '#000000'
                },
                // Semantic Colors
                success: {
                    50: '#E6FFF3', // Lightest mint
                    100: '#BFFFD9', // Pale mint green
                    200: '#94FFBF', // Soft mint
                    300: '#66FFA6', // Light spring green
                    400: '#33FF8C', // Bright green
                    500: '#00FF72', // Vibrant success green (Base)
                    600: '#00D95E', // Deep emerald
                    700: '#00B34D', // Rich green
                    800: '#008F3D', // Dark forest
                    900: '#006B2D'  // Deep pine
                },
                warning: {
                    50: '#FFF7E6', // Lightest cream
                    100: '#FFECBF', // Pale peach
                    200: '#FFE094', // Soft apricot
                    300: '#FFD466', // Light orange
                    400: '#FFC733', // Bright orange
                    500: '#FFB800', // Vibrant warning orange (Base)
                    600: '#D99A00', // Deep amber
                    700: '#B37F00', // Rich orange
                    800: '#8F6600', // Dark burnt orange
                    900: '#6B4C00'  // Deep brown
                },
                error: {
                    50: '#FFE6E6', // Lightest pink
                    100: '#FFBFBF', // Pale rose
                    200: '#FF9494', // Soft coral
                    300: '#FF6666', // Light red
                    400: '#FF3333', // Bright red
                    500: '#FF0000', // Vibrant error red (Base)
                    600: '#D90000', // Deep crimson
                    700: '#B30000', // Rich red
                    800: '#8F0000', // Dark maroon
                    900: '#6B0000'  // Deep burgundy
                },
                info: {
                    50: '#E6F7FF', // Lightest sky
                    100: '#BFEBFF', // Pale cyan
                    200: '#94DEFF', // Soft blue
                    300: '#66D1FF', // Light info blue
                    400: '#33C4FF', // Bright cyan
                    500: '#00B8FF', // Vibrant info blue (Base)
                    600: '#0099D9', // Deep azure
                    700: '#007DB3', // Rich blue
                    800: '#00638F', // Dark ocean
                    900: '#004A6B'  // Deep navy blue
                },
                app: '#090f15',
            },
            spacing: {
                '112': '28rem',
                '128': '32rem',
            },
            width: {
                '112': '28rem',
                '128': '32rem',
            }
        }
    },
    plugins: []
};
