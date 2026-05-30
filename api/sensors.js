// Store in memory (will reset on deployment but works for testing)
let latestSensorData = {
  temperature: null,
  humidity: null,
  weight: null,
  doorOpen: false,
  pressure: null,
  gasLevel: null,
  timestamp: 0,
  connected: false
};

const CONNECTION_TIMEOUT = 10000; // 10 seconds timeout

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // POST: Receive data from Wokwi/ESP32
  if (req.method === 'POST') {
    const { temperature, humidity, weight, doorOpen, pressure, gasLevel } = req.body;
    
    latestSensorData = {
      temperature: temperature !== undefined ? temperature : null,
      humidity: humidity !== undefined ? humidity : null,
      weight: weight !== undefined ? weight : null,
      doorOpen: doorOpen !== undefined ? doorOpen : false,
      pressure: pressure !== undefined ? pressure : null,
      gasLevel: gasLevel !== undefined ? gasLevel : null,
      timestamp: Date.now(),
      connected: true
    };
    
    console.log('📥 Received from ESP32:', latestSensorData);
    
    return res.status(200).json({ 
      success: true,
      message: 'Data received',
      timestamp: latestSensorData.timestamp
    });
  }
  
  // GET: Send data to frontend
  if (req.method === 'GET') {
    const timeSinceLastUpdate = Date.now() - latestSensorData.timestamp;
    const isConnected = latestSensorData.timestamp > 0 && timeSinceLastUpdate < CONNECTION_TIMEOUT;
    
    const responseData = {
      ...latestSensorData,
      connected: isConnected,
      timeSinceUpdate: timeSinceLastUpdate
    };
    
    console.log('📤 Sending to frontend:', responseData);
    
    return res.status(200).json(responseData);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}