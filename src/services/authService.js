const bcrypt = require('bcrypt');
const crud = require('../persistence/crud');

// Helpers: shape a DB user into a safe public object
function toPublicUser(u) {
  if (!u) return null;
  return {
    user_id: u.user_id,
    email: u.email,
    first_name: u.first_name,
    last_name: u.last_name,
    birth_date: u.birth_date,
    weight: u.weight,
    height: u.height,
    activity_level: u.activity_level,
    health_conditions: u.health_conditions,
    profile_type: u.profile_type,
    description: u.description,
    created_at: u.created_at,
    updated_at: u.updated_at,
  };
}

async function register({ first_name, last_name, email, password, birth_date = null, weight = null, height = null, activity_level = null, health_conditions = null, profile_type = null, description = null }) {

  const existingUser = await crud.getUserByEmail(email);
  if (existingUser) {
    const err = new Error('email already exists');
    err.code = 'EMAIL_EXISTS';
    throw err;
  }

  const password_hash = await bcrypt.hash(password, 10);

  const insertId = await crud.createUser({
    email,
    password_hash,
    first_name,
    last_name,
    birth_date,
    weight,
    height,
    activity_level,
    health_conditions,
    profile_type,
    description
  });

 
  const created = await crud.getUserById(insertId);
  return toPublicUser(created);
}

async function login({ email, password }) {
  const user = await crud.getUserByEmail(email);
  if (!user) {
    const err = new Error('User not found');
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

 
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    const err = new Error('Invalid password');
    err.code = 'INVALID_PASSWORD';
    throw err;
  }

  
  return {
    user_id: user.user_id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name
  };
}

async function listUsers() {
  const rows = await crud.getAllUsers();
  return rows.map(toPublicUser);
}

module.exports = { register, login, listUsers };
