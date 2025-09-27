const bcrypt = require('bcrypt');
const { getUserByUsername, createUser, getAllUsers } = require('../models/userModel');

async function register(username, password) {
  const existingUser = await getUserByUsername(username);
  if (existingUser) throw new Error('Username already exists');

  const hashedPassword = await bcrypt.hash(password, 10);
  return createUser(username, hashedPassword);
}

async function login(username, password) {
  const user = await getUserByUsername(username);
  if (!user) throw new Error('User not found');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('Invalid password');

  return { id: user.user_id, username: user.username };
}

async function listUsers() {
  return getAllUsers();
}

module.exports = { register, login, listUsers };
