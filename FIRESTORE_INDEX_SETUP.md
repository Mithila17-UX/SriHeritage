# Firestore Index Setup for Chat Sessions

## 🔧 Required Index

The chat history feature requires a composite index in Firestore. Here's how to set it up:

### **Option 1: Use the Direct Link (Recommended)**

Click this link to create the required index:
```
https://console.firebase.google.com/v1/r/project/sriheritage-b77b3/firestore/indexes?create_composite=Cldwcm9qZWN0cy9zcmloZXJpdGFnZS1iNzdiMy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvY2hhdF9zZXNzaW9ucy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoNCgl1cGRhdGVkQXQQAhoMCghfX25hbWVfXxAC
```

### **Option 2: Manual Setup**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `sriheritage-b77b3`
3. Navigate to **Firestore Database** → **Indexes**
4. Click **Create Index**
5. Configure the index:
   - **Collection ID**: `chat_sessions`
   - **Fields to index**:
     - `userId` (Ascending)
     - `updatedAt` (Descending)
   - **Query scope**: Collection

### **Index Details**

- **Collection**: `chat_sessions`
- **Fields**: 
  - `userId` (Ascending)
  - `updatedAt` (Descending)
- **Purpose**: Efficiently query chat sessions by user and sort by last updated

### **Fallback Solution**

The app includes a fallback mechanism that works without the index:
- Uses a simpler query without `orderBy`
- Sorts results in memory
- Works immediately without index setup

### **Verification**

After creating the index:
1. Wait 1-2 minutes for the index to build
2. Restart the app
3. Check the console for "✅ Loaded chat sessions" messages
4. The chat history should load without errors

### **Troubleshooting**

If you still see index errors:
1. Ensure the index is fully built (check Firebase Console)
2. Clear app cache and restart
3. The fallback mechanism will work regardless

## 📱 Current Status

The app will work with or without the index:
- **With index**: Optimal performance, sorted results
- **Without index**: Fallback mode, still functional 