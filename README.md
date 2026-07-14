# Skate Bot

A full-stack React Native application that allows skateboarders to play virtual games of SKATE against AI opponents and discover local skate spots.

## Screenshots

## Features

- User authentication with JWT and refresh tokens
- Custom trick builder
- Local skate spot discovery
- User profiles and game history
- PostgreSQL persistence

## Tech Stack

### Frontend

- React Native
- Expo Router
- TypeScript

### Backend

- Node.js
- Express

### Database

- PostgreSQL

### Authentication

- JWT
- bcrypt

### DevOps

- GitHub Actions
- Render

## Architecture

React Native App => Express API => PostgreSQL Database

## Technical Challenges

### Authentication

Implemented JWT access and refresh token rotation to maintain secure sessions.

### Game Logic

Designed a scoring engine capable of tracking trick progession and determining match outcomes. Designed AI opponents to intelligently pick tricks tailored to their own skater personality.

Allowed users to design their own AI opponent's tricks and probability of landing. Designed a modular trick selector to improve UI experience and

## Lessons Learned

- Designing RESTful APIs
- Managing authentication flows
- Database schema design
- React Native navigation patterns
- Mobile app architecture
- Iterating through UI/UX designs
- Algorithmic behaviors

## Future Improvements

- Multiplayer support
- Copy previous match history bots
- Real-time game invitations
- Skate spot image uploading/viewing
- Skate spot rating/reporting
- Push notifications
- App Store deployment

## Installation

git clone ...
cd skate-bot
npm install
npm run dev

## Live Demo

Frontend:
https://...

Backend:
https://...
