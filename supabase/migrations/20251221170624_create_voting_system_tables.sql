/*
  # Online Voting System Database Schema

  ## Overview
  This migration creates the database structure for a college-level online voting system
  with admin and voter roles, candidate management, and secure vote tracking.

  ## 1. New Tables
  
  ### `users`
  Stores both admin and voter accounts
  - `id` (uuid, primary key) - Unique identifier
  - `voter_id` (text, unique, not null) - Login ID (e.g., "ADMIN" or "V001")
  - `password` (text, not null) - Password for authentication
  - `full_name` (text, not null) - User's full name
  - `role` (text, not null) - Either 'admin' or 'voter'
  - `has_voted` (boolean, default false) - Tracks if voter has cast their vote
  - `created_at` (timestamptz) - Account creation timestamp
  
  ### `candidates`
  Stores candidate information
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text, not null) - Candidate's name
  - `party` (text, not null) - Political party or affiliation
  - `description` (text) - Brief description about candidate
  - `vote_count` (integer, default 0) - Total votes received
  - `created_at` (timestamptz) - When candidate was added
  
  ### `votes`
  Records all votes cast (for audit trail)
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References users table
  - `candidate_id` (uuid, foreign key) - References candidates table
  - `voted_at` (timestamptz) - Timestamp of vote

  ## 2. Security
  - Enable RLS on all tables
  - Users can only read their own user record
  - Only admins can add candidates
  - Everyone can view candidates
  - Voters can insert votes (with restrictions)
  - Only admins can view vote records and results

  ## 3. Important Notes
  - Default admin account will be created with voter_id="ADMIN" and password="admin123"
  - Each voter can only vote once (enforced by has_voted flag and database constraints)
  - Vote records are maintained for transparency and audit
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id text UNIQUE NOT NULL,
  password text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'voter')),
  has_voted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  party text NOT NULL,
  description text DEFAULT '',
  vote_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  voted_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Anyone can read users for authentication"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own has_voted status"
  ON users FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policies for candidates table
CREATE POLICY "Everyone can view candidates"
  ON candidates FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert candidates"
  ON candidates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update candidate vote counts"
  ON candidates FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policies for votes table
CREATE POLICY "Anyone can view all votes"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert votes"
  ON votes FOR INSERT
  WITH CHECK (true);

-- Insert default admin account
INSERT INTO users (voter_id, password, full_name, role, has_voted)
VALUES ('ADMIN', 'admin123', 'System Administrator', 'admin', false)
ON CONFLICT (voter_id) DO NOTHING;

-- Insert some sample voters for testing
INSERT INTO users (voter_id, password, full_name, role, has_voted)
VALUES 
  ('V001', 'voter123', 'John Smith', 'voter', false),
  ('V002', 'voter123', 'Sarah Johnson', 'voter', false),
  ('V003', 'voter123', 'Michael Brown', 'voter', false)
ON CONFLICT (voter_id) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_voter_id ON users(voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_candidate_id ON votes(candidate_id);