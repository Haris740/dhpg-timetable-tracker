import { useState, useEffect } from 'react';
import { Bell, BellOff, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface NotificationManagerProps {
  permission: NotificationPermission;
  onRequestPermission: () => Promise<NotificationPermission>;
}

export function NotificationManager({ permission, onRequestPermission }: NotificationManagerProps) {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkPushSubscription();
  }, []);

  async function checkPushSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    setSubscription(sub);
  }

  async function subscribeToPush() {
    try {
      setIsSubscribing(true);
      setError(null);
      
      const res = await onRequestPermission();
      
      if (res !== 'granted') {
          setError('Notification permission denied');
          return;
      }

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      
      setSubscription(sub);
      console.log('Push Subscription:', JSON.stringify(sub));
    } catch (err: any) {
      console.error('Failed to subscribe to push notifications:', err);
      setError(err.message || 'Failed to subscribe');
    } finally {
      setIsSubscribing(false);
    }
  }

  const copyToClipboard = () => {
    if (!subscription) return;
    navigator.clipboard.writeText(JSON.stringify(subscription));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (typeof Notification === 'undefined' || !('PushManager' in window)) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="space-y-6">
        {/* Local Alerts Section */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
              permission === 'granted' ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            )}>
              <Bell size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Offline Local Alerts</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {permission === 'granted' ? 'Alarms Ready (Stay Backgrounded)' : 'Notify me when class starts'}
              </p>
            </div>
          </div>
          <button
            onClick={subscribeToPush}
            disabled={isSubscribing || permission === 'granted'}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50",
              permission === 'granted'
                ? "bg-green-50 dark:bg-green-900/10 text-green-600 border border-green-100 dark:border-green-900/30" 
                : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg"
            )}
          >
            {permission === 'granted' ? 'Active' : isSubscribing ? 'Processing...' : 'Enable'}
          </button>
        </div>

        {permission === 'granted' && (
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
              <span className="text-green-500 font-black">✓ Offline mode active.</span> Your schedule is synced. To ensure you get alerts, keep Timetable Pro open in your background apps.
            </p>
          </div>
        )}

        <hr className="border-slate-100 dark:border-slate-800" />

        {/* Advanced/Push Section */}
        <div className="opacity-60 grayscale-[0.5]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
              <BellOff size={16} />
            </div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Advanced: Remote Push</h4>
          </div>
          
          {subscription ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Remote Push Subscription</label>
                <div className="text-[10px] font-mono text-slate-500 break-all line-clamp-1">
                  {JSON.stringify(subscription)}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="absolute right-2 top-2 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {copySuccess ? <CheckCircle2 size={12} className="text-green-500" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Use for server-side alerts if preferred.
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-3 text-red-500 text-xs font-bold">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
