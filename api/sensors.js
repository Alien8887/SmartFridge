// Store sensor data in memory (for quick demo)
// In production, use Vercel KV or a database
let latestSensorData = {
  temperature: 4.2,
  humidity: 65,
  weight: 0,
  doorOpen: false,
  pressure: 50,
  gasLevel: 0,
  timestamp: Date.now()
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    const { temperature, humidity, weight, doorOpen, pressure, gasLevel } = req.body;
    
    // Update the stored data
    latestSensorData = {
      temperature: temperature || latestSensorData.temperature,
      humidity: humidity || latestSensorData.humidity,
      weight: weight || latestSensorData.weight,
      doorOpen: doorOpen !== undefined ? doorOpen : latestSensorData.doorOpen,
      pressure: pressure || latestSensorData.pressure,
      gasLevel: gasLevel || latestSensorData.gasLevel,
      timestamp: Date.now()
    };
    
    console.log('Received and stored:', latestSensorData);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Sensor data received and stored',
      data: latestSensorData
    });
  }
  
  if (req.method === 'GET') {
    // Return the latest sensor data
    return res.status(200).json(latestSensorData);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}