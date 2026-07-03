import { AlertCircle, Clock } from "lucide-react";

type LateReasonModalProps = {
  open: boolean;
  employeeName: string;
  scheduledCheckIn: string;
  checkInTime: string;
  lateMinutes: number;
  lateSeconds: number;
  reason: string;
  isSubmitting: boolean;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
};

export default function LateReasonModal({
  open,
  employeeName,
  scheduledCheckIn,
  checkInTime,
  lateMinutes,
  lateSeconds,
  reason,
  isSubmitting,
  onReasonChange,
  onSubmit,
}: LateReasonModalProps) {
  if (!open) return null;

  const isReasonEmpty = !reason.trim();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-red-200/50 bg-white p-6 shadow-2xl shadow-red-950/40 md:p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Sleek top warning stripe */}
        <div className="absolute left-0 top-0 h-2 w-full bg-gradient-to-r from-amber-500 via-red-500 to-amber-500" />
        
        {/* Warning Icon Box */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 shadow-inner">
          <AlertCircle size={32} strokeWidth={2.3} className="animate-bounce duration-1000" />
        </div>

        <div className="mt-5 text-center">
          {/* Requested format: (Nama), kamu telat */}
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            <span className="text-[#123c8c]">{employeeName}</span>, kamu telat
          </h2>
          
          {/* Requested format: - (jam : menit : detik) - */}
          <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-base font-black tracking-wider text-red-700">
            <Clock size={16} strokeWidth={2.8} />
            <span>- {checkInTime} -</span>
          </p>

          <p className="mt-4 text-sm font-semibold leading-relaxed text-slate-500">
            Kamu check-in melewati jam masuk seharusnya yaitu <span className="font-bold text-slate-700">{scheduledCheckIn}</span>. 
            Dashboard Anda dikunci hingga alasan keterlambatan dikirimkan.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/40 p-4 text-xs font-semibold text-amber-900/90 leading-relaxed">
          <p className="font-black text-amber-950 mb-1 flex items-center gap-1.5">
            📋 Keterangan Keterlambatan:
          </p>
          Terlambat sekitar <span className="font-black text-red-700">{lateMinutes} menit {lateSeconds} detik</span>. 
          Poin kehadiran Anda akan disesuaikan secara otomatis.
        </div>

        <div className="mt-6">
          <label htmlFor="late-reason-input" className="block text-xs font-black uppercase tracking-[0.16em] text-slate-600">
            Alasan Keterlambatan <span className="text-red-500">*</span>
          </label>
          <textarea
            id="late-reason-input"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Wajib diisi. Contoh: Ban motor bocor di jalan / macet parah di jembatan..."
            className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
          />
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || isReasonEmpty}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-red-200 transition hover:from-red-700 hover:to-amber-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          {isSubmitting ? (
            <span>Mengirim Alasan...</span>
          ) : (
            <span>Kirim Alasan & Buka Dashboard</span>
          )}
        </button>
      </div>
    </div>
  );
}
