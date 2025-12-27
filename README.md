# Rock-Paper-Scissors Game

[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A classic web-based implementation of Rock, Paper, Scissors...
A modern, feature-rich Rock Paper Scissor game built with React and real-time multiplayer capabilities. Challenge friends, climb the rankings, and enjoy seamless gameplay with authentication and persistent user data.

[**View Live Demo**](https://rock-paper-scissor-topaz-beta.vercel.app/)

## Features

### Game Modes
- **Single Player**: Test your skills against an AI opponent with varying difficulty levels
- **Multiplayer**: Play real-time matches with other players online
- **Quick Play**: Jump into instant games without setup

### Authentication
- **User Registration & Login**: Secure account creation and authentication
- **Session Management**: Persistent sessions with automatic login recovery
- **Social Features**: User profiles with game history

### Ranking System
- **Global Leaderboard**: Compete globally and track your standing
- **ELO Rating**: Dynamic rating system that reflects skill level
- **Match History**: View past games and statistics
- **Achievement Badges**: Unlock achievements based on milestones

### Real-time Gameplay
- **Live Multiplayer**: Instant game updates with WebSocket support
- **Latency Optimization**: Smooth gameplay with minimal lag
- **Match Notifications**: Real-time alerts for game events

## Tech Stack

### Frontend
- **React 18**: Modern UI library with hooks and concurrent features
- **Vite 5**: Lightning-fast build tool and development server
- **CSS3**: Modern styling with responsive design

### Backend & Database
- **Supabase**: Open-source Firebase alternative with PostgreSQL
- **Real-time Subscriptions**: WebSocket-based live updates
- **Authentication**: Built-in Supabase Auth

### Additional Tools
- **Node.js**: JavaScript runtime
- **npm/yarn**: Package management

## Local Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Git
- A Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/hrishikhapekar/Rock-Paper-Scissor.git
   cd Rock-Paper-Scissor
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Variables Setup**

   Create a `.env.local` file in the project root with the following variables:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Game Configuration
   VITE_API_ENDPOINT=http://localhost:3000/api
   VITE_WS_ENDPOINT=ws://localhost:3000
   
   # Environment
   VITE_ENV=development
   ```

   **How to get Supabase credentials:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create a new project or select an existing one
   - Navigate to Settings → API
   - Copy your `Project URL` and `anon public key`

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   The application will be available at `http://localhost:5173`

### Database Setup

1. **Create tables in Supabase**
   - Log into your Supabase project dashboard
   - Go to the SQL Editor
   - Run the SQL scripts provided in `database/schema.sql`

2. **Enable Real-time Subscriptions**
   - In Supabase Dashboard, go to Replication
   - Enable replication for the necessary tables

## Building for Production

### Build the project
```bash
npm run build
# or
yarn build
```

This creates an optimized production build in the `dist` directory.

### Preview the production build locally
```bash
npm run preview
# or
yarn preview
```

## Deployment

### Deploying to Vercel (Recommended)
1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Set the environment variables in Vercel dashboard
5. Deploy with a single click

### Deploying to Netlify
1. Build the project: `npm run build`
2. Go to [Netlify](https://netlify.com)
3. Drag and drop the `dist` folder, or
4. Connect your GitHub repository for continuous deployment
5. Configure environment variables in Netlify settings

### Environment Variables for Production
Set the following variables in your hosting platform:
```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_API_ENDPOINT=your_production_api_endpoint
VITE_WS_ENDPOINT=your_production_ws_endpoint
VITE_ENV=production
```

## Project Structure

```
Rock-Paper-Scissor/
├── src/
│   ├── components/
│   │   ├── Game/
│   │   │   ├── GameBoard.jsx
│   │   │   ├── PlayerChoice.jsx
│   │   │   └── GameResult.jsx
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── Leaderboard/
│   │   │   └── Leaderboard.jsx
│   │   └── Common/
│   │       ├── Header.jsx
│   │       └── Footer.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useGame.js
│   │   └── useLeaderboard.js
│   ├── services/
│   │   ├── supabaseClient.js
│   │   ├── authService.js
│   │   ├── gameService.js
│   │   └── leaderboardService.js
│   ├── styles/
│   │   ├── App.css
│   │   └── index.css
│   ├── App.jsx
│   └── main.jsx
├── database/
│   └── schema.sql
├── public/
├── .env.local
├── vite.config.js
├── package.json
└── README.md
```

## Database Schema Reference

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  elo_rating INTEGER DEFAULT 1000,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Matches Table
```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL REFERENCES users(id),
  player2_id UUID NOT NULL REFERENCES users(id),
  player1_choice VARCHAR(10),
  player2_choice VARCHAR(10),
  winner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Leaderboard Table
```sql
CREATE VIEW leaderboard AS
SELECT 
  id,
  username,
  elo_rating,
  wins,
  losses,
  ROUND((wins::FLOAT / NULLIF(wins + losses, 0) * 100)::NUMERIC, 2) as win_percentage
FROM users
ORDER BY elo_rating DESC;
```

## How to Play

1. **Register or Login**
   - Create a new account or log in with existing credentials
   - Your ELO rating starts at 1000

2. **Choose Game Mode**
   - Single Player: Play against AI
   - Multiplayer: Challenge another player

3. **Make Your Choice**
   - Click on Rock, Paper, or Scissor
   - Your choice is submitted

4. **View Results**
   - See the opponent's choice
   - Check the match outcome
   - ELO rating is updated based on result

5. **Check Rankings**
   - Visit the Leaderboard page
   - See where you stand globally
   - Track your progress

## Contributing

We welcome contributions! If you have ideas or improvements:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Write or update tests**
5. **Commit your changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request**

### Ideas for Contribution
- Add more game modes (Best of 3, Tournament mode)
- Implement chat functionality
- Add mobile app version with React Native
- Create advanced statistics dashboard
- Implement friend system
- Add game replays and analysis
- Improve AI difficulty levels
- Add themed skins and customization

## License

This project is open-sourced.

## Support

For issues, questions, or suggestions:

- **GitHub Issues**: [Create an issue](https://github.com/hrishikhapekar/Rock-Paper-Scissor/issues)
- **Email**: [Contact the maintaine](khapekar2005@gmail.com)

## Acknowledgments

- Built with [React](https://react.dev)
- Powered by [Supabase](https://supabase.com)
- Bundled with [Vite](https://vitejs.dev)
- Deployed on [Vercel](https://vercel.com) / [Netlify](https://netlify.com)

---

**Happy Playing! 🎮**
