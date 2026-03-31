import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { user_id, access_token, user_name, fb_user_id } = await req.json()

    if (!user_id || !access_token) {
      return new Response(JSON.stringify({ error: 'Missing user_id or access_token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const appId = Deno.env.get('META_APP_ID')!
    const appSecret = Deno.env.get('META_APP_SECRET')!
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Exchange short-lived SDK token for long-lived token (~60 days)
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${access_token}`
    )
    const longTokenData = await longTokenRes.json()

    if (longTokenData.error) {
      console.error('Long token exchange error:', longTokenData.error)
      return new Response(JSON.stringify({ error: longTokenData.error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const longLivedToken = longTokenData.access_token
    const expiresIn = longTokenData.expires_in || 5184000

    // Get ad accounts
    const adAccountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_id,account_status,currency&access_token=${longLivedToken}`
    )
    const adAccountsData = await adAccountsRes.json()
    const adAccounts = adAccountsData.data || []

    // Save to integrations table
    const config = {
      access_token: longLivedToken,
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      fb_user_id: fb_user_id,
      fb_user_name: user_name,
      ad_accounts: adAccounts.map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        account_id: acc.account_id,
        status: acc.account_status,
        currency: acc.currency,
      })),
      connected_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('integrations')
      .update({
        config,
        status: 'connected',
        last_sync: new Date().toISOString(),
      })
      .eq('user_id', user_id)
      .eq('platform', 'meta')

    if (updateError) {
      console.error('DB update error:', updateError)
      return new Response(JSON.stringify({ error: 'Erro ao salvar token' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Save ad accounts
    for (const acc of adAccounts) {
      await supabase
        .from('ad_accounts')
        .upsert({
          user_id: user_id,
          account_id: acc.account_id,
          name: acc.name || `Conta ${acc.account_id}`,
          active: acc.account_status === 1,
        }, { onConflict: 'user_id,account_id' })
        .select()
    }

    return new Response(JSON.stringify({ 
      success: true, 
      ad_accounts_count: adAccounts.length,
      fb_user_name: user_name,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Meta SDK token error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
