# Nmap Web Scanner - Specification

## 1. Project Overview
- **Project Name**: Nmap Web Scanner
- **Type**: Local web application
- **Core Functionality**: A web interface to run nmap scans with configurable options, displaying results neatly with JSON export capability
- **Target Users**: System administrators and security professionals

## 2. Technology Stack
- **Backend**: Python 3 with Flask
- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **External Tool**: nmap (must be installed on system)

## 3. UI/UX Specification

### Layout Structure
- **Single page application** with two main sections:
  1. Scan configuration form (top/left)
  2. Results display area (bottom/right)
- **Responsive**: Works on desktop and tablet (min-width: 768px)

### Visual Design
- **Color Palette**:
  - Background: `#0d1117` (dark charcoal)
  - Card/Form: `#161b22` (slightly lighter)
  - Primary accent: `#58a6ff` (bright blue)
  - Secondary accent: `#238636` (green for success/run)
  - Text primary: `#e6edf3`
  - Text secondary: `#8b949e`
  - Border: `#30363d`
  - Error: `#f85149`
  - Warning: `#d29922`

- **Typography**:
  - Font family: `"JetBrains Mono", "Fira Code", monospace`
  - Headings: 1.5rem (h1), 1.2rem (h2)
  - Body: 0.95rem

- **Spacing**: 8px base unit (8, 16, 24, 32px)

- **Visual Effects**:
  - Subtle box shadows on cards
  - Smooth transitions (0.2s ease)
  - Input focus glow with primary accent
  - Loading spinner during scan

### Components

#### Scan Form
- **Target Input**: Text field for IPv4 address (required)
  - Placeholder: "e.g., 192.168.1.1 or 192.168.1.0/24"
  - Validation: Basic IP/CIDR format check

- **Scan Options** (checkboxes/toggles):
  - `-sS` TCP SYN Scan (default)
  - `-sU` UDP Scan
  - `-sV` Version Detection
  - `-O` OS Detection
  - `-A` Aggressive (OS, version, script, traceroute)
  - `-p-` Scan all ports
  - `-p 1-1000` Port range (custom input)

- **Timing Options**: Dropdown select
  - `-T0` Paranoid
  - `-T1` Sneaky
  - `-T2` Polite
  - `-T3` Normal (default)
  - `-T4` Aggressive
  - `-T5` Insane

- **Additional Options**:
  - Scan arguments text input (for custom nmap flags)

- **Submit Button**:
  - "Run Scan" with play icon
  - Disabled state while scanning
  - Loading spinner when active

#### Results Display
- **Status Indicator**: Shows scan status (idle/running/complete/error)
- **Summary Card**:
  - Target, scan type, duration
  - Open/closed/filtered port counts

- **Ports Table**:
  - Columns: Port, Protocol, State, Service, Version
  - Sortable headers
  - Color-coded states (open=green, closed=red, filtered=yellow)

- **Export Button**:
  - "Export JSON" button
  - Downloads results as `nmap-results-{timestamp}.json`

## 4. Functionality Specification

### Core Features
1. **Scan Execution**
   - Accept target IP/CIDR and nmap flags
   - Execute nmap with `-oX -` for XML output (parseable)
   - Parse XML output to JSON
   - Display results in formatted table
   - Handle scan errors gracefully

2. **Input Validation**
   - Validate target format (IP or CIDR)
   - Sanitize input to prevent command injection
   - Show helpful error messages

3. **Results Export**
   - Convert scan results to JSON
   - Trigger browser download with filename

### User Interactions
1. User enters target IP address
2. User optionally selects scan options
3. User clicks "Run Scan"
4. App displays loading state
5. Results appear in table format
6. User can export results as JSON

### Edge Cases
- Invalid IP address format → Show error message
- nmap not installed → Show setup instructions
- Scan timeout → Allow cancel, show timeout message
- Empty results (no open ports) → Show "No open ports found"
- Permission issues → Explain nmap requires root for some scans

## 5. API Endpoints

### `POST /api/scan`
- **Request Body**: `{ target: string, options: object }`
- **Response**: `{ success: boolean, results: object, error?: string }`

### `GET /api/check-nmap`
- **Response**: `{ installed: boolean, version?: string }`

## 6. File Structure
```
nmap-app/
├── app.py              # Flask application
├── requirements.txt    # Python dependencies
├── static/
│   ├── style.css       # Styles
│   └── script.js       # Frontend JavaScript
├── templates/
│   └── index.html      # Main HTML page
└── SPEC.md             # This specification
```
