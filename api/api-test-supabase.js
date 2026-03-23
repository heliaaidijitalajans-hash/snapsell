import { supabase } from "../lib/supabase";

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from("users")
    .select("*");

  console.log("DATA:", data);
  console.log("ERROR:", error);

  res.status(200).json({ data, error });
}