import type {NextConfig} from 'next';

// TODO: GitHub Pages 배포 시, 'YOUR_REPOSITORY_NAME'을 실제 GitHub 저장소 이름으로 변경해주세요.
// 예를 들어 저장소 URL이 https://github.com/seyoungseyoung/my-awesome-app 이라면
// REPOSITORY_NAME은 'my-awesome-app'이 됩니다.
const REPOSITORY_NAME = 'YOUR_REPOSITORY_NAME';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export', // 정적 사이트 익스포트를 위해 추가
  basePath: isProd ? `/${REPOSITORY_NAME}` : '', // GitHub Pages 배포를 위해 추가
  assetPrefix: isProd ? `/${REPOSITORY_NAME}` : '', // GitHub Pages 배포를 위해 추가
  images: {
    unoptimized: true, // GitHub Pages에서 Next.js 이미지 최적화를 사용하지 않도록 설정
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com', // Added Imgur domain
        port: '',
        pathname: '/**',
      }
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
