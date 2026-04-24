### 4/23/2026 - 4/24/2026 Map

Backend (server/)

- Created routes/spots.js route to allow for user-submitted locations to the map
- Created create_spots.sql to store spots in the database

Frontend (app/)

- Added map to (tabs)/global.tsx to allow for user-submitted pins for skate spot locations
- User-submitted pins : users may long-press the map to add a pin
- User-submitted pins : users may press a pin on the map to view its details

### 3/24/2026 - 3/26/2026 Auth

Backend (server/)

- Set up Express with ES modules
- Created a users table with UUID, email, username, password_hash, created_at
- Created a refresh_tokens table to store and revoke tokens
- Signup route — validates input, checks for duplicate email/username, hashes password with bcrypt, saves user to DB
- Signin route — finds user, compares password against hash, issues a short-lived access token (15min) and long-lived refresh token (7 days), stores refresh token in DB
- Refresh route — verifies refresh token, checks it exists in DB, issues a new access token
- Signout route — deletes refresh token from DB
- Auth middleware — verifies access token on protected routes, attaches user to the request

Frontend (app/)

- Installed expo-secure-store for safe token storage
- utility/auth.ts : helper functions to save, get, and clear tokens from secure storage
- utility/config.ts : central API URL so you only change your IP in one place
- utility/fetchWithAuth.ts : wrapper around fetch that automatically refreshes the access token on 401s so users never get logged out unexpectedly
- app/(auth)/signin.tsx : signin screen that stores tokens and redirects to tabs
- app/(auth)/signup.tsx : signup screen that creates user then immediately signs them in
- app/\_layout.tsx : checks for token on app load, redirects to signin or tabs accordingly
- Sign out button on profile screen that clears tokens locally and revokes on the server
