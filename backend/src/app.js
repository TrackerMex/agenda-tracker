import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import areasRoutes from './routes/areas.js';
import authRoutes from './routes/auth.js';
import capacitacionesRoutes from './routes/capacitaciones.js';
import usuariosRoutes from './routes/usuarios.js';

const app = express();
const corsOrigin = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()) || '*';

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'agenda-tracker-backend',
    status: 'ok',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/capacitaciones', capacitacionesRoutes);
app.use('/api/usuarios', usuariosRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.path}`,
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  });
});

export default app;
