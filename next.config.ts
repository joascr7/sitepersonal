/** @type {import('next').NextConfig} */

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig = {
  output: 'standalone', // Mantém sua configuração de servidor
  // Adicione outras configurações aqui, se precisar
};

module.exports = withPWA(nextConfig);