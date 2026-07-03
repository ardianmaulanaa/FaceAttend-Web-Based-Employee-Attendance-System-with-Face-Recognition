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

function formatDelay(minutes: number, seconds: number) {
  const safeMinutes = Math.max(0, Number(minutes) || 0);
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  return `${safeMinutes} menit ${safeSeconds} detik`;
}

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

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-amber-200 bg-white p-6 shadow-2xl shadow-slate-950/30 md:p-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
          Wajib Isi Alasan Telat
        </p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">
          Dashboard dikunci sampai alasan dikirim
        </h2>

        <div className="mt-4 grid gap-3 rounded-2xl border border-amber-100 bg-amber-50/40 p-4 text-sm">
          <p className="font-semibold text-slate-700">
            Nama karyawan: <span className="font-black">{employeeName}</span>
          </p>
          <p className="font-semibold text-slate-700">
            Jam masuk seharusnya:{" "}
            <span className="font-black">{scheduledCheckIn}</span>
          </p>
          <p className="font-semibold text-slate-700">
            Jam check-in: <span className="font-black">{checkInTime}</span>
          </p>
          <p className="font-semibold text-slate-700">
            Keterlambatan:{" "}
            <span className="font-black">
              {formatDelay(lateMinutes, lateSeconds)}
            </span>
          </p>
        </div>

        <label className="mt-4 block text-xs font-black uppercase tracking-[0.12em] text-slate-600">
          Alasan keterlambatan
        </label>
        <textarea
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder="Wajib diisi. Contoh: Kemacetan parah di jalur utama dan sudah izin ke atasan."
          className="mt-2 min-h-32 w-full rounded-2xl border border-amber-100 bg-amber-50/30 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400 focus:bg-white"
        />

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-amber-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-amber-200 transition disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Mengirim..." : "Kirim Alasan"}
        </button>
      </div>
    </div>
  );
}
