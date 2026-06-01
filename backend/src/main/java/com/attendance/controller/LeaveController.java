package com.attendance.controller;

import com.attendance.model.Leave;
import com.attendance.model.Student;
import com.attendance.repository.LeaveRepository;
import com.attendance.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaves")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173"})
public class LeaveController {

    @Autowired
    private LeaveRepository leaveRepository;
    
    @Autowired
    private StudentRepository studentRepository;

    @GetMapping
    public List<Leave> getAllLeaves() {
        return leaveRepository.findAll();
    }

    @PostMapping("/mark")
    public Leave markLeave(@RequestBody Map<String, Object> request) {
        Long studentId = Long.valueOf(request.get("studentId").toString());
        String dateStr = request.get("date").toString();
        String reason = request.get("reason").toString();
        
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student != null) {
            LocalDate leaveDate = LocalDate.parse(dateStr);
            Leave leave = new Leave(student, leaveDate, reason);
            return leaveRepository.save(leave);
        }
        return null;
    }
}