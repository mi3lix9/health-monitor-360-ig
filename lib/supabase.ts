import { createClient } from "@supabase/supabase-js";

// Add better error handling for Supabase client initialization

// Replace the createServerClient function with this improved version:
const createServerClient = () => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables for server client");
      throw new Error("Missing required Supabase environment variables");
    }

    return createClient(supabaseUrl, supabaseServiceKey);
  } catch (error) {
    console.error("Error creating Supabase server client:", error);
    throw error;
  }
};

// Replace the createBrowserClient function with this improved version:
const createBrowserClient = () => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        "Missing Supabase environment variables for browser client"
      );
      throw new Error("Missing required Supabase environment variables");
    }

    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error("Error creating Supabase browser client:", error);
    throw error;
  }
};

// Browser client singleton
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

// Replace the getBrowserClient function with this improved version:
export const getBrowserClient = () => {
  try {
    if (!browserClient) {
      browserClient = createBrowserClient();
    }
    return browserClient;
  } catch (error) {
    console.error("Error getting browser client:", error);
    throw error;
  }
};

// Replace the getServerClient function with this improved version:
export const getServerClient = () => {
  try {
    return createServerClient();
  } catch (error) {
    console.error("Error getting server client:", error);
    throw error;
  }
};
