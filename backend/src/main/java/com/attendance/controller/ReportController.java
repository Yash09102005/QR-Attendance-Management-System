package com.attendance.controller;

import com.attendance.model.Attendance;
import com.attendance.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173"})
public class ReportController {

    @Autowired
    private AttendanceRepository attendanceRepository;
    
    @GetMapping("/test")
    public String test() {
        return "Reports controller is working!";
    }

    @GetMapping("/attendance/csv")
    public ResponseEntity<String> downloadAttendanceCSV() {
        List<Attendance> attendanceList = attendanceRepository.findAll();
        
        StringBuilder csv = new StringBuilder();
        csv.append("Student Name,Roll Number,Status,Date,Time\n");
        
        for (Attendance attendance : attendanceList) {
            csv.append(attendance.getStudent().getName()).append(",")
               .append(attendance.getStudent().getRollNumber()).append(",")
               .append(attendance.getStatus()).append(",")
               .append(attendance.getTimestamp().toLocalDate()).append(",")
               .append(attendance.getTimestamp().toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm:ss")))
               .append("\n");
        }
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN);
        headers.setContentDispositionFormData("attachment", "attendance_report.csv");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(csv.toString());
    }

    @GetMapping("/attendance/pdf")
    public ResponseEntity<String> downloadAttendancePDF() {
        try {
            List<Attendance> attendanceList = attendanceRepository.findAll();
        
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><title>Attendance Report</title>")
            .append("<style>body{font-family:Arial,sans-serif;margin:20px;}table{border-collapse:collapse;width:100%;margin-top:20px;}th,td{border:1px solid #ddd;padding:12px;text-align:left;}th{background-color:#f2f2f2;font-weight:bold;}tr:nth-child(even){background-color:#f9f9f9;}h1{color:#333;}</style>")
            .append("</head><body>")
            .append("<h1>Attendance Report</h1>")
            .append("<p><strong>Generated on:</strong> ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("</p>")
            .append("<p><strong>Total Records:</strong> ").append(attendanceList.size()).append("</p>")
            .append("<table><tr><th>Student Name</th><th>Roll Number</th><th>Status</th><th>Date</th><th>Time</th></tr>");
        
        for (Attendance attendance : attendanceList) {
            String statusColor = "PRESENT".equals(attendance.getStatus()) ? "#28a745" : "#dc3545";
            html.append("<tr>")
                .append("<td>").append(attendance.getStudent().getName()).append("</td>")
                .append("<td>").append(attendance.getStudent().getRollNumber()).append("</td>")
                .append("<td style='color:").append(statusColor).append(";font-weight:bold;'>").append(attendance.getStatus()).append("</td>")
                .append("<td>").append(attendance.getTimestamp().toLocalDate()).append("</td>")
                .append("<td>").append(attendance.getTimestamp().toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm:ss"))).append("</td>")
                .append("</tr>");
        }
        
        html.append("</table></body></html>");
        
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=attendance_report.html");
        headers.add("Content-Type", "text/html; charset=UTF-8");
        
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(html.toString());
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error generating report: " + e.getMessage());
        }
    }
}