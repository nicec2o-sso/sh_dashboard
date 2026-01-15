import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  
  // 개발 모드에서 source map 비활성화 (무한 루프 방지)
  productionBrowserSourceMaps: false,
  
  // 네이티브 모듈을 서버 전용 패키지로 설정 (Altibase 전용)
  serverExternalPackages: [
    'odbc',
    'node-odbc-altibase',
    '@mapbox/node-pre-gyp'
  ],
  
  // Turbopack 설정 - 빈 객체로 설정하여 경고 제거
  turbopack: {},
  
  // Webpack 설정 (필요시 --webpack 플래그로 사용)
  webpack: (config, { isServer, dev }) => {
    // 개발 모드에서 source map 비활성화
    if (dev) {
      config.devtool = false;
    }

    // 서버 사이드에서만 네이티브 모듈 처리
    if (isServer) {
      config.externals = config.externals || [];
      
      // Altibase 네이티브 모듈을 외부 의존성으로 처리
      config.externals.push({
        'odbc': 'commonjs odbc',
        'node-odbc-altibase': 'commonjs node-odbc-altibase',
        '@mapbox/node-pre-gyp': 'commonjs @mapbox/node-pre-gyp'
      });
    }

    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    // .node 파일 처리 (네이티브 바이너리)
    config.module.rules.push({
      test: /\.node$/,
      loader: 'node-loader',
    });

    // @mapbox/node-pre-gyp의 HTML 파일 무시
    config.module.rules.push({
      test: /node_modules\/@mapbox\/node-pre-gyp\/.*\.html$/,
      loader: 'ignore-loader',
    });

    // 기타 불필요한 파일들 무시
    config.module.rules.push({
      test: /\.(md|txt)$/,
      loader: 'ignore-loader',
    });

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
