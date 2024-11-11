import { verify } from 'jsonwebtoken';

export class AuthError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthError';
  }
}

export function validateApiKey(apiKey) {
  return apiKey === process.env.API_KEY;
}

export function validateToken(token) {
  try {
    return verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AuthError('Invalid token');
  }
}

export function requireAuth(handler) {
  return async (req, res) => {
    try {
      const apiKey = req.headers['x-api-key'];
      if (!validateApiKey(apiKey)) {
        throw new AuthError();
      }
      return handler(req, res);
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(401).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
} 