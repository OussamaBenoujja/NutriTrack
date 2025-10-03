const crud = require('../persistence/crud');

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

async function updateUserProfile(userId, data) {
  if (!userId) {
    const err = new Error('missing userId');
    err.code = 'BAD_INPUT';
    throw err;
  }

  const user = await crud.getUserById(userId);
  if (!user) {
    const err = new Error('user not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  let healthConditions = user.health_conditions;
  if (data.health_conditions !== undefined) {
    if (Array.isArray(data.health_conditions)) {
      healthConditions = data.health_conditions.map(x => String(x).trim()).filter(Boolean).join(', ');
    } else if (typeof data.health_conditions === 'string') {
      healthConditions = data.health_conditions.trim();
    }
  }

  const payload = {
    first_name: data.first_name !== undefined ? String(data.first_name).trim() : user.first_name,
    last_name: data.last_name !== undefined ? String(data.last_name).trim() : user.last_name,
    birth_date: data.birth_date !== undefined ? String(data.birth_date) : user.birth_date,
    weight: data.weight !== undefined ? Number(data.weight) : user.weight,
    height: data.height !== undefined ? Number(data.height) : user.height,
    activity_level: data.activity_level !== undefined ? String(data.activity_level).trim() : user.activity_level,
    health_conditions: healthConditions,
    profile_type: data.profile_type !== undefined ? String(data.profile_type).trim() : user.profile_type,
    description: data.description !== undefined ? String(data.description).trim() : user.description,
  };

  await crud.updateUser(userId, payload);
  const refreshed = await crud.getUserById(userId);
  return toPublicUser(refreshed);
}

module.exports = {
  updateUserProfile,
  toPublicUser,
};
