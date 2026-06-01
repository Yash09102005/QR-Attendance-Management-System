USE attendance_db;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL
);

-- Create students table
CREATE TABLE students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

-- Create attendance table
CREATE TABLE attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    timestamp DATETIME NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Insert default users
INSERT INTO users (username, password, name) VALUES 
('yashila', '123', 'Yashila Admin'),
('yash', '1234', 'Yash Teacher');

-- Insert sample students
INSERT INTO students (name, roll_number, email) VALUES 
('John Doe', 'CS001', 'john.doe@example.com'),
('Jane Smith', 'CS002', 'jane.smith@example.com'),
('Mike Johnson', 'CS003', 'mike.johnson@example.com');

-- Show created tables
SHOW TABLES;
SELECT * FROM users;
SELECT * FROM students;