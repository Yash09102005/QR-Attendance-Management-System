-- Create database
CREATE DATABASE IF NOT EXISTS attendance_db;

-- Use the database
USE attendance_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    timestamp DATETIME NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Insert default users
INSERT IGNORE INTO users (username, password, name) VALUES 
('yashila', '123', 'Yashila Admin'),
('yash', '1234', 'Yash Teacher');

-- Insert sample students
INSERT IGNORE INTO students (name, roll_number, email) VALUES 
('John Doe', 'CS001', 'john.doe@example.com'),
('Jane Smith', 'CS002', 'jane.smith@example.com'),
('Mike Johnson', 'CS003', 'mike.johnson@example.com');