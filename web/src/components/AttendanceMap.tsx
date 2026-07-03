"use client";

import { useMemo } from "react";
import { MapPin, Navigation, ShieldCheck, TriangleAlert } from "lucide-react";
import {
  getDistanceInMeters,
  type GeoPoint,
  type OfficeGeofence,
} from "@/lib/geo";

type AttendanceMapProps = {
  userLocation: GeoPoint;
  userAccuracy: number;
  offices: OfficeGeofence[];
  matchedOfficeId: string | null;
};

function formatDistance(distance: number) {
  if (distance < 1000) {
    return `${Math.round(distance)} m`;
  }

  return `${(distance / 1000).toFixed(2)} km`;
}

export default function AttendanceMap({
  userLocation,
  userAccuracy,
  offices,
  matchedOfficeId,
}: AttendanceMapProps) {
  const nearestOffices = useMemo(() => {
    return offices
      .map((office) => ({
        office,
        distance: getDistanceInMeters(userLocation, {
          lat: office.latitude,
          lng: office.longitude,
        }),
      }))
      .sort((left, right) => left.distance - right.distance)
      .slice(0, 3);
  }, [offices, userLocation]);

  const matchedOffice = offices.find((office) => office.id === matchedOfficeId);
  const accuracyAllowed = userAccuracy <= 100;

  return (
    <section className="rounded-[2rem] border border-blue-100 bg-[#f8fbff] p-5 shadow-sm md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
            Lokasi Absensi
          </p>
          <h3 className="mt-2 text-xl font-black text-slate-950">
            Peta validasi GPS
          </h3>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            Sistem mencocokkan titik kamu dengan radius kantor aktif.
          </p>
        </div>

        <div
          className={`rounded-2xl px-4 py-3 text-xs font-black ${accuracyAllowed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
        >
          {accuracyAllowed ? "Akurasi aman" : "Akurasi perlu diperbaiki"}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-white bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Latitude
          </p>
          <p className="mt-2 text-sm font-black text-slate-900">
            {userLocation.lat.toFixed(6)}
          </p>
        </div>

        <div className="rounded-3xl border border-white bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Longitude
          </p>
          <p className="mt-2 text-sm font-black text-slate-900">
            {userLocation.lng.toFixed(6)}
          </p>
        </div>

        <div className="rounded-3xl border border-white bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Accuracy
          </p>
          <p className="mt-2 text-sm font-black text-slate-900">
            ±{Math.round(userAccuracy)} meter
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.7rem] border border-blue-100 bg-white">
        <div className="grid min-h-[240px] gap-0 md:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(18,60,140,0.18),transparent_28%),radial-gradient(circle_at_80%_30%,rgba(59,130,246,0.16),transparent_22%),linear-gradient(135deg,#eaf1ff_0%,#f8fbff_60%,#ffffff_100%)] p-6">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,60,140,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(18,60,140,0.06)_1px,transparent_1px)] bg-[size:28px_28px] opacity-60" />

            <div className="relative flex h-full items-center justify-center">
              <div className="absolute h-52 w-52 rounded-full border border-[#123c8c]/15" />
              <div className="absolute h-36 w-36 rounded-full border border-[#123c8c]/20" />

              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#123c8c] text-white shadow-2xl shadow-blue-300/40 ring-8 ring-white">
                <Navigation size={32} strokeWidth={2.4} />
              </div>

              {matchedOffice ? (
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-emerald-100 bg-emerald-50/95 p-4 text-emerald-700 shadow-sm backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-sm font-black">Lokasi cocok</p>
                      <p className="mt-1 text-sm font-semibold leading-6">
                        {matchedOffice.name} berada dalam radius absensi.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-amber-100 bg-amber-50/95 p-4 text-amber-700 shadow-sm backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-sm font-black">Belum cocok</p>
                      <p className="mt-1 text-sm font-semibold leading-6">
                        Titik kamu belum masuk radius kantor aktif.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 p-5 md:p-6">
            <div className="flex items-center gap-2 text-[#123c8c]">
              <MapPin size={18} />
              <p className="text-xs font-black uppercase tracking-[0.22em]">
                Kantor Terdekat
              </p>
            </div>

            {nearestOffices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-blue-100 bg-[#f8fbff] p-4 text-sm font-semibold text-slate-500">
                Belum ada kantor aktif untuk divalidasi.
              </div>
            ) : (
              nearestOffices.map(({ office, distance }) => {
                const isMatched = office.id === matchedOfficeId;

                return (
                  <div
                    key={office.id}
                    className={`rounded-2xl border p-4 ${isMatched ? "border-emerald-100 bg-emerald-50" : "border-blue-100 bg-white"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">
                          {office.name}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          Radius {office.radius_meters} m
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-black ${isMatched ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {formatDistance(distance)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
