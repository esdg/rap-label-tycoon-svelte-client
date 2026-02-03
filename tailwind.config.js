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
                    200: '#a6b6c9', // Muted Steel Blue
                    300: '#7db1f4', // Soft blue
                    400: '#3ea1f1', // Bright blue
                    500: '#0c88ea', // Base/Default
                    600: '#006ed3', // Hover state
                    700: '#0057aa', // Deep blue
                    800: '#004a8f', // Dark blue
                    900: '#003e78', // Contrast/Text blue
                    950: '#090f15', // Darkest navy
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
                category: {
                    1: {
                        50: '#FCE6FF', // Lightest lavender
                        100: '#F7BFFF', // Pale orchid
                        200: '#F194FF', // Soft lilac
                        300: '#EB66FF', // Light magenta
                        400: '#E533FF', // Bright violet
                        500: '#AC26DE', // Vibrant purple (Base)
                        600: '#8F20B8', // Rich purple
                        700: '#731A93', // Deep violet
                        800: '#58146F', // Dark plum
                        900: '#3D0E4C'  // Darkest purple
                    },
                    2: {
                        50: '#FFE6F2', // Lightest rose
                        100: '#FFBFE0', // Pale pink
                        200: '#FF94CE', // Soft magenta
                        300: '#FF66BC', // Light pink
                        400: '#FF33AA', // Bright fuchsia
                        500: '#C20D51', // Vibrant magenta (Base)
                        600: '#A30B44', // Deep rose
                        700: '#850937', // Rich crimson
                        800: '#68072C', // Dark berry
                        900: '#4D0521'  // Darkest burgundy
                    },
                    3: {
                        50: '#FFF0E6', // Lightest peach
                        100: '#FFDBBF', // Pale coral
                        200: '#FFC794', // Soft salmon
                        300: '#FFB266', // Light coral
                        400: '#FF9D33', // Bright terracotta
                        500: '#CD5E32', // Burnt coral orange (Base)
                        600: '#AD4E2A', // Deep rust
                        700: '#8E3F23', // Rich sienna
                        800: '#70311B', // Dark clay
                        900: '#532414'  // Deep mahogany
                    },
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
