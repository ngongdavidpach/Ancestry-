// FIRESTORE_RULES.md
// Copy these rules into Firebase Console → Firestore → Rules

/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Communities
    match /communities/{communityId} {
      allow read: if resource.data.isPublic == true || 
                     request.auth.uid in resource.data.memberIds ||
                     request.auth.uid in resource.data.adminIds;
      allow create: if request.auth != null;
      allow update: if request.auth.uid in resource.data.adminIds;
      allow delete: if request.auth.uid == resource.data.createdBy;
    }

    // Members
    match /members/{memberId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }

    // Activity log
    match /activityLog/{logId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
*/

// STORAGE RULES
// Firebase Console → Storage → Rules

/*
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{communityId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
*/
