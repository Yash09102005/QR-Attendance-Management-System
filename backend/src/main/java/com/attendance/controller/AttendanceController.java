package com.attendance.controller;

import com.attendance.model.Attendance;
import com.attendance.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173"})
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @GetMapping
    public List<Attendance> getAllAttendance() {
        return attendanceService.getAllAttendance();
    }

    @PostMapping("/mark")
    public ResponseEntity<Attendance> markAttendance(@RequestBody Map<String, Object> request) {
        try {
            Long studentId = Long.valueOf(request.get("studentId").toString());
            String status = request.get("status").toString();
            
            Attendance attendance = attendanceService.markAttendance(studentId, status);
            return ResponseEntity.ok(attendance);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}