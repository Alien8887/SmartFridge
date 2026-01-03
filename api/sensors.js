export default async function handler(req, res) {
  // Enable CORS for ESP32
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'POST') {
    const { temperature, humidity, weight, doorOpen, pressure, gasLevel } = req.body;
    
    console.log('Received sensor data:', req.body);
    
    // Here you can store to a database (Vercel KV, PostgreSQL, etc.)
    // For now, we'll just acknowledge receipt
    
    return res.status(200).json({ 
      success: true, 
      message: 'Sensor data received',
      data: req.body
    });
  }
  
  if (req.method === 'GET') {
    // Return latest sensor data
    // In production, fetch from your database
    return res.status(200).json({
      temperature: 4.2,
      humidity: 65,
      weight: 25.5,
      doorOpen: false,
      pressure: 50,
      gasLevel: 0,
      timestamp: Date.now()
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}