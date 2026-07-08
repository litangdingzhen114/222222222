if (process.env.VERCEL && !process.env.STORAGE_DIR) {
  process.env.STORAGE_DIR = '/tmp/hailin-storage';
}

const backend = require('../backend/server');

let bootstrapped = false;

function sendStartupError(res, error) {
  res.statusCode = 500;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({
    error: {
      message: 'Backend startup configuration error',
      detail: error.message
    }
  }));
}

module.exports = async function handler(req, res) {
  try {
    if (!bootstrapped) {
      backend.bootstrap();
      bootstrapped = true;
    }
    await backend.handleRequest(req, res);
  } catch (error) {
    sendStartupError(res, error);
  }
};
