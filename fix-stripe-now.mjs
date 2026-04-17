import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const problemCustomerId = 'cus_UL1DOwzcoXwfE0'

console.log('🔧 Limpiando customer ID problemático...')

const { data, error } = await supabase
  .from('subscriptions')
  .update({ stripe_customer_id: null })
  .eq('stripe_customer_id', problemCustomerId)
  .select()

if (error) {
  console.error('❌ Error:', error.message)
} else {
  console.log('✅ Limpiado correctamente')
  console.log('📊 Registros actualizados:', data?.length || 0)
  if (data && data.length > 0) {
    console.log('Subscriptions limpiadas:', data.map(d => ({ id: d.id, org_id: d.org_id })))
  }
}
