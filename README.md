🌍 TerraScan_LoS — Terrain Line-of-Sight Analyzer

TerraScan_LoS is a lightweight web application that analyzes terrain elevation between two geographic points and visualizes potential Line-of-Sight (LoS) issues.
It is designed for quick terrain checks, elevation profiling, and visual inspection of obstacles between Point A and Point B.

This tool is especially useful for:

Telecom & network planning

GIS and terrain analysis

Line-of-sight feasibility checks

Educational and experimental geospatial projects

🚀 Features

📍 Accepts two geographic points (latitude & longitude)

📈 Fetches elevation data for intermediate points

📊 Generates an elevation profile

🧭 Detects potential terrain obstructions

🗺️ Visualizes the connection line between points

⚡ Built with React + TypeScript + Vite

🧩 Uses open-source libraries only

🧠 How It Works (Concept)

User provides Point A and Point B (lat/long)

A straight line is drawn between the two points

Elevation data is sampled along the line

Terrain height variations are analyzed

Results are displayed as:

A line connecting A → B

An elevation profile chart

Visual indication of possible LoS blockage

🛠 Tech Stack

Frontend: React + TypeScript

Build Tool: Vite

Visualization: Chart / plotting libraries

Mapping / Geo logic: Open-source geospatial utilities

Runtime: Node.js

📦 Installation & Local Setup
1️⃣ Clone the repository
git clone https://github.com/Muhammed2-h/TerraScan_LoS.git
cd TerraScan_LoS

2️⃣ Install dependencies
npm install

3️⃣ Run the app
npm run dev


The app will be available at:

http://localhost:5173

🧪 Usage

Open the app in your browser

Enter Latitude & Longitude for:

Point A

Point B

Start analysis

View:

Terrain elevation profile

Line-of-Sight feasibility

Visual indicators of terrain interference

📂 Project Structure (Simplified)
TerraScan_LoS/
├── src/
│   ├── components/      # UI components
│   ├── services/        # Elevation & terrain logic
│   ├── App.tsx          # Main app
│   └── main.tsx
├── public/
├── package.json
└── README.md

⚠️ Limitations

Accuracy depends on the elevation data source

Not intended for certified engineering decisions

Internet connection required for elevation APIs (if used)

🔮 Future Improvements

🌐 Map view with terrain overlay

📡 Fresnel zone calculation

📤 Export elevation profile (CSV / PNG)

📍 Multiple point chain analysis

🛰️ Offline DEM support

🤝 Contributing

Contributions are welcome!

Fork the repo

Create a feature branch

Commit changes

Open a Pull Request

📜 License

This project is open-source and available under the MIT License.
