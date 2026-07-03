"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Clock3,
  ImageUp,
  Loader2,
  MapPin,
  Power,
  RotateCcw,
  ScanFace,
  ShieldCheck,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type AttendanceAction = "check-in" | "check-out";

function isCameraAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function createAbortError(message: string) {
  const error = new Error(message);
  error.name = "AbortError";
  return error;
}

export default function AttendancePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startingRef = useRef(false);
  const mountedRef = useRef(false);
  const lastPhotoUrlRef = useRef<string | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastPhotoUrl, setLastPhotoUrl] = useState<string | null>(null);

  const [lastLatitude, setLastLatitude] = useState<number | null>(null);
  const [lastLongitude, setLastLongitude] = useState<number | null>(null);
  const [lastAccuracy, setLastAccuracy] = useState<number | null>(null);

  const [statusTitle, setStatusTitle] = useState("Waiting for Camera");
  const [statusText, setStatusText] = useState(
    "Aktifkan kamera dan izinkan lokasi GPS sebelum melakukan absensi."
  );

  useEffect(() => {
    mountedRef.current = true;

    const timer = window.setTimeout(() => {
      startCamera();
    }, 700);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(timer);
      releaseCamera(false, false);

      if (lastPhotoUrlRef.current) {
        URL.revokeObjectURL(lastPhotoUrlRef.current);
        lastPhotoUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function safeSetCameraReady(value: boolean) {
    if (mountedRef.current) setCameraReady(value);
  }

  function safeSetCameraStarting(value: boolean) {
    if (mountedRef.current) setCameraStarting(value);
  }

  function safeSetStatus(title: string, text: string) {
    if (!mountedRef.current) return;

    setStatusTitle(title);
    setStatusText(text);
  }

  function releaseCamera(updateStatus = true, updateState = true) {
    startingRef.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    if (updateState && mountedRef.current) {
      setCameraReady(false);
      setCameraStarting(false);
    }

    if (updateStatus && mountedRef.current) {
      setStatusTitle("Camera Off");
      setStatusText(
        "Kamera sudah dimatikan. Klik Aktifkan Kamera sebelum melakukan absensi."
      );
    }
  }

  function waitForVideoElement(): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkVideo = () => {
        if (!mountedRef.current) {
          reject(createAbortError("Halaman kamera sudah ditutup."));
          return;
        }

        if (videoRef.current) {
          resolve(videoRef.current);
          return;
        }

        if (Date.now() - startTime > 4000) {
          reject(new Error("Element video belum siap. Refresh halaman lalu coba lagi."));
          return;
        }

        window.requestAnimationFrame(checkVideo);
      };

      checkVideo();
    });
  }

  function waitForCameraFrame(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const isReady = () => {
        return (
          video.readyState >= 2 &&
          video.videoWidth > 0 &&
          video.videoHeight > 0
        );
      };

      if (isReady()) {
        resolve();
        return;
      }

      let intervalId: ReturnType<typeof setInterval> | null = null;

      const cleanup = () => {
        video.removeEventListener("loadedmetadata", checkReady);
        video.removeEventListener("canplay", checkReady);
        video.removeEventListener("playing", checkReady);

        if (intervalId) {
          clearInterval(intervalId);
        }

        clearTimeout(timeoutId);
      };

      const checkReady = () => {
        if (!mountedRef.current) {
          cleanup();
          reject(createAbortError("Halaman kamera sudah ditutup."));
          return;
        }

        if (isReady()) {
          cleanup();
          resolve();
        }
      };

      const timeoutId = setTimeout(() => {
        cleanup();
        reject(
          new Error(
            "Kamera belum memuat gambar. Tunggu sebentar lalu coba lagi."
          )
        );
      }, 7000);

      video.addEventListener("loadedmetadata", checkReady);
      video.addEventListener("canplay", checkReady);
      video.addEventListener("playing", checkReady);

      intervalId = setInterval(checkReady, 150);
    });
  }

  async function startCamera() {
    if (startingRef.current) return;

    try {
      startingRef.current = true;
      safeSetCameraReady(false);
      safeSetCameraStarting(true);
      safeSetStatus("Starting Camera", "Mengaktifkan kamera...");

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Browser tidak mendukung kamera.");
      }

      const video = await waitForVideoElement();

      if (streamRef.current) {
        releaseCamera(false, true);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      await video.play();
      await waitForCameraFrame(video);

      safeSetCameraReady(true);
      safeSetCameraStarting(false);
      safeSetStatus(
        "Camera Ready",
        "Kamera sudah aktif. Kamu bisa melakukan check-in atau check-out."
      );
    } catch (error) {
      if (isCameraAbortError(error)) {
        safeSetCameraStarting(false);
        startingRef.current = false;
        return;
      }

      console.error("CAMERA_ERROR", error);

      releaseCamera(false, true);
      safeSetStatus(
        "Camera Permission Needed",
        error instanceof Error
          ? error.message
          : "Aktifkan izin kamera di browser terlebih dahulu."
      );
    } finally {
      startingRef.current = false;
    }
  }

  async function toggleCamera() {
    if (streamRef.current) {
      releaseCamera(true, true);
      return;
    }

    await startCamera();
  }

  function getCurrentLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Browser tidak mendukung GPS."));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });
  }

  async function capturePhoto(): Promise<File> {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !streamRef.current) {
      throw new Error("Kamera belum siap.");
    }

    await waitForCameraFrame(video);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas tidak tersedia.");
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Gagal mengambil foto."));
            return;
          }

          if (lastPhotoUrlRef.current) {
            URL.revokeObjectURL(lastPhotoUrlRef.current);
          }

          const previewUrl = URL.createObjectURL(blob);
          lastPhotoUrlRef.current = previewUrl;
          setLastPhotoUrl(previewUrl);

          const file = new File([blob], `attendance-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });

          resolve(file);
        },
        "image/jpeg",
        0.9
      );
    });
  }

  async function handleAttendance(action: AttendanceAction) {
    try {
      setLoading(true);
      setStatusTitle("Processing");
      setStatusText("Menyiapkan kamera, mengambil foto, dan lokasi GPS...");

      if (!streamRef.current || !cameraReady) {
        await startCamera();
      }

      const video = await waitForVideoElement();

      if (!streamRef.current) {
        throw new Error("Kamera belum siap.");
      }

      await waitForCameraFrame(video);

      const photo = await capturePhoto();
      const position = await getCurrentLocation();

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      setLastLatitude(latitude);
      setLastLongitude(longitude);
      setLastAccuracy(accuracy);

      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("latitude", String(latitude));
      formData.append("longitude", String(longitude));
      formData.append("accuracy", String(accuracy));

      if (action === "check-in") {
        formData.append("checkInLatitude", String(latitude));
        formData.append("checkInLongitude", String(longitude));
        formData.append("checkInAccuracy", String(accuracy));
      }

      if (action === "check-out") {
        formData.append("checkOutLatitude", String(latitude));
        formData.append("checkOutLongitude", String(longitude));
        formData.append("checkOutAccuracy", String(accuracy));
      }

      const response = await fetch(`/api/attendance/${action}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setStatusTitle("Attendance Failed");
        setStatusText(data.error || data.message || "Absensi gagal.");
        alert(data.error || data.message || "Absensi gagal.");
        return;
      }

      const officeName = data.office?.name;
      const distance = data.office?.distance;
      const radius = data.office?.radius;

      setStatusTitle("Attendance Success");
      setStatusText(
        officeName
          ? `${data.message} Lokasi valid di ${officeName}. Jarak ${distance} meter dari kantor, radius ${radius} meter. Akurasi GPS ±${Math.round(
              accuracy
            )} meter.`
          : `${data.message || "Absensi berhasil."} Akurasi GPS ±${Math.round(
              accuracy
            )} meter.`
      );

      alert(data.message || "Absensi berhasil.");
    } catch (error) {
      console.error("ATTENDANCE_ERROR", error);

      const message =
        error instanceof Error
          ? error.message
          : "Gagal melakukan absensi. Pastikan kamera dan lokasi GPS diizinkan.";

      setStatusTitle("Attendance Failed");
      setStatusText(message);
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileShell variant="employee" withBottomPadding={false}>
      <div className="hidden md:block">
        <AppHeader
          title="Face Attendance"
          subtitle="Ambil foto dan lokasi GPS untuk absensi"
          rightLabel={cameraReady ? "CAM ON" : undefined}
          variant="employee"
        />
      </div>

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff] pb-28 text-slate-950">
        <section className="mx-auto max-w-7xl px-5 pt-7 md:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#123c8c]">
                FaceAttend
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#073456]">
                Face Attendance
              </h1>

              <p className="mt-2 text-sm font-bold text-slate-500">
                Pastikan wajah terlihat jelas dan GPS aktif.
              </p>
            </div>

            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-blue-100/50 ring-1 ${
                cameraReady
                  ? "bg-[#123c8c] text-white ring-[#123c8c]"
                  : cameraStarting
                    ? "bg-amber-50 text-amber-700 ring-amber-100"
                    : "bg-white text-slate-400 ring-blue-100"
              }`}
            >
              {cameraStarting ? (
                <Loader2 size={23} className="animate-spin" />
              ) : (
                <ScanFace size={24} strokeWidth={2.5} />
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-5 pt-6 md:px-10 md:py-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-16">
          <div className="rounded-[2rem] border border-white/80 bg-white/95 p-4 shadow-2xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
            <div className="mb-4 hidden items-start justify-between gap-4 md:flex">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                  Camera
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Attendance Capture
                </h2>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  Foto akan disimpan sebagai bukti absensi.
                </p>
              </div>

              <span
                className={`rounded-full px-4 py-2 text-xs font-black ${
                  cameraReady
                    ? "bg-emerald-50 text-emerald-700"
                    : cameraStarting
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {cameraReady
                  ? "Camera Active"
                  : cameraStarting
                    ? "Starting..."
                    : "Camera Off"}
              </span>
            </div>

            <div className="relative overflow-hidden rounded-[1.7rem] bg-slate-950 shadow-inner">
              <div className="aspect-[3/4] md:aspect-[4/3] lg:aspect-[4/3]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={() => {
                    const video = videoRef.current;

                    if (
                      video &&
                      video.readyState >= 2 &&
                      video.videoWidth > 0 &&
                      video.videoHeight > 0
                    ) {
                      setCameraReady(true);
                      setCameraStarting(false);
                    }
                  }}
                  onCanPlay={() => {
                    const video = videoRef.current;

                    if (
                      video &&
                      video.readyState >= 2 &&
                      video.videoWidth > 0 &&
                      video.videoHeight > 0
                    ) {
                      setCameraReady(true);
                      setCameraStarting(false);
                    }
                  }}
                  className={`h-full w-full object-cover transition ${
                    cameraReady ? "opacity-100" : "opacity-0"
                  }`}
                />

                <div className="pointer-events-none absolute inset-5 rounded-[1.4rem] border border-white/15 md:inset-6" />

                <div className="pointer-events-none absolute left-6 top-6 h-11 w-11 rounded-tl-3xl border-l-4 border-t-4 border-blue-300 md:left-7 md:top-7 md:h-12 md:w-12" />
                <div className="pointer-events-none absolute right-6 top-6 h-11 w-11 rounded-tr-3xl border-r-4 border-t-4 border-blue-300 md:right-7 md:top-7 md:h-12 md:w-12" />
                <div className="pointer-events-none absolute bottom-6 left-6 h-11 w-11 rounded-bl-3xl border-b-4 border-l-4 border-blue-300 md:bottom-7 md:left-7 md:h-12 md:w-12" />
                <div className="pointer-events-none absolute bottom-6 right-6 h-11 w-11 rounded-br-3xl border-b-4 border-r-4 border-blue-300 md:bottom-7 md:right-7 md:h-12 md:w-12" />

                <div className="absolute left-4 top-4 rounded-full bg-slate-950/50 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur-md md:hidden">
                  {cameraReady
                    ? "Camera Active"
                    : cameraStarting
                      ? "Starting..."
                      : "Camera Off"}
                </div>

                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-white">
                    <div>
                      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl">
                        {cameraStarting ? (
                          <Loader2 size={42} className="animate-spin" />
                        ) : (
                          <Camera size={42} />
                        )}
                      </div>

                      <p className="mt-5 text-sm font-black text-white">
                        {cameraStarting ? "Starting Camera" : "Camera Preview"}
                      </p>

                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
                        {cameraStarting
                          ? "Mohon tunggu sampai kamera memuat gambar."
                          : "Kamera sedang mati. Klik tombol aktifkan kamera."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                disabled={loading || cameraStarting}
                onClick={() => handleAttendance("check-in")}
                className="flex h-14 items-center justify-center rounded-2xl bg-[#123c8c] px-5 text-sm font-black text-white shadow-lg shadow-blue-900/25 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 md:h-16 md:text-base"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : null}
                  {loading ? "Processing..." : "Check-in"}
                </span>
              </button>

              <button
                disabled={loading || cameraStarting}
                onClick={() => handleAttendance("check-out")}
                className="flex h-14 items-center justify-center rounded-2xl border border-blue-200 bg-[#f8fbff] px-5 text-sm font-black text-[#123c8c] shadow-lg shadow-slate-200/60 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 md:h-16 md:text-base"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : null}
                  {loading ? "Processing..." : "Check-out"}
                </span>
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={toggleCamera}
                type="button"
                disabled={loading || cameraStarting}
                className="rounded-2xl border border-blue-200 bg-white px-4 py-3 text-xs font-black text-[#123c8c] shadow-sm transition hover:bg-[#f8fbff] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
              >
                <span className="flex items-center justify-center gap-2">
                  <Power size={17} />
                  {cameraReady ? "Matikan" : "Aktifkan"}
                </span>
              </button>

              <button
                onClick={startCamera}
                type="button"
                disabled={loading || cameraStarting}
                className="rounded-2xl bg-[#eaf1ff] px-4 py-3 text-xs font-black text-[#123c8c] shadow-sm transition hover:bg-[#dceaff] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
              >
                <span className="flex items-center justify-center gap-2">
                  <RotateCcw size={17} />
                  Restart
                </span>
              </button>
            </div>

            {lastPhotoUrl && (
              <div className="mt-5 rounded-3xl border border-blue-100 bg-[#f6f8ff] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ImageUp size={18} className="text-[#123c8c]" />
                  <p className="text-sm font-black text-slate-950">
                    Foto Terakhir
                  </p>
                </div>

                <img
                  src={lastPhotoUrl}
                  alt="Last attendance capture"
                  className="h-36 w-36 rounded-2xl object-cover shadow-md"
                />
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="overflow-hidden rounded-[2rem] bg-[#123c8c] text-white shadow-2xl shadow-blue-900/20">
              <div className="relative p-6 md:p-8">
                <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10" />
                <div className="absolute -bottom-20 right-10 h-40 w-40 rounded-full bg-blue-300/10" />

                <div className="relative flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                    <ShieldCheck size={29} strokeWidth={2.6} />
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-100">
                      Attendance Proof
                    </p>

                    <h2 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">
                      {cameraReady ? "Ready to Capture" : "Camera Standby"}
                    </h2>
                  </div>
                </div>

                <p className="relative mt-5 text-sm leading-7 text-blue-100">
                  Sistem akan menyimpan foto, waktu, koordinat GPS, akurasi GPS,
                  dan radius kantor sebagai bukti check-in atau check-out.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-2xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                Verification Status
              </p>

              <div className="mt-4 flex items-start gap-4 rounded-3xl border border-blue-100 bg-[#f6f8ff] p-5">
                <CheckCircle2
                  size={24}
                  className="mt-0.5 shrink-0 text-[#123c8c]"
                />

                <div>
                  <h3 className="font-black text-slate-950">{statusTitle}</h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {statusText}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-blue-100 bg-white p-5">
                  <Clock3 size={22} className="text-[#123c8c]" />

                  <p className="mt-3 text-sm font-black text-slate-950">
                    Jam Kerja
                  </p>

                  <p className="mt-1 text-sm text-slate-500">08:00 - 17:00</p>
                </div>

                <div className="rounded-3xl border border-blue-100 bg-white p-5">
                  <MapPin size={22} className="text-[#123c8c]" />

                  <p className="mt-3 text-sm font-black text-slate-950">
                    GPS Location
                  </p>

                  {lastLatitude && lastLongitude ? (
                    <div className="mt-1 space-y-1 text-sm text-slate-500">
                      <p>Lat: {lastLatitude.toFixed(6)}</p>
                      <p>Lng: {lastLongitude.toFixed(6)}</p>
                      <p>
                        Accuracy:{" "}
                        {lastAccuracy !== null
                          ? `±${Math.round(lastAccuracy)} meter`
                          : "-"}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">
                      Diminta saat absen
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <BottomNav />
      </main>
    </MobileShell>
  );
}