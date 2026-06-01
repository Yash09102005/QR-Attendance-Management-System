USE attendance_db;

-- Add more students to the database
INSERT INTO students (name, roll_number, email) VALUES 
('Alice Johnson', 'CS006', 'alice.johnson@example.com'),
('Bob Smith', 'CS007', 'bob.smith@example.com'),
('Carol Davis', 'CS008', 'carol.davis@example.com'),
('Daniel Wilson', 'CS009', 'daniel.wilson@example.com'),
('Emma Brown', 'CS010', 'emma.brown@example.com'),
('Frank Miller', 'CS011', 'frank.miller@example.com'),
('Grace Taylor', 'CS012', 'grace.taylor@example.com'),
('Henry Anderson', 'CS013', 'henry.anderson@example.com'),
('Ivy Thomas', 'CS014', 'ivy.thomas@example.com'),
('Jack White', 'CS015', 'jack.white@example.com'),
('Kate Harris', 'CS016', 'kate.harris@example.com'),
('Leo Martin', 'CS017', 'leo.martin@example.com'),
('Mia Garcia', 'CS018', 'mia.garcia@example.com'),
('Noah Rodriguez', 'CS019', 'noah.rodriguez@example.com'),
('Olivia Lewis', 'CS020', 'olivia.lewis@example.com'),
('Paul Walker', 'CS021', 'paul.walker@example.com'),
('Quinn Hall', 'CS022', 'quinn.hall@example.com'),
('Ruby Allen', 'CS023', 'ruby.allen@example.com'),
('Sam Young', 'CS024', 'sam.young@example.com'),
('Tina King', 'CS025', 'tina.king@example.com');

-- Show all students
SELECT COUNT(*) as 'Total Students' FROM students;
SELECT * FROM students ORDER BY roll_number;