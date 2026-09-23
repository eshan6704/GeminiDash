import React from 'react';
import { AlertNotification } from '../../hooks/useTradeSimulator';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

interface NotificationToastProps {
  notifications: AlertNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.slice(0, 4).map((notif) => {
        const isSuccess = notif.type === 'success';
        const isDanger = notif.type === 'danger';
        const isWarning = notif.type === 'warning';

        return (
          <div
            key={notif.id}
            className={`pointer-events-auto p-3 rounded-xl border shadow-xl flex items-start gap-2.5 transition-all animate-in slide-in-from-bottom-2 ${
              isDanger
                ? 'bg-neutral-950 border-rose-500/80 text-white shadow-rose-950/50'
                : isSuccess
                ? 'bg-neutral-950 border-emerald-500/80 text-white shadow-emerald-950/50'
                : isWarning
                ? 'bg-neutral-950 border-amber-500/80 text-white shadow-amber-950/50'
                : 'bg-neutral-900 border-neutral-700 text-neutral-200'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {isDanger && <AlertTriangle className="w-4 h-4 text-rose-500" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {!isSuccess && !isDanger && !isWarning && <Info className="w-4 h-4 text-blue-400" />}
            </div>

            <div className="flex-1 min-w-0 text-xs">
              <h4 className="font-bold leading-tight">{notif.title}</h4>
              <p className="text-neutral-400 text-[11px] mt-0.5 leading-snug">
                {notif.message}
              </p>
            </div>

            <button
              onClick={() => onDismiss(notif.id)}
              className="text-neutral-500 hover:text-white shrink-0 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
