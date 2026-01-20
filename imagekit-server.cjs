const express = require('express');
const ImageKit = require('imagekit');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const imagekit = new ImageKit({
  publicKey: process.env.VITE_IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.VITE_IMAGEKIT_URL_ENDPOINT
});

app.get('/auth', (req, res) => {
  try {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    res.json(authenticationParameters);
  } catch (error) {
    console.error('Error generating authentication parameters:', error);
    res.status(500).json({ error: 'Failed to generate authentication parameters' });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Smart Parking ImageKit Server'
  });
});

app.listen(port, () => {
  console.log(`ImageKit server running on port ${port}`);
  console.log(`Authentication endpoint: http://localhost:${port}/auth`);
  console.log(`Health check: http://localhost:${port}/health`);
});