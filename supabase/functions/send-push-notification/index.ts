import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FCMMessage {
  title: string
  body: string
  data?: Record<string, string>
}

function getAppUrl() {
  return Deno.env.get('APP_URL') || Deno.env.get('SITE_URL') || 'https://trustfy.online'
}

async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))

  const unsignedToken = `${header}.${payload}`

  // Import the private key for signing
  const pemContents = serviceAccount.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '')

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  )

  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const jwt = `${header.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.${payload.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.${base64Signature}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`)
  }
  return tokenData.access_token
}

async function sendFCMv1(projectId: string, accessToken: string, deviceToken: string, message: FCMMessage) {
  const appUrl = getAppUrl()
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: deviceToken,
          notification: { title: message.title, body: message.body },
          data: message.data || {},
          webpush: {
            headers: {
              Urgency: 'high',
              TTL: '3600',
            },
            fcm_options: {
              link: appUrl,
            },
            notification: {
              icon: `${appUrl}/icons/icon-192.png`,
              badge: `${appUrl}/icons/icon-192.png`,
              tag: message.data?.type || 'trustfy-push',
              renotify: true,
              requireInteraction: true,
            },
          },
        },
      }),
    }
  )

  const result = await res.json()
  if (!res.ok) {
    console.error('FCM send error:', JSON.stringify(result))
    return { success: false, error: result, token: deviceToken }
  }
  console.log('FCM send success:', JSON.stringify({ name: result?.name, tokenPrefix: deviceToken.slice(0, 12) }))
  return { success: true, data: result, token: deviceToken }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
    if (!serviceAccountJson) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT secret not configured')
    }

    let serviceAccount: any
    try {
      serviceAccount = JSON.parse(serviceAccountJson)
    } catch {
      // Maybe it was double-encoded
      serviceAccount = JSON.parse(JSON.parse(serviceAccountJson))
    }

    if (!serviceAccount.private_key) {
      throw new Error('private_key missing from service account. Keys found: ' + Object.keys(serviceAccount).join(', '))
    }
    const { user_id, title, body, data, platform_filter } = await req.json()

    if (!user_id || !title || !body) {
      return new Response(JSON.stringify({ error: 'Missing user_id, title, or body' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get active device tokens (optionally filtered by platform)
    let query = supabase
      .from('user_devices')
      .select('device_token, platform')
      .eq('user_id', user_id)
      .eq('active', true)
    if (platform_filter) {
      const platforms = Array.isArray(platform_filter) ? platform_filter : [platform_filter]
      query = query.in('platform', platforms)
    }
    const { data: devices, error: devicesError } = await query

    if (devicesError) {
      throw new Error(`Failed to load devices: ${devicesError.message}`)
    }

    if (!devices || devices.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        sent: 0,
        message: platform_filter
          ? `Nenhum dispositivo ${Array.isArray(platform_filter) ? platform_filter.join('/') : platform_filter} ativo.`
          : 'Nenhum dispositivo ativo.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const accessToken = await getAccessToken(serviceAccount)
    const results = await Promise.allSettled(
      devices.map(d => sendFCMv1(serviceAccount.project_id, accessToken, d.device_token, { title, body, data }))
    )

    const sent = results.filter(r => r.status === 'fulfilled' && (r as any).value?.success).length
    const invalidTokens = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && !r.value?.success)
      .filter(r => {
        const code = r.value?.error?.error?.details?.[0]?.errorCode || r.value?.error?.error?.status || ''
        return ['UNREGISTERED', 'INVALID_ARGUMENT', 'NOT_FOUND'].includes(code)
      })
      .map(r => r.value.token)

    if (invalidTokens.length > 0) {
      await supabase
        .from('user_devices')
        .update({ active: false })
        .in('device_token', invalidTokens)
    }

    console.log('Push delivery summary:', JSON.stringify({
      user_id,
      platform_filter: platform_filter || null,
      total: devices.length,
      sent,
      failed: devices.length - sent,
      invalidated: invalidTokens.length,
      platforms: devices.map(d => d.platform),
    }))

    // Save notification in DB
    await supabase.from('notifications').insert({
      user_id,
      title,
      message: body,
      type: data?.type || 'sale',
      data: data || {},
    })

    return new Response(JSON.stringify({ success: true, sent, total: devices.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Push notification error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
