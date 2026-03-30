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
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // contains user_id + redirect_url
    const errorParam = url.searchParams.get('error')

    if (errorParam) {
      const errorDesc = url.searchParams.get('error_description') || 'Permissão negada'
      const stateData = state ? JSON.parse(atob(state)) : {}
      const redirectUrl = stateData.redirect_url || 'https://trustfyv1.lovable.app'
      return Response.redirect(`${redirectUrl}/integracoes?meta_error=${encodeURIComponent(errorDesc)}`, 302)
    }

    if (!code || !state) {
      return new Response(JSON.stringify({ error: 'Missing code or state' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stateData = JSON.parse(atob(state))
    const userId = stateData.user_id
    const redirectUrl = 'https://trustfyv1.lovable.app'

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing user_id in state' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const appId = Deno.env.get('META_APP_ID')!
    const appSecret = Deno.env.get('META_APP_SECRET')!
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Build the redirect_uri that was used in the initial OAuth request
    const callbackUrl = `${supabaseUrl}/functions/v1/meta-oauth-callback`

    // Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(callbackUrl)}&client_secret=${appSecret}&code=${code}`
    )
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData.error)
      return Response.redirect(`${redirectUrl}/integracoes?meta_error=${encodeURIComponent(tokenData.error.message)}`, 302)
    }

    const shortToken = tokenData.access_token

    // Exchange for long-lived token (~60 days)
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`
    )
    const longTokenData = await longTokenRes.json()

    if (longTokenData.error) {
      console.error('Long token error:', longTokenData.error)
      return Response.redirect(`${redirectUrl}/integracoes?meta_error=${encodeURIComponent(longTokenData.error.message)}`, 302)
    }

    const accessToken = longTokenData.access_token
    const expiresIn = longTokenData.expires_in || 5184000 // ~60 days

    // Get user info from Facebook
    const meRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${accessToken}`)
    const meData = await meRes.json()

    // Get ad accounts
    const adAccountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_id,account_status,currency&access_token=${accessToken}`
    )
    const adAccountsData = await adAccountsRes.json()

    const adAccounts = adAccountsData.data || []

    // Save to integrations table
    const config = {
      access_token: accessToken,
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      fb_user_id: meData.id,
      fb_user_name: meData.name,
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
      .eq('user_id', userId)
      .eq('platform', 'meta')

    if (updateError) {
      console.error('DB update error:', updateError)
      return Response.redirect(`${redirectUrl}/integracoes?meta_error=${encodeURIComponent('Erro ao salvar token')}`, 302)
    }

    // Save ad accounts to ad_accounts table
    for (const acc of adAccounts) {
      await supabase
        .from('ad_accounts')
        .upsert({
          user_id: userId,
          account_id: acc.account_id,
          name: acc.name || `Conta ${acc.account_id}`,
          active: acc.account_status === 1,
        }, { onConflict: 'user_id,account_id' })
        .select()
    }

    return Response.redirect(`${redirectUrl}/integracoes?meta_success=true`, 302)
  } catch (error) {
    console.error('Meta OAuth callback error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
