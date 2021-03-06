const colors = require('tailwindcss/colors');
const theme = require('tailwindcss/defaultTheme');

module.exports = {
    purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
    darkMode: false, // or 'media' or 'class'
    theme: {
        extend: {
            gridTemplateRows: {
                max: '100%',
            },
        },
        colors: {
            ...colors,
            woodsmoke: {
                DEFAULT: '#171A21',
                50: '#7B87A3',
                100: '#6C7998',
                200: '#56617B',
                300: '#41495D',
                400: '#2C323F',
                500: '#171A21',
                600: '#020203',
                700: '#000000',
                800: '#000000',
                900: '#000000',
            },
            cloud: {
                DEFAULT: '#C5C3C0',
                50: '#FFFFFF',
                100: '#FFFFFF',
                200: '#FFFFFF',
                300: '#F6F6F5',
                400: '#DDDCDB',
                500: '#C5C3C0',
                600: '#ADAAA5',
                700: '#94908B',
                800: '#7B7771',
                900: '#605D59',
            },
            'cotton-seed': {
                DEFAULT: '#B8B6B4',
                50: '#FFFFFF',
                100: '#FFFFFF',
                200: '#FFFFFF',
                300: '#EAE9E8',
                400: '#D1D0CE',
                500: '#B8B6B4',
                600: '#9F9D9A',
                700: '#868380',
                800: '#6C6A67',
                900: '#52504E',
            },
            tuna: {
                DEFAULT: '#32353C',
                50: '#A2A7B2',
                100: '#9499A6',
                200: '#787F8F',
                300: '#606674',
                400: '#494E58',
                500: '#32353C',
                600: '#1B1C20',
                700: '#040404',
                800: '#000000',
                900: '#000000',
            },
            mercury: {
                DEFAULT: '#E9E9E9',
                50: '#FFFFFF',
                100: '#FFFFFF',
                200: '#FFFFFF',
                300: '#FFFFFF',
                400: '#FFFFFF',
                500: '#E9E9E9',
                600: '#D0D0D0',
                700: '#B6B6B6',
                800: '#9D9D9D',
                900: '#838383',
            },
            malibu: {
                DEFAULT: '#66C0F4',
                50: '#FFFFFF',
                100: '#FFFFFF',
                200: '#F5FBFE',
                300: '#C5E7FB',
                400: '#96D4F7',
                500: '#66C0F4',
                600: '#36ACF1',
                700: '#1096E4',
                800: '#0D77B4',
                900: '#0A5784',
            },
            asparagus: {
                DEFAULT: '#779556',
                50: '#E9EEE2',
                100: '#DCE5D2',
                200: '#C3D2B2',
                300: '#AAC091',
                400: '#90AD71',
                500: '#779556',
                600: '#5D7543',
                700: '#435431',
                800: '#2A341E',
                900: '#10140B',
            },
            'aths-special': {
                DEFAULT: '#EBECD0',
                50: '#FFFFFF',
                100: '#FFFFFF',
                200: '#FFFFFF',
                300: '#FFFFFF',
                400: '#FAFBF4',
                500: '#EBECD0',
                600: '#DCDDAC',
                700: '#CCCF87',
                800: '#BDC063',
                900: '#A7AB45',
            },
        },
        backgroundImage: {
            ...theme.backgroundImage,
            'btn-1': '  linear-gradient( to right, #47bfff 5%, #1a44c2 60%);',
        },
        gridTemplateColumns: {
            ...theme.gridTemplateColumns,
            14: 'repeat(14, minmax(0, 1fr))',
            '14-ttt': 'repeat(14, minmax(40px, 1fr))',
            '8-chess': 'repeat(8, minmax(64px, 1fr))',
        },
        boxShadow: {
            ...theme.boxShadow,
            menu: '0 0 12px #000000',
        },
    },
    variants: {
        extend: {},
    },
    plugins: [],
};
