import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Firebase config placeholder — user will need to add their own keys
const FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

const VAPID_KEY = ''; // User's VAPID key from Firebase console

export function usePushNotifications(userId?: string) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    setSupported(isSupported);
    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!supported) {
      toast.error('Push notifications não são suportadas neste navegador.');
      return null;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // In production, initialize Firebase and get FCM token here:
        // const app = initializeApp(FIREBASE_CONFIG);
        // const messaging = getMessaging(app);
        // const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY });

        // For now, register with a placeholder
        const fcmToken = 'fcm_placeholder_' + Date.now();
        setToken(fcmToken);

        // Register device in Supabase
        if (userId) {
          const platform = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios'
            : /Android/.test(navigator.userAgent) ? 'android' : 'web';

          await supabase.from('user_devices').upsert({
            user_id: userId,
            device_token: fcmToken,
            platform: platform as 'ios' | 'android' | 'web',
            active: true,
          }, { onConflict: 'user_id,device_token' });
        }

        toast.success('Notificações ativadas!');
        return fcmToken;
      } else {
        toast.error('Permissão de notificação negada.');
        return null;
      }
    } catch (error) {
      console.error('Error requesting push permission:', error);
      toast.error('Erro ao ativar notificações.');
      return null;
    }
  };

  return { permission, token, supported, requestPermission };
}
