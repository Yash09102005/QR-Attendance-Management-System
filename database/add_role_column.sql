USE attendance_db;

-- Add role column to users table
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'TEACHER';

-- Update existing users with roles
UPDATE users SET role = 'ADMIN' WHERE username = 'yashila';
UPDATE users SET role = 'TEACHER' WHERE username = 'yash';

-- Verify the update
SELECT * FROM users;