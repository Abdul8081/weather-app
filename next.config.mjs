/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.56.1'],
  images: {
    domains: ['flagcdn.com', 'openweathermap.org'],
  },
};

export default nextConfig;