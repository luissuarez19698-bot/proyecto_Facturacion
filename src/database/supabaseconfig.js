import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cxotvsplbyygxavgtgox.supabase.co";
const supabaseKey = "sb_publishable_zFLW0Qu5Gy4BzR6060gYrQ_OpnauHvr";

export const supabase = createClient(supabaseUrl, supabaseKey);