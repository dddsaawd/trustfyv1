import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getFirebaseMessaging, getToken, onMessage, VAPID_KEY } from '@/lib/firebase';
import { toast } from 'sonner';

export function usePushNotifications(userId?: string) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const tokenRequestInFlight = useRef(false);

  useEffect(() => {
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    setSupported(isSupported);
    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Listen for foreground messages
  useEffect(() => {
    const messaging = getFirebaseMessaging();
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || 'TRUSTFY';
      const body = payload.notification?.body || '';
      
      // Play sale notification sound
      try {
        const audio = new Audio('/sounds/sale-notification.mp3');
        audio.volume = 0.7;
        audio.play().catch(() => {});
      } catch (e) {}
      
      toast.success(`${title}: ${body}`);
    });

    return () => unsubscribe();
  }, []);

  const registerToken = useCallback(async (fcmToken: string) => {
    if (!userId) return;
    const platform = /iPhone|iPad|iPod/.test(navigator.userAgent)
      ? 'ios'
      : /Android/.test(navigator.userAgent)
        ? 'android'
        : 'web';

    const { error } = await supabase.from('user_devices').upsert(
      {
        user_id: userId,
        device_token: fcmToken,
        platform: platform as 'ios' | 'android' | 'web',
        active: true,
      },
      { onConflict: 'user_id,device_token' }
    );

    if (error) {
      console.error('Error registering device token:', error);
    }
  }, [userId]);

  const requestPermission = useCallback(async (showSuccessToast = true) => {
    if (tokenRequestInFlight.current) return token;

    if (!supported) {
      toast.error('Push notifications não são suportadas neste navegador.');
      return null;
    }

    tokenRequestInFlight.current = true;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        toast.error('Permissão de notificação negada.');
        return null;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

      const messaging = getFirebaseMessaging();
      if (!messaging) {
        toast.error('Firebase Messaging não disponível.');
        return null;
      }

      const fcmToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (fcmToken) {
        setToken(fcmToken);
        await registerToken(fcmToken);
        if (showSuccessToast) {
          toast.success('Notificações push ativadas! 🔔');
        }
        return fcmToken;
      } else {
        toast.error('Não foi possível obter token de notificação.');
        return null;
      }
    } catch (error) {
      console.error('Error requesting push permission:', error);
      toast.error('Erro ao ativar notificações.');
      return null;
    } finally {
      tokenRequestInFlight.current = false;
    }
  }, [supported, registerToken, token]);

  // Auto-request if already granted (e.g. returning user)
  useEffect(() => {
    if (supported && userId && permission === 'granted' && !token) {
      requestPermission(false);
    }
  }, [supported, userId, permission, token, requestPermission]);

  return { permission, token, supported, requestPermission };
}
