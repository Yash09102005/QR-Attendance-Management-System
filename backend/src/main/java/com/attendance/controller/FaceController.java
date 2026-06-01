package com.attendance.controller;

import com.attendance.model.Student;
import com.attendance.model.Attendance;
import com.attendance.repository.StudentRepository;
import com.attendance.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/api/face")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "http://localhost:5173" })
public class FaceController {

    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private AttendanceRepository attendanceRepository;

    private final String UPLOAD_DIR = "./uploads/faces/";

    @PostMapping("/upload/{studentId}")
    public Map<String, Object> uploadFaceImage(@PathVariable Long studentId, @RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();

        try {
            Student student = studentRepository.findById(studentId).orElse(null);
            if (student == null) {
                response.put("success", false);
                response.put("message", "Student not found");
                return response;
            }

            // Create upload directory if it doesn't exist
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            // Save file with standardized filename
            String fileName = "student_" + studentId + "_face.jpg";
            Path filePath = Paths.get(UPLOAD_DIR + fileName);
            Files.write(filePath, file.getBytes());

            // Update student with face image path
            student.setFaceImagePath(fileName);
            studentRepository.save(student);

            // Log the full file path for debugging
            System.out.println("✅ Face image saved: " + filePath.toAbsolutePath());
            System.out.println("📁 File exists: " + Files.exists(filePath));
            System.out.println("🌐 URL will be: http://localhost:8081/uploads/faces/" + fileName);

            System.out.println("Updated student " + student.getName() + " with face image: " + fileName);

            response.put("success", true);
            response.put("message", "Face image uploaded successfully");
            response.put("fileName", fileName);
            response.put("imageUrl", "http://localhost:8081/uploads/faces/" + fileName);

        } catch (IOException e) {
            response.put("success", false);
            response.put("message", "Failed to upload image: " + e.getMessage());
        }

        return response;
    }

    @GetMapping("/image/{studentId}")
    public Map<String, Object> getFaceImage(@PathVariable Long studentId) {
        Map<String, Object> response = new HashMap<>();

        Student student = studentRepository.findById(studentId).orElse(null);
        if (student != null && student.getFaceImagePath() != null) {
            response.put("success", true);
            response.put("imagePath", student.getFaceImagePath());
        } else {
            response.put("success", false);
            response.put("message", "No face image found for this student");
        }

        return response;
    }
    
    @GetMapping("/test")
    public String testEndpoint() {
        return "Face controller is working!";
    }
    
    @GetMapping("/reports/csv")
    public ResponseEntity<String> downloadCSV() {
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
        headers.add("Content-Disposition", "attachment; filename=attendance_report.csv");
        headers.add("Content-Type", "text/csv; charset=UTF-8");
        
        return ResponseEntity.ok().headers(headers).body(csv.toString());
    }
    
    @GetMapping("/reports/pdf")
    public ResponseEntity<String> downloadPDF() {
        List<Attendance> attendanceList = attendanceRepository.findAll();
        
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><title>Attendance Report</title>")
            .append("<style>body{font-family:Arial,sans-serif;margin:20px;}table{border-collapse:collapse;width:100%;margin-top:20px;}th,td{border:1px solid #ddd;padding:12px;text-align:left;}th{background-color:#f2f2f2;}</style>")
            .append("</head><body><h1>Attendance Report</h1>")
            .append("<p>Generated: ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("</p>")
            .append("<table><tr><th>Student</th><th>Roll</th><th>Status</th><th>Date</th><th>Time</th></tr>");
        
        for (Attendance attendance : attendanceList) {
            html.append("<tr><td>").append(attendance.getStudent().getName()).append("</td>")
                .append("<td>").append(attendance.getStudent().getRollNumber()).append("</td>")
                .append("<td>").append(attendance.getStatus()).append("</td>")
                .append("<td>").append(attendance.getTimestamp().toLocalDate()).append("</td>")
                .append("<td>").append(attendance.getTimestamp().toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm:ss"))).append("</td></tr>");
        }
        
        html.append("</table></body></html>");
        
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=attendance_report.html");
        headers.add("Content-Type", "text/html; charset=UTF-8");
        
        return ResponseEntity.ok().headers(headers).body(html.toString());
    }
}