export default {
    content: [
        './index.html',
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}'
    ],
    prefix: '',
    theme: {
        extend: {
            colors: {
                border: 'hsl(var(--border))',
            }
        }
    },
    plugins: []
};
