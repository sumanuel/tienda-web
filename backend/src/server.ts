import app from './app';
import { Server } from 'http';

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0'; // Escuchar en todas las interfaces para acceso desde red local

let server: Server | null = null;

// Iniciar servidor con manejo de errores
try {
  server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Network: http://10.2.0.2:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(
      `🔐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`
    );
  });

  // Manejar error de puerto ocupado
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `❌ Error: Puerto ${PORT} ya está en uso. Ejecuta este comando para liberarlo:`
      );
      console.error(
        `   Get-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess | Stop-Process -Force`
      );
      process.exit(1);
    } else {
      console.error('❌ Error al iniciar servidor:', error);
      process.exit(1);
    }
  });
} catch (error) {
  console.error('❌ Error fatal al iniciar servidor:', error);
  process.exit(1);
}

// Función para cerrar limpiamente el servidor
const gracefulShutdown = (signal: string) => {
  console.log(
    `\n⏳ Recibida señal ${signal}. Cerrando servidor limpiamente...`
  );

  if (server) {
    server.close(() => {
      console.log('✅ Servidor cerrado correctamente');
      process.exit(0);
    });

    // Forzar cierre después de 10 segundos
    setTimeout(() => {
      console.error('⚠️  Forzando cierre del servidor (timeout)');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// Manejar señales de cierre
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  console.error('Promesa:', promise);
  gracefulShutdown('unhandledRejection');
});
