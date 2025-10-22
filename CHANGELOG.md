# Changelog

All notable changes to Photo to 3D project will be documented in this file.

## [1.1.0] - 2025-10-22

### 🎨 UI/UX Improvements

#### ✨ Layout Redesign
- **Side-by-side layout**: Photo upload on the left, 3D model preview on the right
- **Equal heights**: Both panels now 500px min-height for visual consistency
- **Actions bar**: Status and action buttons moved to bottom panel below workspace
- **Single download button**: Removed duplicate download button from model viewer
- **Placeholder text**: Added helpful hint when no model is generated

#### 🎨 Visual Design
- **Modern gradient**: New indigo-violet-pink gradient background
- **Glass-morphism**: Enhanced blur effects and transparency
- **Better borders**: Rounded corners (24px) and subtle borders
- **Gradient buttons**: All buttons now have gradient backgrounds with shadows
- **Typography**: Improved fonts, weights, and gradient text effects
- **Color scheme**: Updated to modern purple/indigo palette

#### 📱 Responsive Design
- Improved mobile layout (stacks vertically on tablets)
- Better button sizing on mobile
- Flexible action bar for small screens

### 🔧 Technical Changes
- Refactored App.css with new workspace and actions-bar containers
- Updated StatusCard to work in horizontal layout
- Simplified ModelViewer component (removed download button)
- Better CSS organization and naming

## [1.0.0] - 2025-10-21

### 🎉 Initial Release - Production Ready

#### ✨ Features
- **Photo Upload**: Drag & drop or click to upload photos
- **3D Generation**: Real-time 3D model generation using GenAPI Trellis
- **Progress Tracking**: Live status updates during generation (2-3 minutes)
- **3D Viewer**: Interactive 3D model viewer with Three.js
- **Download**: Download generated GLB files
- **Modern UI**: Beautiful gradient design with smooth animations
- **Mobile Responsive**: Works on all devices

#### 🔧 Technical
- **Backend**: Node.js + Express
- **Frontend**: React + Three.js + @react-three/fiber
- **API Integration**: GenAPI Trellis API with proper authentication
- **File Persistence**: JSON-based task storage (survives container restarts)
- **Deployment**: Railway with Docker, auto-deploy from GitHub
- **CORS**: Configured for all domains
- **Error Handling**: Comprehensive error handling and logging

#### 🐛 Bug Fixes
- Fixed GenAPI API URL and authentication (Bearer token)
- Fixed result parsing (array format from GenAPI)
- Fixed file upload with FormData
- Fixed task persistence across container restarts
- Fixed CORS configuration
- Fixed API key handling (trim whitespace)
- Fixed status polling with correct endpoint

#### 📝 Documentation
- README.md with full setup instructions
- DEPLOYMENT.md with Railway deployment guide
- QUICK_START.md for quick local setup
- API documentation in code comments

#### 🚀 Deployment
- Live at: https://photo23d-production.up.railway.app
- GitHub: https://github.com/kikanbig/Photo_2_3d
- Railway: Auto-deploy on push to master

### Known Limitations
- File-based storage (PostgreSQL integration planned for v1.1)
- Single model support (Trellis only)
- No user authentication
- No payment integration

### Next Steps (Roadmap)
- [ ] Add PostgreSQL for persistent storage
- [ ] Add more 3D generation services
- [ ] Implement user authentication and accounts
- [ ] Add payment integration
- [ ] Add model history and gallery
- [ ] Add model editing features

