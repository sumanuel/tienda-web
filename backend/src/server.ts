import app from './app';

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0'; // Escuchar en todas las interfaces para acceso desde red local

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Network: http://10.2.0.2:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(
    `🔐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`
  );
});
