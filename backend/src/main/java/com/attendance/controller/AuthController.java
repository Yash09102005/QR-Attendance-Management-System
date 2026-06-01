package com.attendance.controller;

import com.attendance.model.User;
import com.attendance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173"})
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        
        User user = userRepository.findByUsername(username);
        Map<String, Object> response = new HashMap<>();
        
        if (user != null && user.getPassword().equals(password)) {
            response.put("success", true);
            response.put("user", Map.of(
                "id", user.getId(),
                "name", user.getName(), 
                "username", user.getUsername(),
                "role", user.getRole()
            ));
        } else {
            response.put("success", false);
            response.put("message", "Invalid credentials");
        }
        
        return response;
    }
    
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    @PostMapping("/register")
    public User registerUser(@RequestBody User user) {
        return userRepository.save(user);
    }
    
    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
    }
}