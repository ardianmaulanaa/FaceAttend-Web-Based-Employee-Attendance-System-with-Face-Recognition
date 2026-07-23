"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  IdCard,
  Loader2,
  Mail,
  Network,
  Phone,
} from "lucide-react";

import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type UserRelation = {
  id: string;
  name: string;
} | null;

type FaceCardUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  status: string;
  profile_photo: string | null;
  nik?: string | null;
  employment_start_date?: string | null;
  employment_end_date?: string | null;
  department?: UserRelation;
  position?: UserRelation;
  jabatan?: UserRelation;
  unit?: UserRelation;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();
}

function formatRole(role: string) {
  const roleMap: Record<string, string> = {
    owner: "Pemilik",
    admin: "Admin",
    cs: "CS",
    employee: "Karyawan",
    OWNER: "Pemilik",
    ADMIN: "Admin",
    CS: "CS",
    EMPLOYEE: "Karyawan",
  };

  return roleMap[role] || role;
}

function formatStatus(status: string) {
  const statusMap: Record<string, string> = {
    active: "Aktif",
    inactive: "Nonaktif",
    ACTIVE: "Aktif",
    INACTIVE: "Nonaktif",
  };

  return statusMap[status] || status;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatEmploymentPeriod(user: FaceCardUser) {
  const startDate = formatDate(user.employment_start_date);
  const endDate = formatDate(user.employment_end_date);

  if (startDate === "-" && endDate === "-") return "-";
  if (startDate === "-") return `Sampai ${endDate}`;
  if (endDate === "-") return `Mulai ${startDate}`;

  return `${startDate} - ${endDate}`;
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

function FaceCardMotionStyles() {
  return (
    <style>{`
      @keyframes faceCardEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .face-card-enter {
        animation: faceCardEnter 320ms ease-out both;
      }

      @media (prefers-reduced-motion: reduce) {
        .face-card-enter {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

export default function FaceCardPage() {
  const router = useRouter();
  const [user, setUser] = useState<FaceCardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        const data = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error(
            data.error || data.message || "Gagal mengambil kartu identitas.",
          );
        }

        setUser(data.user);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Gagal mengambil kartu identitas.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  const initials = user?.name ? getInitials(user.name) : "";

  const identityRows = useMemo(() => {
    if (!user) return [];

    return [
      {
        label: "NIK",
        value: user.nik || "-",
        icon: IdCard,
      },
      {
        label: "Email",
        value: user.email,
        icon: Mail,
      },
      {
        label: "Telepon",
        value: user.phone || "-",
        icon: Phone,
      },
      {
        label: "Posisi",
        value: user.position?.name || "-",
        icon: BriefcaseBusiness,
      },
      {
        label: "Divisi",
        value: user.department?.name || "-",
        icon: Network,
      },
      {
        label: "Jabatan",
        value: user.jabatan?.name || "-",
        icon: BriefcaseBusiness,
      },
      {
        label: "Status",
        value: formatStatus(user.status),
        icon: BadgeCheck,
      },
      {
        label: "Masa Kerja",
        value: formatEmploymentPeriod(user),
        icon: CalendarDays,
      },
    ];
  }, [user]);

  return (
    <MobileShell variant="employee" withBottomPadding={false}>
      <FaceCardMotionStyles />

      <div className="hidden md:block">
        <AppHeader
          title="Kartu Identitas"
          subtitle="Kartu identitas karyawan"
          variant="employee"
        />
      </div>

      <main className="min-h-dvh bg-white pb-28 text-slate-950 md:bg-gradient-to-br md:from-[#f6f8ff] md:via-white md:to-[#eef4ff]">
        <section className="mx-auto max-w-5xl px-5 pt-5 md:px-10 md:pt-8">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5 md:hidden">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#123456] transition hover:bg-[#f8fbff] active:scale-[0.96]"
            >
              <ArrowLeft size={25} strokeWidth={2.8} />
            </button>

            <h1 className="text-xl font-black text-[#123456]">
              Kartu Identitas
            </h1>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#123456] shadow-sm shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-[#f8fbff] active:scale-[0.96]"
            >
              <ArrowLeft size={25} strokeWidth={2.8} />
            </button>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                Identitas
              </p>
              <h1 className="mt-1 text-3xl font-black text-[#123456]">
                Kartu Identitas
              </h1>
            </div>
          </div>

          {loading ? (
            <div className="face-card-enter mt-8 flex items-center gap-3 rounded-3xl border border-blue-100 bg-[#f8fbff] p-5 text-sm font-bold text-slate-500">
              <Loader2 size={20} className="animate-spin text-[#123c8c]" />
              Mengambil kartu identitas...
            </div>
          ) : errorMessage || !user ? (
            <div className="face-card-enter mt-8 rounded-3xl border border-red-100 bg-red-50 px-6 py-8 text-center">
              <p className="text-sm font-black text-red-700">
                {errorMessage || "Kartu identitas tidak ditemukan."}
              </p>
            </div>
          ) : (
            <div className="face-card-enter -mx-5 mt-8 overflow-x-auto px-5 pb-3 md:mx-0 md:overflow-visible md:px-0">
              <div className="relative mx-auto w-[680px] overflow-hidden rounded-[1.5rem] border border-[#123c8c]/20 bg-[#123c8c] shadow-2xl shadow-blue-950/20 md:w-full md:max-w-[980px]">
                <div className="absolute right-0 top-0 h-24 w-44 rounded-bl-full bg-white/10" />
                <div className="absolute bottom-0 left-0 h-28 w-56 rounded-tr-full bg-white/10" />
                <img
                  src="/images/creativemu-logo/creativemu.png"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute right-4 top-1/2 h-28 w-28 -translate-y-1/2 object-contain opacity-[0.07] md:right-10 md:h-60 md:w-60"
                />
                <div className="grid min-h-[310px] grid-cols-[240px_1fr] md:min-h-[390px] md:grid-cols-[300px_1fr]">
                  <div className="relative flex flex-col items-center justify-center border-r border-white/20 p-6 text-center text-white md:p-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-100 md:text-xs md:tracking-[0.28em]">
                      PRESENSI
                    </p>

                    <div className="mt-4 flex h-36 w-30 items-center justify-center overflow-hidden rounded-2xl border-[4px] border-white bg-[#eaf1ff] text-3xl font-black text-[#123c8c] shadow-lg shadow-blue-950/25 md:mt-5 md:h-44 md:w-36 md:text-4xl">
                      {user.profile_photo ? (
                        <img
                          src={user.profile_photo}
                          alt={user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>

                    <p className="mt-4 max-w-full break-words text-xl font-black leading-6 text-white md:mt-5 md:text-2xl md:leading-7">
                      {user.name}
                    </p>
                    <p className="mt-2 rounded-full bg-white/15 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-blue-50 ring-1 ring-white/20 md:text-xs md:tracking-[0.14em]">
                      {formatRole(user.role)}
                    </p>
                  </div>

                  <div className="relative min-w-0 bg-[#f8fbff]/95 p-6 md:p-8">
                    <img
                      src="/images/creativemu-logo/creativemu.png"
                      alt=""
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-5 right-4 h-24 w-24 object-contain opacity-[0.06] md:bottom-10 md:right-10 md:h-52 md:w-52"
                    />
                    <div className="flex items-start justify-between gap-4 border-b border-[#123c8c]/15 pb-4 md:pb-5">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#123c8c] md:text-xs md:tracking-[0.22em]">
                          Kartu Karyawan
                        </p>
                        <h2 className="mt-1 text-3xl font-black leading-tight text-[#123456] md:text-4xl">
                          Identitas Pegawai
                        </h2>
                      </div>

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#123c8c] text-white md:h-14 md:w-14">
                        <IdCard size={24} strokeWidth={2.6} className="md:h-7 md:w-7" />
                      </div>
                    </div>

                    <div className="relative mt-4 grid grid-cols-2 gap-x-5 gap-y-3 md:mt-5 md:gap-x-6 md:gap-y-4">
                      {identityRows.map((item) => (
                        <div key={item.label} className="min-w-0">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#123c8c] text-white md:h-10 md:w-10">
                              <item.icon size={16} strokeWidth={2.7} className="md:h-[18px] md:w-[18px]" />
                            </div>

                            <div className="min-w-0 border-b border-[#123c8c]/10 pb-2 md:pb-3">
                              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 md:text-xs md:tracking-[0.14em]">
                                {item.label}
                              </p>
                              <p className="mt-1 break-words text-sm font-black leading-5 text-[#123456] md:text-base md:leading-6">
                                {item.value}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="relative mt-4 flex items-center justify-between gap-2 rounded-2xl bg-[#123c8c] px-5 py-3 md:mt-5">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                        Creativemu
                      </p>
                      <BadgeCheck
                        size={20}
                        strokeWidth={2.7}
                        className="shrink-0 text-white md:h-[22px] md:w-[22px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <BottomNav />
      </main>
    </MobileShell>
  );
}
