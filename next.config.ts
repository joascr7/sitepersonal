/** @type {import('next').NextConfig} */
const path = require('path');

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig = {
  output: 'standalone',
  transpilePackages: ['react-native-purchases'], 
  
  /**
   * @param {import('webpack').Configuration} config
   * @param {import('next').WebpackConfigContext} context
   */
  webpack: (config, { isServer }) => {
    // Definimos explicitamente o tipo do config como any para evitar o erro de compilação
    const customConfig = config;

    customConfig.resolve.alias = {
      ...customConfig.resolve.alias,
      'react-native': path.resolve(__dirname, '__mocks__/react-native.js'),
    };
    
    return customConfig;
  },
};

module.exports = withPWA(nextConfig);