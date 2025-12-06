# Delivery Route Optimization Web Application

A comprehensive logistics management platform for optimizing delivery routes with multi-role support (Admin, Courier, Customer) and real-time package tracking capabilities.

**Experience Qualities**:
1. **Efficient**: Streamlined workflows that minimize clicks and optimize courier routes automatically using intelligent algorithms
2. **Transparent**: Real-time package tracking with live map updates so customers and admins always know package status
3. **Intuitive**: Clear role-based interfaces that guide users through complex logistics operations with minimal training

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This is a sophisticated logistics platform featuring multi-tenant company management, route optimization algorithms, real-time tracking, role-based access control, and comprehensive admin dashboards requiring multiple interconnected views and advanced state management.

## Essential Features

### Authentication & Onboarding
- **Functionality**: Complete auth flow with login, registration, password reset, and role selection
- **Purpose**: Secure access control and proper user routing based on roles
- **Trigger**: App launch or logout
- **Progression**: Splash screen → Login → Role selection (Customer/Admin/Courier) → Company setup/join → Dashboard
- **Success criteria**: Users can register, login securely, and access role-appropriate features

### Company Management
- **Functionality**: Create companies, generate join codes, manage employees (admins/couriers)
- **Purpose**: Enable multi-tenant logistics operations
- **Trigger**: Admin creates or joins company
- **Progression**: Create company → Generate code → Invite employees → Assign roles → Activate couriers
- **Success criteria**: Multiple companies operate independently with proper role assignments

### Package Input & Management
- **Functionality**: Add packages with coordinates, weight, recipient details, generate tracking numbers
- **Purpose**: Build delivery manifest for route optimization
- **Trigger**: Admin enters package data
- **Progression**: Input form → Validation → Save to manifest → Display on map → Generate tracking number
- **Success criteria**: All package data persists and displays correctly with unique tracking codes

### Route Optimization Engine
- **Functionality**: Calculate optimal delivery routes using genetic algorithm considering courier capacity and coordinates
- **Purpose**: Minimize delivery time and distance
- **Trigger**: Admin clicks "Find Route Options"
- **Progression**: Fetch packages + active couriers → Run optimization → Display routes on map → Show metrics → Allow re-optimization
- **Success criteria**: Routes calculated within seconds, showing distance and package distribution

### Courier Interface
- **Functionality**: View assigned packages, see recommended route, update delivery status
- **Purpose**: Guide couriers and track progress
- **Trigger**: Courier logs in
- **Progression**: View dashboard → Check package list → Follow route recommendation → Mark packages delivered
- **Success criteria**: Couriers complete deliveries following optimal routes and update status

### Customer Package Tracking
- **Functionality**: Track packages by tracking number with status timeline and live map
- **Purpose**: Provide transparency to customers
- **Trigger**: Customer enters tracking number
- **Progression**: Enter tracking # → Validate → Show status timeline → Display courier location (if en route)
- **Success criteria**: Accurate real-time tracking for packages within 6-month window

### Admin Dashboard & Monitoring
- **Functionality**: Real-time statistics, route visualization, package monitoring, history logs
- **Purpose**: Complete operational oversight
- **Trigger**: Admin navigates dashboard sections
- **Progression**: View metrics → Monitor routes on map → Check history → Generate reports
- **Success criteria**: All data updates reactively and accurately reflects current state

## Edge Case Handling
- **Empty States**: Show helpful messages when no packages, couriers, or companies exist yet
- **Validation Errors**: Highlight specific fields in red with clear error messages
- **Expired Tracking**: Display "Package history only available for 6 months" for old tracking numbers
- **Invalid Codes**: Show "Company code not found" for wrong join codes
- **Optimization Failures**: Handle cases where no valid route exists due to capacity constraints
- **Duplicate Tracking Numbers**: Ensure unique ID generation for all packages
- **Network Issues**: Show loading states during async operations

## Design Direction
The design should evoke **professional reliability** with a modern logistics tech aesthetic—confident, data-driven, and efficient. The interface should feel like a control center: organized, responsive, and trustworthy.

## Color Selection
A bold logistics-focused palette emphasizing efficiency and clarity with strong contrast for data visibility.

- **Primary Color**: `oklch(0.45 0.15 250)` - Deep blue conveying trust and professionalism in logistics
- **Secondary Colors**: `oklch(0.92 0.02 250)` - Light blue-gray for secondary actions and backgrounds
- **Accent Color**: `oklch(0.65 0.20 140)` - Vibrant teal for CTAs, active routes, and success states
- **Destructive**: `oklch(0.60 0.22 25)` - Warm red for errors and failed deliveries
- **Foreground/Background Pairings**: 
  - Background (White `oklch(0.98 0 0)`): Foreground `oklch(0.20 0.02 250)` - Ratio 12.5:1 ✓
  - Primary (`oklch(0.45 0.15 250)`): White text `oklch(0.98 0 0)` - Ratio 8.2:1 ✓
  - Accent (`oklch(0.65 0.20 140)`): White text `oklch(0.98 0 0)` - Ratio 5.1:1 ✓
  - Cards (`oklch(0.98 0.01 250)`): Foreground `oklch(0.20 0.02 250)` - Ratio 12.3:1 ✓

## Font Selection
Typography should project **technical precision and modern efficiency** suitable for data-heavy logistics interfaces.

- **Primary Font**: IBM Plex Sans - Technical clarity with excellent readability at all sizes
- **Monospace Font**: JetBrains Mono - For tracking numbers, coordinates, and data tables
- **Typographic Hierarchy**:
  - H1 (Page Titles): IBM Plex Sans Semibold/32px/tight tracking
  - H2 (Section Headers): IBM Plex Sans Medium/24px/normal tracking  
  - H3 (Card Titles): IBM Plex Sans Medium/18px/normal tracking
  - Body (Primary Text): IBM Plex Sans Regular/15px/relaxed leading (1.6)
  - Data (Metrics/Codes): JetBrains Mono Medium/14px/normal tracking
  - Small (Metadata): IBM Plex Sans Regular/13px/normal tracking

## Animations
Animations should enhance **spatial awareness and state changes** without delaying operations. Use purposeful motion: smooth page transitions (300ms), instant feedback on interactions (100ms), and gentle route line drawing on maps (500ms ease-out). Route recalculations should show a subtle pulse on the optimize button.

## Component Selection
- **Components**: 
  - Forms: Input, Label, Button for all data entry with inline validation
  - Navigation: Sidebar for admin/courier dashboards with collapsible mobile drawer
  - Data Display: Card for metrics, Table for package lists/history, Badge for status indicators
  - Interactions: Dialog for company creation/join, Alert for validation errors, Toast (sonner) for success confirmations
  - Maps: Leaflet.js integration in Card containers with custom markers
  - Status: Progress for route optimization, Skeleton for loading states
  
- **Customizations**: 
  - Custom map markers with role-specific colors (admin=blue, courier=teal, package=orange)
  - Status timeline component for package tracking with vertical connector lines
  - Metric cards with large numbers and trend indicators
  - Route visualization with polylines and distance/time overlays
  
- **States**:
  - Buttons: Solid primary for main actions, outline for secondary, ghost for navigation, loading spinner for async
  - Inputs: Focused blue ring, error red border with shake animation, success green checkmark icon
  - Cards: Subtle hover lift on interactive elements, active state with border accent
  
- **Icon Selection**: 
  - @phosphor-icons/react: Package for deliveries, MapPin for locations, Truck for couriers, ChartLine for analytics, User for profiles, SignOut for logout, Plus for add actions, Check for completion
  
- **Spacing**: 
  - Page padding: p-6 on desktop, p-4 on mobile
  - Card gaps: gap-4 for form fields, gap-6 for section separation
  - Dashboard grid: grid with gap-6 for metric cards
  
- **Mobile**:
  - Sidebar converts to bottom sheet navigation on <768px
  - Maps adjust height to 50vh on mobile for split view with data
  - Tables convert to stacked card layout on mobile
  - Two-column forms become single column on mobile
  - Metric cards stack vertically with full width
