const pool = require('./db');
const crud = {};

crud.createUser = async (userData) => {
    const sql = `
    INSERT INTO users (
        email, password_hash, first_name, last_name, birth_date, weight, height, activity_level, health_conditions, profile_type, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        userData.email,
        userData.password_hash,
        userData.first_name,
        userData.last_name,
        userData.birth_date,
        userData.weight,
        userData.height,
        userData.activity_level,
        userData.health_conditions,
        userData.profile_type,
        userData.description
    ];
    const [result] = await pool.query(sql, values);
    return result.insertId;
};

crud.getUserById = async (userId) => {
    const sql = `SELECT * FROM users WHERE user_id = ?`;
    const [rows] = await pool.query(sql, [userId]);
    return rows[0] || null;
};

crud.getUserByEmail = async (email) => {
    const sql = `SELECT * FROM users WHERE email = ?`;
    const [rows] = await pool.query(sql, [email]);
    return rows[0] || null;
};

crud.updateUser = async (userId, userData) => {
    const sql = `
    UPDATE users 
    SET first_name = ?, last_name = ?, birth_date = ?, weight = ?, height = ?, activity_level = ?, health_conditions = ?, profile_type = ?, description = ?
    WHERE user_id = ?
    `;
    const values = [
        userData.first_name,
        userData.last_name,
        userData.birth_date,
        userData.weight,
        userData.height,
        userData.activity_level,
        userData.health_conditions,
        userData.profile_type,
        userData.description,
        userId
    ];
    const [result] = await pool.query(sql, values);
    return result.affectedRows;
};

crud.deleteUser = async (userId) => {
    const sql = `DELETE FROM users WHERE user_id = ?`;
    const [result] = await pool.query(sql, [userId]);
    return result.affectedRows;
};

module.exports = crud;
