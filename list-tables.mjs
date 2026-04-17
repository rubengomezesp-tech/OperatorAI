import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const tables = [
  'users', 'profiles', 'customers', 'subscriptions', 
  'billing', 'payments', 'user_subscriptions', 'accounts',
  'stripe_customers', 'memberships', 'orders'
]

for (const table of tables) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .limit(1)
  
  if (!error && data) {
    console.log(`✅ ${table}:`, Object.keys(data[0] || {}))
  }
}
