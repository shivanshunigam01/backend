const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');
const morgan = require('morgan');

const { notFound } = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();


//laddoo
app.use(
  cors({
    origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL] : '*',
    credentials: true,
  })
);
app.use(helmet());
app.use(compression());
app.use(hpp());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

const healthPayload = () => ({
  success: true,
  status: 'ok',
  service: 'Patliputra Showroom API',
  message: 'Server is healthy',
  timestamp: new Date().toISOString(),
});

/** Root — for load balancers / uptime checks when proxy forwards `/health` only. */
app.get('/health', (req, res) => {
  res.status(200).json(healthPayload());
});

/** Same check under API prefix — use this if you only expose `/api/v1/*` to the internet. */
app.get('/api/v1/health', (req, res) => {
  res.status(200).json(healthPayload());
});

app.use('/api/v1', publicRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
