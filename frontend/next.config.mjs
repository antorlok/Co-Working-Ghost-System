/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Por defecto, usa los nombres de servicio DNS de Docker Compose.
    // Para desarrollo local en host, se lee de los archivos .env (.env.development)
    const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://users-service:8000';
    const SPACE_SERVICE_URL = process.env.SPACE_SERVICE_URL || 'http://space-service:8081';
    const RESERVATIONS_SERVICE_URL = process.env.RESERVATIONS_SERVICE_URL || 'http://reservations-service:8003';
    const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || 'http://billing-service:8082';

    return [
      // Reglas específicas para evitar redirecciones 307 de FastAPI
      {
        source: '/api/users',
        destination: `${USERS_SERVICE_URL}/usuarios/`,
      },
      {
        source: '/api/users/login',
        destination: `${USERS_SERVICE_URL}/usuarios/login`,
      },
      {
        source: '/api/users/:path*',
        destination: `${USERS_SERVICE_URL}/usuarios/:path*`,
      },
      // Otros servicios
      {
        source: '/api/spaces/:path*',
        destination: `${SPACE_SERVICE_URL}/api/v1/spaces/:path*`,
      },
      {
        source: '/api/reservations/:path*',
        destination: `${RESERVATIONS_SERVICE_URL}/:path*`,
      },
      {
        source: '/api/billing/:path*',
        destination: `${BILLING_SERVICE_URL}/api/v1/billing/:path*`,
      },
    ];
  },
};

export default nextConfig;
