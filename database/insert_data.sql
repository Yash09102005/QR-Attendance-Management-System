USE attendance_db;

-- Insert default users (login credentials)
INSERT INTO users (username, password, name) VALUES 
('yashila', '123', 'Yashila Admin'),
('yash', '1234', 'Yash Teacher');

-- Insert sample students
INSERT INTO students (name, roll_number, email) VALUES 
('John Doe', 'CS001', 'john.doe@example.com'),
('Jane Smith', 'CS002', 'jane.smith@example.com'),
('Mike Johnson', 'CS003', 'mike.johnson@example.com'),
('Sarah Wilson', 'CS004', 'sarah.wilson@example.com'),
('David Brown', 'CS005', 'david.brown@example.com');

-- Insert sample attendance records
INSERT INTO attendance (student_id, status, timestamp) VALUES 
(1, 'PRESENT', '2024-01-15 09:00:00'),
(2, 'PRESENT', '2024-01-15 09:00:00'),
(3, 'ABSENT', '2024-01-15 09:00:00'),
(4, 'PRESENT', '2024-01-15 09:00:00'),
(5, 'PRESENT', '2024-01-15 09:00:00');