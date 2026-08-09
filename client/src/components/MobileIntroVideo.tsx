import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/contexts/I18nContext";
import introVideo from "../vid.mp4";

const STORAGE_KEY = "nose_mobile_intro_seen";

export default function MobileIntroVideo() {
  const { isRTL } = useI18n();
  const [shouldShow, setShouldShow] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isMobile = window.innerWidth < 768;
    const alreadySeen = window.sessionStorage.getItem(STORAGE_KEY) === "1";

    if (!isMobile || alreadySeen) {
      setShouldShow(false);
      setIsVisible(false);
      return;
    }

    setShouldShow(true);
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!shouldShow || !videoRef.current) return;

    const video = videoRef.current;

    const finishIntro = () => {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
      setIsVisible(false);
    };

    const handleEnded = () => {
      finishIntro();
    };

    const handleError = () => {
      finishIntro();
    };

    const handleCanPlay = () => {
      if (!hasStarted) {
        setHasStarted(true);
      }
    };

    const handlePlayFailed = () => {
      finishIntro();
    };

    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("play", handleCanPlay);
    video.addEventListener("stalled", handlePlayFailed);
    video.addEventListener("emptied", handlePlayFailed);

    return () => {
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("play", handleCanPlay);
      video.removeEventListener("stalled", handlePlayFailed);
      video.removeEventListener("emptied", handlePlayFailed);
    };
  }, [shouldShow, hasStarted]);

  useEffect(() => {
    if (!shouldShow || !videoRef.current) return;

    const video = videoRef.current;
    const playPromise = video.play();

    if (playPromise && typeof playPromise.then === "function") {
      playPromise.catch(() => {
        window.sessionStorage.setItem(STORAGE_KEY, "1");
        setIsVisible(false);
      });
    }
  }, [shouldShow]);

  const label = useMemo(() => (isRTL ? "تخطي" : "Skip"), [isRTL]);

  if (!shouldShow) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] h-[100dvh] w-[100vw] overflow-hidden bg-black transition-opacity duration-500 ${isVisible ? "opacity-100" : "pointer-events-none opacity-0"}`}
      aria-hidden={!isVisible}
    >
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src={introVideo}
        autoPlay
        muted
        playsInline
        preload="auto"
        loop={false}
        controls={false}
        poster=""
      />
      <button
        type="button"
        onClick={() => {
          window.sessionStorage.setItem(STORAGE_KEY, "1");
          setIsVisible(false);
        }}
        className={`absolute right-4 top-4 z-10 rounded-full border border-white/60 bg-black/30 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm transition-opacity duration-200 ${isRTL ? "left-4 right-auto" : "right-4"}`}
      >
        {label}
      </button>
    </div>
  );
}
