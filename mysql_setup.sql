-- Create database
CREATE DATABASE IF NOT EXISTS attendance_db;
USE attendance_db;

-- Create students table
CREATE TABLE students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    face_image_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create attendance table
CREATE TABLE attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Create users table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL
);

-- Insert sample users
INSERT INTO users (username, password, name, role) VALUES
('yashila', '123', 'Yashila Admin', 'ADMIN'),
('yash', '1234', 'Yash Teacher', 'TEACHER');

-- Insert sample students
INSERT INTO students (name, roll_number, email) VALUES
('Sri Priya', 'CS001', 'sripriya@example.com'),
('Bharani', 'CS002', 'bharani@example.com'),
('Preethi', 'CS003', 'preethi@example.com'),
('Sunitha', 'CS004', 'sunitha@example.com'),
('Yadhu Nandhini', 'CS005', 'yadhunandhini@example.com');