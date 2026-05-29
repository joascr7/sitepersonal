const nextConfig = {
  // Isso força o Next.js a sempre tentar carregar a partir da raiz
  output: 'standalone', 
};
export default nextConfig;

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // Só ativa em produção
  register: true,
});

module.exports = withPWA({
  // suas outras configurações aqui
});