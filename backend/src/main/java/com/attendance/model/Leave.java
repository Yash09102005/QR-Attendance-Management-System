package com.attendance.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "leaves")
public class Leave {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "student_id")
    private Student student;
    
    private LocalDate leaveDate;
    private String reason;
    private String status;

    public Leave() {}

    public Leave(Student student, LocalDate leaveDate, String reason) {
        this.student = student;
        this.leaveDate = leaveDate;
        this.reason = reason;
        this.status = "APPROVED";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }
    public LocalDate getLeaveDate() { return leaveDate; }
    public void setLeaveDate(LocalDate leaveDate) { this.leaveDate = leaveDate; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}