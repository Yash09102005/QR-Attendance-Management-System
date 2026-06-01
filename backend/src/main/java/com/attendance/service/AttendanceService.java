package com.attendance.service;

import com.attendance.model.Attendance;
import com.attendance.model.Student;
import com.attendance.repository.AttendanceRepository;
import com.attendance.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AttendanceService {
    
    @Autowired
    private AttendanceRepository attendanceRepository;
    
    @Autowired
    private StudentRepository studentRepository;
    
    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }
    
    public Attendance markAttendance(Long studentId, String status) {
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found"));
        
        Attendance attendance = new Attendance(student, status);
        return attendanceRepository.save(attendance);
    }
}