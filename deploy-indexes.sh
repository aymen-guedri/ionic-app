#!/bin/bash

# Firestore Index Deployment Instructions
# 
# To fix the missing Firestore index error, you need to deploy the indexes.
# 
# 1. Install Firebase CLI globally (if not already installed):
#    npm install -g firebase-tools
# 
# 2. Login to Firebase:
#    firebase login
# 
# 3. Deploy the indexes:
#    firebase deploy --only firestore:indexes
# 
# Alternatively, you can create the index manually in the Firebase Console:
# 1. Go to https://console.firebase.google.com/
# 2. Select your project (smart-parking-ca9cb)
# 3. Go to Firestore Database > Indexes
# 4. Click "Create Index"
# 5. Collection ID: reservations
# 6. Add fields:
#    - userId (Ascending)
#    - createdAt (Descending)
# 7. Click "Create Index"

echo "Please follow the instructions above to deploy Firestore indexes"