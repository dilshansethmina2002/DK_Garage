import jwt from 'jsonwebtoken';

// 1. Verifies if the user is logged in
export const verifyToken = (req, res, next) => {
  // Tokens are usually sent in the header as: "Bearer <token>"
  const token = req.header('Authorization')?.split(' ')[1]; 
  
  if (!token) return res.status(401).json({ message: 'Access Denied: No token provided' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Attach the decoded payload (like user ID and role) to the request
    next(); // Move to the next function
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// 2. Checks if the user has the right permissions
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission' });
    }
    next();
  };
};