/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        mobile: { max: "1024px" }, // 1024 以下, 包含 1024
        tablet: { min: "1025px" }, // 1024 以上, 不包含 1024
      },
    },
  },
  plugins: [],
};
