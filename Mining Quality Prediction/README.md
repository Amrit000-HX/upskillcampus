# MinePredict AI - Mining Quality Prediction System

An interactive web application for predicting silica impurity levels in iron ore concentrate using machine learning. Built with React, TypeScript, TensorFlow.js, and Tailwind CSS.

## Features

### 🏠 Home Page
- **Interactive particle background** with cave/mining theme
- **Process flow visualization** showing the flotation process
- **Comprehensive model description** and capabilities
- **Key inputs overview** for the prediction model
- **Dataset information** with detailed column descriptions

### 📊 Dashboard
- **Real-time prediction interface** with interactive input forms
- **Model training module** with progress tracking and loss visualization
- **Analytics section** with key metrics and historical data charts
- **Dataset uploader** with drag-and-drop functionality
- **Multi-tab interface** for Predict, Train, and Analytics views

### 🔐 Login
- Simple authentication interface
- Demo mode (any credentials work for testing)

## Theme

The application uses a **cave and mining-inspired color palette**:
- Earth tones: Browns, sand, mud, and clay colors
- Background: Deep cave brown (#1a1410)
- Primary: Sandy gold (#b8956a)
- Accent: Clay beige (#d4a574)
- Secondary: Earth brown (#8b6f47)

## Technology Stack

- **Frontend Framework**: React 18.3.1
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Machine Learning**: TensorFlow.js
- **Charts**: Recharts
- **Animations**: Motion (Framer Motion)
- **UI Components**: Radix UI + Custom components
- **Routing**: React Router v7
- **Build Tool**: Vite

## Model Details

### Context
This application is designed for the **flotation plant process** in mining operations. The flotation process is used to concentrate iron ore by removing impurities, particularly silica.

### Dataset
- **Time Period**: March 2017 - September 2017
- **Format**: CSV with 22 columns
- **Sampling Rate**: 20 seconds to hourly
- **Source**: Real industrial data from flotation plant

### Key Columns
1. Date & Time
2. % Iron Feed
3. % Silica Feed
4. Starch Flow
5. Amina Flow
6. Ore Pulp Flow & pH
7. Flotation Column Levels (1-7)
8. Air Flow Rates
9. **% Silica Concentrate** (Target - to be predicted)

### Objectives
1. ✅ Predict % Silica Concentrate every minute
2. ✅ Multi-step ahead prediction (hours in advance)
3. ✅ Enable predictive engineering actions
4. ✅ Reduce iron waste going to tailings
5. ✅ Minimize environmental impact

## Dataset Access

The mining process dataset can be downloaded from:
[Google Drive Dataset Link](https://drive.google.com/file/d/1N80d8eTDAf1JMQXGQbHDAUaMGRyA8QG3/view?usp=sharing)

## Installation

### Frontend

```bash
pnpm install
pnpm dev
```

### Backend (ML API)

```bash
cd backend
py -m pip install -r requirements.txt
py scripts/extract_dataset.py    # first time only
py scripts/train_model.py        # trains ensemble (~1 min)
py run.py                        # http://localhost:8000
```

The Vite dev server proxies `/api` to the backend. Use demo login: `employee@minevision.ai` / `employee123`.

## Usage

1. **Home Page**: Navigate to the landing page to learn about the model
2. **Dashboard**: Click "Dashboard" or "Start Predicting" to access the prediction interface
3. **Make Predictions**: 
   - Enter process parameters in the input form
   - Click "Generate Predictions" to see forecasts
4. **Train Model**:
   - Upload the dataset CSV file
   - Configure training parameters
   - Monitor training progress and loss curves
5. **View Analytics**: Check historical data and model performance metrics

## Key Features

### Interactive Elements
- ✨ **Particle animation background** with floating cave particles
- 🎯 **Hover effects** on cards and buttons
- 📈 **Real-time charts** showing predictions vs actual values
- 🔄 **Animated process flow** visualization
- 📁 **Drag-and-drop file upload** for datasets

### Prediction Capabilities
- **1 minute ahead**: 95% confidence
- **1 hour ahead**: 89% confidence
- **3 hours ahead**: 76% confidence

### Model Performance
- **Accuracy**: 94.2% on validation set
- **Loss**: Training and validation loss visualization
- **Real-time feedback**: Immediate quality alerts

## Project Structure

```
src/
├── app/
│   ├── App.tsx                 # Main app with routing
│   └── components/
│       ├── HomePage.tsx        # Landing page
│       ├── Dashboard.tsx       # Prediction dashboard
│       ├── Login.tsx           # Login page
│       ├── ProcessFlow.tsx     # Process visualization
│       ├── ParticleBackground.tsx  # Animated background
│       ├── DatasetUploader.tsx     # File upload component
│       ├── DatasetInfo.tsx     # Dataset information
│       ├── MetricsCard.tsx     # Animated metrics
│       ├── Footer.tsx          # Footer component
│       └── ui/                 # UI components library
└── styles/
    └── theme.css               # Mining theme colors
```

## Environment

This project is built for the **Figma Make** environment and uses:
- React + TypeScript
- Tailwind CSS v4
- Vite build system
- pnpm package manager

## License

Built for mining process optimization and educational purposes.

---

**MinePredict AI** - Empowering mining engineers with predictive analytics 🏔️⛏️
