import type { NextConfig } from 'next';
import path from 'path';
import type { Configuration } from 'webpack'; // Importando o tipo oficial

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['react-native-purchases'],
  
  // Tipando corretamente os argumentos da função webpack
  webpack: (config: Configuration, context: { isServer: boolean }) => {
    // Garantindo que o alias exista
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native': path.resolve(__dirname, '__mocks__/react-native.js'),
    };
    
    return config;
  },
};

export default nextConfig;