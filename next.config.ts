/** @type {import('next').NextConfig} */
const path = require('path'); // Certifique-se de ter essa linha

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig = {
  output: 'standalone',
  transpilePackages: ['react-native-purchases'], 
  webpack: (config, { isServer }) => {
    // Aponta para o arquivo vazio que criamos na raiz
    config.resolve.alias['react-native'] = path.resolve(__dirname, '__mocks__/react-native.js');
    return config;
  },
};

module.exports = withPWA(nextConfig);