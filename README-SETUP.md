# Smart Parking System - Setup Instructions

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project with Firestore enabled

### 1. Install Dependencies
```bash
cd smart-parking
npm install
```

### 2. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use existing one
3. Enable Authentication (Email/Password)
4. Enable Firestore Database
5. Update `src/firebase/config.ts` with your Firebase config

### 3. Initialize Admin User and Sample Data

#### Option A: Using the setup script (Recommended)
1. Download your Firebase Admin SDK private key:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `serviceAccountKey.json` in the project root

2. Run the setup script:
```bash
node setup-admin.js
```

This will create:
- Admin user: `admin@smartparking.com` / `admin123456`
- Regular user: `user@example.com` / `user123456`
- 3 parking zones (Zone A, B, C)
- 75 parking spots across all zones
- Sample reservations

#### Option B: Manual setup
If you prefer to set up manually, you can:
1. Create an admin user through the app registration
2. Manually update their role to 'admin' in Firestore
3. Use the admin panel to create zones and spots

### 4. Run the Application
```bash
npm start
```

The app will open at `http://localhost:8100`

## 🔑 Default Credentials

### Admin User
- **Email**: admin@smartparking.com
- **Password**: admin123456
- **Role**: Admin (full access to admin panel)

### Regular User
- **Email**: user@example.com
- **Password**: user123456
- **Role**: User (can make reservations)

## 📱 Features Implemented

### ✅ User Features
- **Authentication**: Login/Register with Firebase Auth
- **Home Page**: 
  - Real-time parking spot availability
  - Multiple zone selection
  - Zone information display
  - Statistics cards (available, total, occupied, reserved spots)
- **Reservations**: 
  - Create new reservations (pending admin approval)
  - View personal reservation history
  - Real-time status updates
- **QR Scanner**: Ready for spot check-in functionality

### ✅ Admin Features
- **Dashboard**: 
  - Real-time analytics
  - User count, spot availability, pending reservations
  - Revenue tracking, occupancy rates
- **Zone Management**:
  - Create, edit, delete parking zones
  - Set price multipliers and features
- **Spot Management**:
  - Create, edit, delete parking spots
  - Update spot availability (available/occupied/maintenance)
  - Assign spots to zones
- **Reservation Management**:
  - View all reservations
  - Approve/reject pending reservations
  - Real-time reservation monitoring
- **User Management**:
  - View all registered users
  - Monitor user activity and loyalty points

### ✅ Technical Features
- **Real-time Updates**: All data syncs in real-time using Firestore
- **No Mock Data**: All data comes from Firebase Firestore
- **Responsive Design**: Works on mobile and desktop
- **Role-based Access**: Admin panel restricted to admin users
- **Error Handling**: Comprehensive error handling and user feedback

## 🗄️ Database Structure

### Collections
- **users**: User profiles and preferences
- **zones**: Parking zones with pricing and features
- **parkingSpots**: Individual parking spots with status
- **reservations**: Booking records with approval workflow

### Sample Data Created
- **3 Zones**: Premium covered (Zone A), Standard outdoor (Zone B), Economy with charging (Zone C)
- **75 Spots**: Distributed across zones with different types and sizes
- **2 Users**: One admin, one regular user
- **Sample Reservations**: For testing the approval workflow

## 🔧 Customization

### Adding New Zones
1. Login as admin
2. Go to Admin Panel → Zones
3. Click "Add Zone"
4. Fill in zone details and features

### Adding New Spots
1. Login as admin
2. Go to Admin Panel → Spots
3. Click "Add Spot"
4. Select zone, set coordinates, and configure spot details

### Managing Reservations
1. Users create reservations (status: pending)
2. Admin approves/rejects reservations
3. Approved reservations can be activated via QR code

## 🚀 Deployment

### Web Deployment
```bash
npm run build
firebase deploy --only hosting
```

### Mobile App
```bash
npx cap add ios
npx cap add android
npx cap sync
npx cap open ios    # For iOS
npx cap open android # For Android
```

## 📊 Analytics & Monitoring

The admin dashboard provides:
- Real-time occupancy rates
- Revenue tracking
- User activity monitoring
- Reservation approval workflow
- Spot utilization statistics

## 🔒 Security

- Firebase Authentication for user management
- Role-based access control
- Firestore security rules (configure as needed)
- Input validation and sanitization

## 🆘 Troubleshooting

### Common Issues
1. **Firebase connection errors**: Check your config in `src/firebase/config.ts`
2. **Admin access denied**: Ensure user role is set to 'admin' in Firestore
3. **No data showing**: Run the setup script to populate sample data
4. **Build errors**: Clear node_modules and reinstall dependencies

### Support
- Check Firebase Console for authentication and database issues
- Review browser console for JavaScript errors
- Ensure Firestore rules allow read/write access for authenticated users

## 🎯 Next Steps

1. **Payment Integration**: Add Stripe/PayPal for reservation payments
2. **Push Notifications**: Implement Firebase Cloud Messaging
3. **Advanced Analytics**: Add more detailed reporting
4. **IoT Integration**: Connect with physical parking sensors
5. **Mobile App**: Build and deploy native mobile apps

---

**🚗 Your Smart Parking System is ready to use!**

Login with the admin credentials to start managing your parking zones and spots, or use the regular user account to test the reservation workflow.