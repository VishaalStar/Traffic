const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Path to store sequence data
const DATA_PATH = path.join(__dirname, 'data');
const SEQUENCES_FILE = path.join(DATA_PATH, 'sequences.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_PATH)) {
  fs.mkdirSync(DATA_PATH, { recursive: true });
}

// Initialize sequences file if it doesn't exist
if (!fs.existsSync(SEQUENCES_FILE)) {
  fs.writeFileSync(SEQUENCES_FILE, JSON.stringify({}), 'utf8');
}

// Mock GPIO function for laptop development
function controlGPIO(pin, state) {
  console.log(`[MOCK GPIO] Setting pin ${pin} to ${state ? 'ON' : 'OFF'}`);
  return Promise.resolve();
}

// Apply sequence to hardware (mock implementation)
async function applySequence(route, sequenceData) {
  try {
    console.log(`[MOCK HARDWARE] Applying sequence for route ${route}:`, sequenceData);
    
    // Log the signals that would be activated
    for (const pole in sequenceData) {
      const signals = sequenceData[pole];
      
      for (const signal in signals) {
        const value = signals[signal];
        
        if (value === "1") {
          console.log(`[MOCK HARDWARE] Turning ON ${pole} ${signal}`);
        } else if (value === "A" && signal.startsWith("green")) {
          console.log(`[MOCK HARDWARE] Turning ON all green lights for ${pole}`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error applying sequence:', error);
    return false;
  }
}

// API Routes

// Get all sequences
app.get('/api/get-sequences', (req, res) => {
  try {
    const data = fs.readFileSync(SEQUENCES_FILE, 'utf8');
    const sequences = JSON.parse(data);
    res.json(sequences);
  } catch (error) {
    console.error('Error reading sequences:', error);
    res.status(500).json({ error: 'Failed to read sequences' });
  }
});

// Update a sequence
app.post('/api/update-sequence', async (req, res) => {
  try {
    const { route, sequenceData } = req.body;
    
    if (!route || !sequenceData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Read current sequences
    const data = fs.readFileSync(SEQUENCES_FILE, 'utf8');
    const sequences = JSON.parse(data);
    
    // Update the sequence
    sequences[route] = sequenceData;
    
    // Save to file
    fs.writeFileSync(SEQUENCES_FILE, JSON.stringify(sequences, null, 2), 'utf8');
    
    // Apply to hardware (mock)
    const success = await applySequence(route, sequenceData);
    
    if (success) {
      res.json({ success: true, message: 'Sequence updated and applied successfully' });
    } else {
      res.status(500).json({ error: 'Failed to apply sequence to hardware' });
    }
  } catch (error) {
    console.error('Error updating sequence:', error);
    res.status(500).json({ error: 'Failed to update sequence' });
  }
});

// Activate a specific route
app.post('/api/activate-route', async (req, res) => {
  try {
    const { route } = req.body;
    
    if (!route) {
      return res.status(400).json({ error: 'Missing route parameter' });
    }
    
    // Read sequences
    const data = fs.readFileSync(SEQUENCES_FILE, 'utf8');
    const sequences = JSON.parse(data);
    
    // Check if route exists
    if (!sequences[route]) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    // Apply to hardware (mock)
    const success = await applySequence(route, sequences[route]);
    
    if (success) {
      res.json({ success: true, message: `Route ${route} activated successfully` });
    } else {
      res.status(500).json({ error: 'Failed to activate route' });
    }
  } catch (error) {
    console.error('Error activating route:', error);
    res.status(500).json({ error: 'Failed to activate route' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
// Current state of all lights
let currentLightState = {
  pole1: { red: false, yellow: false, greenLeft: false, greenStraight: false, greenRight: false },
  pole2: { red: false, yellow: false, greenLeft: false, greenStraight: false, greenRight: false },
  pole3: { red: false, yellow: false, greenLeft: false, greenStraight: false, greenRight: false },
  pole4: { red: false, yellow: false, greenLeft: false, greenStraight: false, greenRight: false }
};

// Update the applySequence function to update currentLightState
async function applySequence(route, sequenceData) {
  try {
    console.log(`[MOCK HARDWARE] Applying sequence for route ${route}:`, sequenceData);
    
    // Reset all lights
    for (const pole in currentLightState) {
      for (const signal in currentLightState[pole]) {
        currentLightState[pole][signal] = false;
      }
    }
    
    // Apply the new sequence
    for (const pole in sequenceData) {
      const signals = sequenceData[pole];
      
      for (const signal in signals) {
        const value = signals[signal];
        
        if (value === "1") {
          if (currentLightState[pole] && signal in currentLightState[pole]) {
            currentLightState[pole][signal] = true;
          }
        } else if (value === "A" && signal.startsWith("green")) {
          if (currentLightState[pole]) {
            if ('greenLeft' in currentLightState[pole]) currentLightState[pole].greenLeft = true;
            if ('greenStraight' in currentLightState[pole]) currentLightState[pole].greenStraight = true;
            if ('greenRight' in currentLightState[pole]) currentLightState[pole].greenRight = true;
          }
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error applying sequence:', error);
    return false;
  }
}

// Add an endpoint to get the current light state
app.get('/api/light-state', (req, res) => {
  res.json(currentLightState);
});

// Serve a simple HTML page for visualizing the lights
app.get('/simulator', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Traffic Light Simulator</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .pole { border: 1px solid #ccc; padding: 15px; border-radius: 8px; }
        .light { width: 30px; height: 30px; border-radius: 50%; margin: 5px; display: inline-block; }
        .red { background-color: #ffcccc; }
        .red.active { background-color: #ff0000; }
        .yellow { background-color: #ffffcc; }
        .yellow.active { background-color: #ffff00; }
        .green { background-color: #ccffcc; }
        .green.active { background-color: #00ff00; }
        .refresh { margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>Traffic Light Simulator</h1>
      <div class="grid" id="lights">
        <!-- Will be populated by JavaScript -->
      </div>
      <button class="refresh" onclick="fetchLights()">Refresh</button>
      
      <script>
        function fetchLights() {
          fetch('/api/light-state')
            .then(response => response.json())
            .then(data => {
              const container = document.getElementById('lights');
              container.innerHTML = '';
              
              for (const pole in data) {
                const poleDiv = document.createElement('div');
                poleDiv.className = 'pole';
                poleDiv.innerHTML = '<h2>' + pole.charAt(0).toUpperCase() + pole.slice(1) + '</h2>';
                
                const lights = data[pole];
                for (const light in lights) {
                  const lightDiv = document.createElement('div');
                  let colorClass = '';
                  
                  if (light === 'red') colorClass = 'red';
                  else if (light === 'yellow') colorClass = 'yellow';
                  else colorClass = 'green';
                  
                  lightDiv.className = 'light ' + colorClass + (lights[light] ? ' active' : '');
                  lightDiv.title = light;
                  poleDiv.appendChild(lightDiv);
                }
                
                container.appendChild(poleDiv);
              }
            })
            .catch(error => console.error('Error fetching light state:', error));
        }
        
        // Initial fetch
        fetchLights();
        
        // Refresh every 2 seconds
        setInterval(fetchLights, 2000);
      </script>
    </body>
    </html>
  `);
});