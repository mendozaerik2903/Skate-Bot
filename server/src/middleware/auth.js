import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // expects "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  if (token === "guest_mode_active") {
    req.user = { 
      id: "guest-user-id", // An ID your database can recognize as a guest or ignore
      email: "guest@example.com",
      role: "guest" 
    };
    return next(); // Exit middleware and move to the controller
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // attach the decoded payload to the request
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export default authenticate;
