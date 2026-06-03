// api/sensors.js — CommonJS version (no "export default")

const CONFIDENCE_MS = 30000;

// In-memory store — resets when Vercel cold-starts the function
// For production, replace with a real database (Vercel KV, etc.)
let state = {
  temperature:     null,
  humidity:        null,
  doorOpen:        false,
  pressure:        0,
  gasLevel:        0,
  weight:          0,
  targetTemp:      4.0,
  actualTemp:      null,
  servoAngle:      90,
  lastSeen:        0,
  doorOpenCount:   0,
  totalEnergyLost: 0,
  doorHistory:     []
};

module.exports = function handler(req, res) {
  // Allow cross-origin requests (needed for ESP32 and browser)
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle browser pre-flight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── POST: ESP32 sends sensor data TO the server ──────────
  if (req.method === 'POST') {
    const {
      temperature, humidity, weight,
      doorOpen, pressure, gasLevel,
      targetTemp, servoAngle
    } = req.body;

    const now      = Date.now();
    const wasOpen  = state.doorOpen;
    const isNowOpen = Boolean(doorOpen);

    // Track door open events for energy calculation
    // Only count when door transitions from CLOSED → OPEN
    if (!wasOpen && isNowOpen) {
      state.doorOpenCount   += 1;
      state.totalEnergyLost  = parseFloat(
        (state.totalEnergyLost + 0.012).toFixed(4)
      );
      state.doorHistory = [
        ...state.doorHistory.slice(-199),
        { timestamp: now, energy: 0.012 }
      ];
    }

    // Update state with incoming sensor values
    // Only update if the value is a real number (not -999 sentinel)
    state = {
      ...state,
      temperature:  (typeof temperature === 'number' && temperature !== -999)
                      ? temperature : state.temperature,
      humidity:     (typeof humidity    === 'number' && humidity    !== -999)
                      ? humidity    : state.humidity,
      weight:       (typeof weight      === 'number' && weight      !== -999)
                      ? Math.abs(weight) : state.weight,
      pressure:     (typeof pressure    === 'number')
                      ? Math.abs(pressure) : state.pressure,
      gasLevel:     (typeof gasLevel    === 'number') ? gasLevel    : 0,
      doorOpen:     isNowOpen,
      servoAngle:   (typeof servoAngle  === 'number') ? servoAngle  : state.servoAngle,
      targetTemp:   (typeof targetTemp  === 'number') ? targetTemp  : state.targetTemp,
      actualTemp:   (typeof temperature === 'number' && temperature !== -999)
                      ? temperature : state.actualTemp,
      lastSeen:     now
    };

    return res.status(200).json({
      success: true,
      message: 'Sensor data received',
      // Echo back the current setpoint so ESP32 knows what user wants
      targetTemperature: state.targetTemp
    });
  }

  // ── GET: Website reads sensor data FROM the server ───────
  if (req.method === 'GET') {
    const now        = Date.now();
    const timeSince  = now - state.lastSeen;

    // Connection confidence interval:
    // If data was received within 30 seconds → show as connected
    // If lastSeen is 0 (server just cold-started) → show as offline
    const isConnected = state.lastSeen > 0 && timeSince < CONFIDENCE_MS;

    return res.status(200).json({
      // Raw sensor readings
      temperature:      state.temperature,
      humidity:         state.humidity,
      weight:           state.weight,
      doorOpen:         state.doorOpen,
      pressure:         state.pressure,
      gasLevel:         state.gasLevel,
      servoAngle:       state.servoAngle,

      // Temperature setpoint (what user wants vs what sensor reads)
      targetTemperature: state.targetTemp,
      actualTemp:        state.actualTemp,

      // Energy tracking
      doorOpenCount:    state.doorOpenCount,
      totalEnergyLost:  state.totalEnergyLost,
      doorHistory:      state.doorHistory,

      // Connection status
      connected:        isConnected,
      lastSeen:         state.lastSeen,
      timeSinceUpdate:  timeSince
    });
  }

  // Any other HTTP method (PUT, DELETE, etc.) is not allowed
  return res.status(405).json({ error: 'Method not allowed' });
};