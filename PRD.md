# Delivery Route Optimization Web Application

A comprehensive logistics management platform for optimizing delivery routes with multi-role support (Admin, Courier, Customer) and real-time package tracking capabilities.

**Experience Qualities**:
1. **Efficient**: Streamlined workflows that minimize clicks and optimize courier routes automatically using intelligent algorithms
2. **Transparent**: Real-time package tracking with live map updates so customers and admins always know package status
3. **Intuitive**: Clear role-based interfaces with simplified navigation that guide users through complex logistics operations with minimal training

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This is a sophisticated logistics platform featuring multi-tenant company management, route optimization algorithms, real-time tracking, role-based access control, and comprehensive admin dashboards requiring multiple interconnected views and advanced state management.

## Essential Features

### Authentication & Onboarding
- **Functionality**: Complete auth flow with login, registration, password reset, and role selection (Customer/Admin/Courier)
- **Purpose**: Secure access control and proper user routing based on roles
- **Trigger**: App launch or logout
- **Progression**: Splash screen → Login → Role selection → Dashboard (Customer gets direct access, Admin/Courier need company setup/join)
- **Success criteria**: Users can register, login securely, and access role-appropriate features

### Customer Interface (NEW)
- **Functionality**: Simple dashboard with greeting, order placement, and package tracking
- **Purpose**: Enable customers to place orders and track their packages easily
- **Trigger**: Customer logs in after role selection
- **Progression**: View home greeting → Place order or check package status
- **Success criteria**: Customers can access their personalized dashboard and interact with order/tracking features

### Simplified Navigation (NEW)
- **Functionality**: Streamlined sidebar with photo placeholder, menu items, and sign out
- **Purpose**: Provide clean, focused navigation experience
- **Trigger**: After successful login
- **Progression**: View options → Select action → Navigate to feature
- **Success criteria**: All roles have consistent, easy-to-use navigation with clear visual hierarchy

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
- **Role-Based Access**: Customers skip company selection, directly access simplified dashboard

## Design Direction
The design should evoke **professional simplicity** with a modern, clean aesthetic—organized, approachable, and user-friendly. The interface emphasizes clarity with centered content cards and minimal navigation.

## Color Selection
A clean, neutral palette with subtle color accents for a professional appearance.

- **Primary Color**: `oklch(0.45 0.15 250)` - Deep blue for branding and primary actions
- **Secondary Colors**: `oklch(0.92 0.02 250)` - Light blue-gray for selected states and backgrounds
- **Accent Color**: `oklch(0.65 0.20 140)` - Vibrant teal for CTAs and highlights
- **Background**: `oklch(0.98 0 0)` - Near-white for clean, spacious feeling
- **Foreground/Background Pairings**: 
  - Background (White `oklch(0.98 0 0)`): Foreground `oklch(0.20 0.02 250)` - Ratio 12.5:1 ✓
  - Card backgrounds with subtle borders for visual separation
  - Muted text for labels and secondary information

## Font Selection
Typography should project **modern clarity and approachability** suitable for diverse user roles.

- **Primary Font**: IBM Plex Sans - Professional clarity with excellent readability
- **Monospace Font**: JetBrains Mono - For tracking numbers and technical data
- **Typographic Hierarchy**:
  - H1 (Greeting/Page Titles): IBM Plex Sans Medium/24px/normal tracking
  - H2 (Section Headers): IBM Plex Sans Medium/20px/normal tracking  
  - Body (Primary Text): IBM Plex Sans Regular/16px/relaxed leading (1.6)
  - Labels: IBM Plex Sans Regular/14px/normal tracking
  - Small (Metadata): IBM Plex Sans Regular/13px/text-muted-foreground

## Animations
Animations should be **subtle and functional**, enhancing usability without distraction. Button hover states (100ms), smooth transitions between views (300ms), gentle highlight on active menu items.

## Component Selection
- **Components**: 
  - Navigation: Simplified sidebar (192px/12rem width) with photo placeholder, text-only menu items
  - Content: Card containers for main content areas with generous padding
  - Buttons: Large outline buttons (h-24) for primary actions on home screen
  - Text: Centered role indicator ("Sebagai Customer/Admin/Courier")
  - Mobile: Sheet drawer for sidebar on small screens
  
- **Customizations**: 
  - Photo placeholder: Circular div with "Photo" text instead of avatar
  - Menu items: Text-only buttons without icons for cleaner look
  - Sign out: Positioned at bottom of sidebar
  - Greeting format: "Halo, [Username]" with action buttons below
  
- **States**:
  - Menu items: Ghost variant with secondary background when active
  - Buttons: Outline style with border-2 for prominence
  - Hover: Subtle background changes only
  
- **Spacing**: 
  - Sidebar: 192px (w-48) fixed width
  - Main content: ml-48 on desktop to accommodate sidebar
  - Card padding: p-8 for generous white space
  - Button gaps: gap-4 between action buttons
  
- **Mobile**:
  - Sidebar converts to slide-out sheet on mobile
  - Content adjusts to full width with top navigation bar
  - Action buttons remain side-by-side on larger mobile screens
