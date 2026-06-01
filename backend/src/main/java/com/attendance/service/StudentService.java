package com.attendance.service;

import com.attendance.model.Student;
import com.attendance.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class StudentService {
    
    @Autowired
    private StudentRepository studentRepository;
    
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }
    
    public Optional<Student> getStudentById(Long id) {
        return studentRepository.findById(id);
    }
    
    public Student saveStudent(Student student) {
        return studentRepository.save(student);
    }
    
    public Student updateStudent(Long id, Student studentData) {
        return studentRepository.findById(id)
            .map(student -> {
                student.setName(studentData.getName());
                student.setRollNumber(studentData.getRollNumber());
                student.setEmail(studentData.getEmail());
                if (studentData.getFaceImagePath() != null) {
                    student.setFaceImagePath(studentData.getFaceImagePath());
                }
                return studentRepository.save(student);
            })
            .orElseThrow(() -> new RuntimeException("Student not found"));
    }
    
    public void deleteStudent(Long id) {
        studentRepository.deleteById(id);
    }
}