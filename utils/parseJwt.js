import { Buffer } from 'buffer';

export function parseJwt(token) {
    if (!token) {
      throw new Error('No token provided');
    }
  
    // Split the token into parts: [header, payload, signature]
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token is not a valid JWT');
    }
  
    const encodedPayload = parts[1]; // The payload is in the second position
    try {
      // Convert from base64url to base64 by replacing URL-unsafe chars
      const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
      // Decode the base64 string
      const payloadString = Buffer.from(base64, 'base64').toString('utf8');
      // Parse into an object
      return JSON.parse(payloadString);
    } catch (error) {
      throw new Error('Error decoding token payload: ' + error.message);
    }
  }
  