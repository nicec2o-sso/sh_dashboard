import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  
  // 개발 모드에서 source map 비활성화
  productionBrowserSourceMaps: false,
  
  // Turbopack 설정 - 빈 객체로 설정하여 경고 제거
  turbopack: {},

  // Webpack 설정
  webpack: (config, { isServer, dev }) => {
    // 개발 모드에서 source map 비활성화
    if (dev) {
      config.devtool = false;
    }
    
    if (!isServer) {
      config.devtool = 'hidden-source-map';
    }

    // axios 소스맵 문제 해결
    config.module.rules.push({
      test: /node_modules\/axios/,
      use: ['source-map-loader'],
      enforce: 'pre',
    });

    // 소스맵 경고 무시
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /sourceMapURL could not be parsed/,
    ];

    return config;
  },
};

export default nextConfig;
