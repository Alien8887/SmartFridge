// This endpoint receives sensor data from ESP32
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { temperature, humidity, doorOpen, pressure, gasLevel } = req.body;
    
    // Store in Vercel KV or your database
    // await kv.set('sensor-data', { temperature, humidity, doorOpen, pressure, gasLevel, timestamp: Date.now() });
    
    return res.status(200).json({ success: true });
  }
  
  if (req.method === 'GET') {
    // Retrieve latest sensor data
    // const data = await kv.get('sensor-data');
    // For now, return mock data
    return res.status(200).json({
      temperature: 4.2,
      humidity: 65,
      doorOpen: false,
      pressure: 50,
      gasLevel: 0
    });
  }
}