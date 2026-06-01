package com.attendance;

import com.attendance.model.User;
import com.attendance.model.Student;
import com.attendance.repository.UserRepository;
import com.attendance.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            userRepository.save(new User("yashila", "123", "Yashila Admin", "ADMIN"));
            userRepository.save(new User("yash", "1234", "Yash Teacher", "TEACHER"));
            System.out.println("Default users created:");
            System.out.println("Admin - Username: yashila, Password: 123");
            System.out.println("Teacher - Username: yash, Password: 1234");
        }

        if (studentRepository.count() == 0) {
            studentRepository.save(new Student("Sri Priya", "CS001", "sripriya@example.com"));
            studentRepository.save(new Student("Bharani", "CS002", "bharani@example.com"));
            studentRepository.save(new Student("Preethi", "CS003", "preethi@example.com"));
            studentRepository.save(new Student("Sunitha", "CS004", "sunitha@example.com"));
            studentRepository.save(new Student("Yadhu Nandhini", "CS005", "yadhunandhini@example.com"));
            studentRepository.save(new Student("Mumthi", "CS006", "mumthi@example.com"));
            studentRepository.save(new Student("Maniesha", "CS007", "maniesha@example.com"));
            studentRepository.save(new Student("Sibi Chandran", "CS008", "sibichandran@example.com"));
            studentRepository.save(new Student("Prathaban", "CS009", "prathaban@example.com"));
            studentRepository.save(new Student("Sudhan", "CS010", "sudhan@example.com"));
            System.out.println("Sample students created: 10 students");
        }

        System.out.println("Total students in database: " + studentRepository.count());
        System.out.println("Total users in database: " + userRepository.count());
    }
}