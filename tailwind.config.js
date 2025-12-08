/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./context/**/*.{js,ts,jsx,tsx}",
    ],
    safelist: [
        '!text-emerald-400', '!bg-emerald-400/10', '!border-emerald-400/20',
        '!text-amber-400', '!bg-amber-400/10', '!border-amber-400/20',
        '!text-purple-400', '!bg-purple-400/10', '!border-purple-400/20'
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}
