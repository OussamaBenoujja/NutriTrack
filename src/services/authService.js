const bcrypt = require('bcrypt');
const crud = require('../persistence/crud');

async function register(email, password, name) {
    try {
        // Check if user already exists
        const existingUser = await crud.getUserByEmail(email);
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Split name into first and last name
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Create user data for database
        const userData = {
            email: email,
            password_hash: hashedPassword,
            first_name: firstName,
            last_name: lastName,
            birth_date: null,
            weight: null,
            height: null,
            activity_level: null,
            health_conditions: null,
            profile_type: 'General', // Default profile type
            description: null
        };

        // Create user in database
        const userId = await crud.createUser(userData);
        
        // Return user without password
        return { 
            id: userId, 
            email: email, 
            name: name,
            first_name: firstName,
            last_name: lastName
        };
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

async function login(email, password) {
    try {
        // Find user by email in database
        const user = await crud.getUserByEmail(email);
        if (!user) {
            return null; // User not found
        }

        // Compare password
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return null; // Invalid password
        }

        // Return user without password
        return { 
            id: user.user_id, 
            email: user.email, 
            name: `${user.first_name} ${user.last_name}`.trim(),
            first_name: user.first_name,
            last_name: user.last_name
        };
    } catch (error) {
        console.error('Login error:', error);
        return null;
    }
}

async function listUsers() {
    try {
        // This would need to be implemented in crud.js if needed
        // For now, return empty array
        return [];
    } catch (error) {
        console.error('List users error:', error);
        return [];
    }
}

module.exports = { register, login, listUsers };