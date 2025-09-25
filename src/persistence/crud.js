const pool = require('./db');
const crud = {};

//user CRUD operations
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

//plan CRUD operations
crud.createPlan = async (planData) => {
    const sql = `
    INSERT INTO nutrition_plans (
        user_id, target_calories, target_proteins, target_carbs, target_fats, max_sodium, max_sugar, start_date, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        planData.user_id,
        planData.target_calories,
        planData.target_proteins,
        planData.target_carbs,
        planData.target_fats,
        planData.max_sodium,
        planData.max_sugar,
        planData.start_date,
        planData.is_active
    ];
    const [result] = await pool.query(sql, values);
    return result.insertId;
};

crud.getActivePlanByUserId = async (userId) => {
    const sql = `SELECT * FROM nutrition_plans WHERE user_id = ? AND is_active = 1`;
    const [rows] = await pool.query(sql, [userId]);
    return rows[0] || null;
};

//recommendation CRUD operations
crud.createRecommendation = async (recoData) => {
    const sql = `INSERT INTO recommendations (user_id, content, type) VALUES (?, ?, ?)`;
    const values = [
        recoData.user_id,
        recoData.content,
        recoData.type
    ];
    const [result] = await pool.query(sql, values);
    return result.insertId;
};

crud.getRecommendationsByUserId = async (userId) => {
    const sql = `SELECT * FROM recommendations WHERE user_id = ? ORDER BY created_at DESC`;
    const [rows] = await pool.query(sql, [userId]);
    return rows;
};

crud.markRecommendationAsRead = async (recommendationId) => {
    const sql = `UPDATE recommendations SET is_read = 1 WHERE recommendation_id = ?`;
    const [result] = await pool.query(sql, [recommendationId]);
    return result.affectedRows;
};


module.exports = crud;
