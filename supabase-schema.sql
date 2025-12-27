-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  rating INTEGER DEFAULT 1200,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matchmaking_queue table
CREATE TABLE matchmaking_queue (
  user_id UUID REFERENCES profiles(id) PRIMARY KEY,
  rating INTEGER NOT NULL,
  rounds INTEGER NOT NULL DEFAULT 5,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rooms table
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  total_rounds INTEGER NOT NULL DEFAULT 5,
  current_round INTEGER DEFAULT 1,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  rematch_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create room_players table
CREATE TABLE room_players (
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  move TEXT CHECK (move IN ('rock', 'paper', 'scissors') OR move IS NULL),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- Create chat_messages table
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for matchmaking_queue
CREATE POLICY "Users can manage their own queue entry" ON matchmaking_queue
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for rooms
CREATE POLICY "Users can view rooms they're in" ON rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM room_players 
      WHERE room_players.room_id = rooms.id 
      AND room_players.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rooms they're in" ON rooms
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM room_players 
      WHERE room_players.room_id = rooms.id 
      AND room_players.user_id = auth.uid()
    )
  );

-- RLS Policies for room_players
CREATE POLICY "Users can view room players for their rooms" ON room_players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM room_players rp2
      WHERE rp2.room_id = room_players.room_id 
      AND rp2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own room player data" ON room_players
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert room players" ON room_players
  FOR INSERT WITH CHECK (true);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their rooms" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM room_players 
      WHERE room_players.room_id = chat_messages.room_id 
      AND room_players.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their rooms" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM room_players 
      WHERE room_players.room_id = chat_messages.room_id 
      AND room_players.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_rating ON profiles(rating DESC);
CREATE INDEX idx_matchmaking_queue_rating ON matchmaking_queue(rating);
CREATE INDEX idx_matchmaking_queue_rounds ON matchmaking_queue(rounds);
CREATE INDEX idx_room_players_room_id ON room_players(room_id);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- Function to automatically clean up old queue entries
CREATE OR REPLACE FUNCTION cleanup_old_queue_entries()
RETURNS void AS $$
BEGIN
  DELETE FROM matchmaking_queue 
  WHERE joined_at < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Player') || '#' || floor(random() * 9999 + 1)::text,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();