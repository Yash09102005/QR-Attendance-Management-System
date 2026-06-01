-- Step 1: Create and use database
CREATE DATABASE IF NOT EXISTS attendance_db;
USE attendance_db;

-- Step 2: Create users table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL
);

-- Step 3: Create students table
CREATE TABLE students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

-- Step 4: Create attendance table
CREATE TABLE attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    timestamp DATETIME NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Step 5: Insert login users
INSERT INTO users (username, password, name) VALUES 
('yashila', '123', 'Yashila Admin'),
('yash', '1234', 'Yash Teacher');

-- Step 6: Insert sample students
INSERT INTO students (name, roll_number, email) VALUES 
('John Doe', 'CS001', 'john.doe@example.com'),
('Jane Smith', 'CS002', 'jane.smith@example.com'),
('Mike Johnson', 'CS003', 'mike.johnson@example.com');

-- Step 7: Verify tables created
SHOW TABLES;
SELECT 'Users created:' AS message;
SELECT * FROM users;
SELECT 'Students created:' AS message;
SELECT * FROM students;