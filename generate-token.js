import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your_token'
const anonKey = jwt.sign(
  { role: 'anon', iss: 'supabase' },
  JWT_SECRET,
  { expiresIn: '10y' }
);

const serviceRoleKey = jwt.sign(
  { role: 'service_role', iss: 'supabase' },
  JWT_SECRET,
  { expiresIn: '10y' }
);

console.log('ANON_KEY:\n', anonKey);
console.log('\nSERVICE_ROLE_KEY:\n', serviceRoleKey);

