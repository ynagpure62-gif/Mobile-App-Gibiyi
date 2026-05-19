// Import the Supabase client creation function to interact with Supabase services
import { createClient } from "@supabase/supabase-js";
// Import necessary types from express for Request, Response, and NextFunction
import { type Request, type Response, type NextFunction } from "express";

// Retrieve the Supabase URL from environment variables
const supabaseUrl = process.env.SUPABASE_URL!;
// Retrieve the Supabase Anon Key from environment variables
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

// Initialize the Supabase client using the URL and Anon Key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define a custom interface for AuthRequest that extends the default Express Request
// This allows us to attach user-specific information (like userId and userEmail) to the request
export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

// Middleware function to enforce authentication on specific routes
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  // Extract the authorization header from the incoming request
  const authHeader = req.headers.authorization;

  // If no authorization header is found, return a 401 Unauthorized error
  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }

  // Extract the actual token from the "Bearer <token>" format
  const token = authHeader.replace("Bearer ", "");

  try {
    // Verify the user's token with Supabase and fetch the associated user data
    const { data: { user }, error } = await supabase.auth.getUser(token);

    // If an error occurs or no user is found, return a 401 Unauthorized error
    if (error || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Attach the verified user's ID and Email to the request object for use in subsequent route handlers
    req.userId = user.id;
    req.userEmail = user.email;
    
    // Proceed to the next middleware or route handler
    return next();
  } catch (err) {
    // Catch any unexpected errors during token verification and return a 401 Unauthorized error
    return res.status(401).json({ error: "Authentication failed" });
  }
}
