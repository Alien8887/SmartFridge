let latestSensorData = {
  temperature: 0,
  humidity: 0,
  weight: 0,
  doorOpen: false,
  pressure: 0,
  gasLevel: 0,
  timestamp: 0,
  connected: false
};

const CONNECTION_TIMEOUT = 5000; // 5 seconds

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    const { temperature, humidity, weight, doorOpen, pressure, gasLevel } = req.body;
    
    latestSensorData = {
      temperature: temperature || 0,
      humidity: humidity || 0,
      weight: weight || 0,
      doorOpen: doorOpen !== undefined ? doorOpen : false,
      pressure: pressure || 0,
      gasLevel: gasLevel || 0,
      timestamp: Date.now(),
      connected: true
    };
    
    console.log('Received:', latestSensorData);
    
    return res.status(200).json({ 
      success: true,
      message: 'Data received'
    });
  }
  
  if (req.method === 'GET') {
    const timeSinceLastUpdate = Date.now() - latestSensorData.timestamp;
    const isConnected = timeSinceLastUpdate < CONNECTION_TIMEOUT;
    
    return res.status(200).json({
      ...latestSensorData,
      connected: isConnected
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}