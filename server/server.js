require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`[server] Listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });

  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION 💥 Shutting down...');
    console.error(err.name, err.message);
    server.close(() => process.exit(1));
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully.');
    server.close(() => console.log('Process terminated.'));
  });
})();
