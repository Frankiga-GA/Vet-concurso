"use client";

import React, { useState, useEffect, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Flame,
  Gauge,
  LineChart,
  MapPin,
  Menu,
  PhoneCall,
  Play,
  Scan,
  ScanEye,
  ShieldCheck,
  Sparkles,
  Sun,
  ThermometerSun,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  WifiOff,
  X,
  Zap,
} from "lucide-react";

// ==========================================
// 1. NAVBAR COMPONENT (LIGHT STICKY GLASSMORPHISM)
// ==========================================
function Navbar({ onOpenPilot }: { onOpenPilot: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
          : "bg-white/60 backdrop-blur-md border-b border-slate-200/50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
            <ScanEye className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900">
                IAVET<span className="text-emerald-600 ml-1 font-extrabold">AGRO</span>
              </span>
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                B2B Agritech
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium tracking-wide">
              Visión Computacional & IA Avícola
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#solucion"
            className="text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            Solución
          </a>
          <a
            href="#simulador"
            className="text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Simulador IA
          </a>
          <a
            href="#roi"
            className="text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            Calculadora ROI
          </a>
          <a
            href="#alianzas"
            className="text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            Alianzas & Ecosistema
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-emerald-800 transition-colors"
          >
            Ingresar
          </Link>
          <button
            onClick={onOpenPilot}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            <span>Acceso a Granjas</span>
          </button>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
          aria-label="Abrir menú"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 border-b border-slate-200 backdrop-blur-2xl px-6 py-6 space-y-4"
          >
            <a
              href="#solucion"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-700 hover:text-emerald-700 font-semibold py-2"
            >
              Solución
            </a>
            <a
              href="#simulador"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-700 hover:text-emerald-700 font-semibold py-2"
            >
              Simulador IA
            </a>
            <a
              href="#roi"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-700 hover:text-emerald-700 font-semibold py-2"
            >
              Calculadora ROI
            </a>
            <a
              href="#alianzas"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-700 hover:text-emerald-700 font-semibold py-2"
            >
              Alianzas & Ecosistema
            </a>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <Link
                href="/auth/login"
                className="w-full text-center py-2.5 text-sm font-bold text-slate-700 bg-slate-100 rounded-xl"
              >
                Ingresar a Cuenta
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPilot();
                }}
                className="w-full py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl shadow-md"
              >
                Acceso a Granjas
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ==========================================
// 2. HERO SECTION (SPLIT 2-COLUMN + 3D SHOWCASE)
// ==========================================
function HeroSection({ onOpenPilot }: { onOpenPilot: () => void }) {
  const [heroImgSrc, setHeroImgSrc] = useState("/hero-3d-farm.png");

  return (
    <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden bg-gradient-to-b from-[#F3F7F4] via-[#F8FAF7] to-white">
      {/* Organic Light Ambient Accents */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-400/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.06] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Value Prop & Editorial Copy (7 cols) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
            {/* Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-emerald-200/80 shadow-xs"
            >
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider text-emerald-800 uppercase">
                VISIÓN COMPUTACIONAL AVÍCOLA • CHINCHA, PISCO & ICA
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]"
            >
              Inteligencia Artificial y{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700">
                Visión Computacional
              </span>{" "}
              para la Avicultura.
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl font-normal"
            >
              Detecta enfermedades a tiempo, cuenta tu producción automáticamente y
              maximiza la rentabilidad de tus galpones desde tu celular.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
            >
              <button
                onClick={onOpenPilot}
                className="px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3 group"
              >
                <span>Inicia tu Piloto Gratuito</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#simulador"
                className="px-8 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-base border border-slate-300 shadow-xs transition-all flex items-center justify-center gap-3"
              >
                <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                <span>Ver Demo IA en Galpón</span>
              </a>
            </motion.div>

            {/* Micro-Metrics Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-200/80"
            >
              {[
                { value: "99.4%", label: "Conteo en vivo", icon: Scan },
                { value: "-3.2%", label: "Mortalidad", icon: TrendingDown },
                { value: "S/ 8,400+", label: "Ahorro mensual", icon: TrendingUp },
                { value: "100% Offline", label: "Edge en campo", icon: WifiOff },
              ].map((stat, i) => (
                <div key={i} className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-emerald-600 mb-1">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                      {stat.value}
                    </span>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-semibold text-slate-500">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Column: 3D Visual & Interactive Device Mockup (5 cols) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            {/* 3D Depth Card Container */}
            <div className="relative rounded-3xl bg-white p-3.5 sm:p-4 shadow-[0_20px_50px_rgba(15,23,42,0.12)] border border-slate-200/90 overflow-visible">
              {/* Floating Badge Top Left */}
              <div className="absolute -top-4 -left-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-mono font-bold shadow-lg">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>REC LIVE • CAM-04 ICA SUR</span>
              </div>

              {/* Floating Badge Top Right */}
              <div className="absolute -top-3 -right-3 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-mono font-bold shadow-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>14,820 AVES CENSADAS</span>
              </div>

              {/* Main Visual Image (3D Render / Modern Poultry Shed) */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/70 group">
                <Image
                  src={heroImgSrc}
                  alt="3D Poultry Farm Simulation"
                  fill
                  sizes="(max-width: 1024px) 100vw, 500px"
                  priority
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={() => {
                    // Fallback to high quality farm photo if generated 3D image isn't available yet
                    setHeroImgSrc(
                      "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1000&q=80"
                    );
                  }}
                />

                {/* Subtitle overlay banner */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex flex-col justify-end p-5 text-white">
                  <div className="flex items-center justify-between text-xs font-mono font-semibold">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Algoritmo Visión v2.4 Activo
                    </span>
                    <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-[11px]">
                      Conteo Exacto 99.4%
                    </span>
                  </div>
                </div>

                {/* Simulated Green Bounding Box on the Image */}
                <div className="absolute top-[35%] left-[25%] w-28 h-20 border-2 border-emerald-400 rounded-lg bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.5)] flex flex-col justify-between p-1 text-[9px] font-mono font-bold text-white">
                  <div className="bg-slate-950/80 px-1 rounded flex justify-between">
                    <span>AVE #4120</span>
                    <span className="text-emerald-400">99.1%</span>
                  </div>
                  <div className="bg-emerald-500 text-slate-950 font-black px-1 rounded flex justify-between">
                    <span>SANA</span>
                    <span>2.19 kg</span>
                  </div>
                </div>

                {/* Simulated Amber Alert Box on the Image */}
                <div className="absolute bottom-[28%] right-[22%] w-32 h-24 border-2 border-amber-400 rounded-lg bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.5)] flex flex-col justify-between p-1 text-[9px] font-mono font-bold text-white">
                  <div className="bg-slate-950/80 px-1 rounded flex justify-between text-amber-300">
                    <span>AVE #4128</span>
                    <span>ALERTA</span>
                  </div>
                  <div className="bg-amber-500 text-slate-950 font-black px-1 rounded text-[8px]">
                    ESTRÉS TÉRMICO (31.8°C)
                  </div>
                </div>
              </div>

              {/* Bottom Floating Telemetry Strip */}
              <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                  <ThermometerSun className="w-4 h-4 text-amber-600" />
                  <span>Temp Galpón: <strong>31.4°C</strong></span>
                </div>
                <span className="text-slate-400">|</span>
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ventilación Túnel: Activa</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 3. COMPUTER VISION SIMULATOR (WITH REAL FARM CAMERA PHOTO)
// ==========================================
function ComputerVisionSimulator() {
  const [activeTab, setActiveTab] = useState<"conteo" | "sanitaria" | "clima">("conteo");
  const [currentTime, setCurrentTime] = useState("11:32:08");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(" ")[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="simulador" className="py-20 md:py-28 relative bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold uppercase">
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            El Diferenciador Técnico
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Simulador de Visión Computacional
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Monitoreo continuo de galpones mediante cámaras estándar y modelos de Edge
            AI entrenados para la avicultura de la costa sur peruana.
          </p>
        </div>

        {/* Industrial AI Console Box */}
        <div className="rounded-3xl bg-slate-950 p-4 sm:p-6 shadow-2xl border border-slate-800">
          {/* Top Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 px-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>REC • LIVE FEED</span>
              </div>
              <div className="text-xs font-mono text-slate-300 hidden sm:block">
                GALPÓN ICA SUR — LOTE ENGORDE #04
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab("conteo")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "conteo"
                    ? "bg-emerald-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Scan className="w-3.5 h-3.5" />
                Conteo Continuo
              </button>
              <button
                onClick={() => setActiveTab("sanitaria")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "sanitaria"
                    ? "bg-emerald-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Detección Sanitaria
              </button>
              <button
                onClick={() => setActiveTab("clima")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "clima"
                    ? "bg-emerald-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                Estrés Térmico
              </button>
            </div>

            {/* Camera Metrics */}
            <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-slate-400">
              <span>60 FPS</span>
              <span>4K UHD</span>
              <span>LATENCIA: 14ms</span>
              <span className="text-emerald-400 font-bold">{currentTime} UTC-5</span>
            </div>
          </div>

          {/* Grid: Camera Viewport + Telemetry Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
            {/* Viewport with REAL poultry shed photo */}
            <div className="lg:col-span-3 relative aspect-[16/9] sm:aspect-[16/10] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
              {/* Real Poultry Barn Photo as Camera Feed Background */}
              <Image
                src="https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1200&q=80"
                alt="Flock camera feed"
                fill
                sizes="(max-width: 1024px) 100vw, 900px"
                className="object-cover opacity-80"
              />

              {/* Dark subtle overlay for high contrast bounding boxes */}
              <div className="absolute inset-0 bg-slate-950/30" />

              {/* Animated Laser Scanning Line */}
              <motion.div
                animate={{ y: ["0%", "100%", "0%"] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] z-20 pointer-events-none"
              />

              {/* Simulated Bounding Boxes */}
              <div className="absolute inset-0 p-8 flex items-center justify-center">
                {/* Box 1: Healthy bird */}
                <motion.div
                  initial={{ scale: 0.96 }}
                  animate={{ scale: [0.98, 1.02, 0.98] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute top-[28%] left-[24%] w-32 h-24 border-2 border-emerald-400 rounded-lg bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.4)] z-10 flex flex-col justify-between p-1.5"
                >
                  <div className="flex justify-between items-start text-[9px] font-mono font-bold bg-slate-950/90 px-1 py-0.5 rounded text-emerald-300">
                    <span>AVE #4812</span>
                    <span>99.4%</span>
                  </div>
                  <div className="text-[9px] font-mono bg-emerald-500 text-slate-950 font-extrabold px-1 rounded flex justify-between">
                    <span>SANA</span>
                    <span>2.18 kg</span>
                  </div>
                </motion.div>

                {/* Box 2: Healthy bird */}
                <motion.div
                  initial={{ scale: 0.98 }}
                  animate={{ scale: [1, 0.97, 1] }}
                  transition={{ duration: 3.5, repeat: Infinity }}
                  className="absolute bottom-[26%] left-[46%] w-36 h-28 border-2 border-emerald-400 rounded-lg bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.4)] z-10 flex flex-col justify-between p-1.5"
                >
                  <div className="flex justify-between items-start text-[9px] font-mono font-bold bg-slate-950/90 px-1 py-0.5 rounded text-emerald-300">
                    <span>AVE #4819</span>
                    <span>98.9%</span>
                  </div>
                  <div className="text-[9px] font-mono bg-emerald-500 text-slate-950 font-extrabold px-1 rounded flex justify-between">
                    <span>SANA</span>
                    <span>2.24 kg</span>
                  </div>
                </motion.div>

                {/* Box 3: Alert Box (Thermal Stress / Postration) */}
                <motion.div
                  animate={{
                    borderColor:
                      activeTab === "clima"
                        ? ["#f59e0b", "#ef4444", "#f59e0b"]
                        : activeTab === "sanitaria"
                        ? ["#ef4444", "#dc2626", "#ef4444"]
                        : ["#10b981", "#10b981", "#10b981"],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute top-[36%] right-[22%] w-40 h-32 border-2 rounded-lg bg-slate-900/70 z-20 flex flex-col justify-between p-2 shadow-xl"
                >
                  <div className="flex justify-between items-start text-[9px] font-mono font-bold bg-slate-950/90 px-1.5 py-0.5 rounded text-amber-400">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400 animate-pulse" />
                      AVE #4830
                    </span>
                    <span>97.2%</span>
                  </div>

                  {activeTab === "clima" ? (
                    <div className="space-y-0.5 bg-amber-500/30 border border-amber-500/50 p-1.5 rounded text-[9px] font-mono text-amber-100">
                      <div className="font-bold flex items-center justify-between">
                        <span>ESTRÉS TÉRMICO</span>
                        <span>32.6°C</span>
                      </div>
                      <div className="text-[8px] text-amber-200">Jadeo detectado en zona B</div>
                    </div>
                  ) : activeTab === "sanitaria" ? (
                    <div className="space-y-0.5 bg-red-500/30 border border-red-500/50 p-1.5 rounded text-[9px] font-mono text-red-100">
                      <div className="font-bold flex items-center justify-between">
                        <span>POSTRACIÓN ANÓMALA</span>
                        <span>ALERTA</span>
                      </div>
                      <div className="text-[8px] text-red-200">Inmovilidad &gt; 18 min</div>
                    </div>
                  ) : (
                    <div className="text-[9px] font-mono bg-emerald-500 text-slate-950 font-bold px-1 rounded flex justify-between">
                      <span>CENSO VINCULADO</span>
                      <span>2.11 kg</span>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Bottom HUD Bar in Camera Feed */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-300">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    AI ENGINE: ACTIVO
                  </span>
                  <span className="text-slate-600">|</span>
                  <span>AVES VISIBLES: 42 EN CUADRO</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-white/10 text-[10px]">
                    FOV 110° WIDE
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30">
                    ICA_ALGORITMO_V3
                  </span>
                </div>
              </div>
            </div>

            {/* Side Telemetry Panel */}
            <div className="space-y-3 flex flex-col justify-between">
              {/* Metric Card 1 */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Total Aves Censadas</span>
                  <Scan className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                  14,820
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Conteo exacto 99.4% lote #04</span>
                </div>
              </div>

              {/* Metric Card 2 */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Índice de Dispersión</span>
                  <Gauge className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-black text-white">Uniforme (94.2%)</div>
                <div className="text-xs text-slate-400 mt-1">
                  Densidad: 14.1 aves/m² en galpón túnel
                </div>
              </div>

              {/* Metric Card 3 */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Alerta de Estrés Térmico</span>
                  <ThermometerSun className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-black text-amber-400">2 alertas leves</div>
                <div className="text-xs text-slate-400 mt-1">
                  Zona B: 31.8°C (Ventilación túnel activa)
                </div>
              </div>

              {/* Quick Action Button */}
              <a
                href="#roi"
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Calcular Ahorro en tu Galpón</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 4. B2B ROI CALCULATOR (CLEAN LIGHT CARD)
// ==========================================
function ProfitabilityCalculator({ onOpenPilot }: { onOpenPilot: () => void }) {
  const [birdCount, setBirdCount] = useState<number>(25000);
  const [feedCostTon, setFeedCostTon] = useState<number>(1950);
  const [currentMortality, setCurrentMortality] = useState<number>(6.5);

  const birdSliderId = useId();
  const feedCostSliderId = useId();
  const mortalitySliderId = useId();

  // Dynamic calculations based on Peruvian poultry benchmarks
  const feedKgPerBirdPerCycle = 4.2;
  const feedCostPerKg = feedCostTon / 1000;
  const feedSavingMonthly = ((birdCount * feedKgPerBirdPerCycle * 0.04) * feedCostPerKg) / 1.5;

  const mortalityDropPercent = Math.min(currentMortality * 0.45, 3.2);
  const birdsSavedPerCycle = Math.round((birdCount * mortalityDropPercent) / 100);
  const valuePerBirdSol = 16.5;
  const mortalitySavingMonthly = (birdsSavedPerCycle * valuePerBirdSol) / 1.5;

  const totalMonthlySavings = Math.round(feedSavingMonthly + mortalitySavingMonthly);
  const totalAnnualSavings = totalMonthlySavings * 12;

  return (
    <section id="roi" className="py-20 md:py-28 relative bg-[#F9FAF8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold uppercase">
            <LineChart className="w-3.5 h-3.5 text-emerald-600" />
            Impacto Económico Medible
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Calculadora de Rentabilidad B2B
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Estima el retorno de inversión mensual al incorporar visión artificial y
            sensores en la crianza de tus aves.
          </p>
        </div>

        {/* Main Card */}
        <div className="max-w-5xl mx-auto rounded-3xl bg-white border border-slate-200 p-6 sm:p-10 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Inputs (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Parámetros de tu Operación
              </h3>

              {/* Slider 1: Bird Count */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex justify-between items-center">
                  <label htmlFor={birdSliderId} className="text-sm font-semibold text-slate-700">
                    Cantidad de Aves por Lote
                  </label>
                  <span className="text-lg font-mono font-bold text-emerald-700">
                    {birdCount.toLocaleString("es-PE")} aves
                  </span>
                </div>
                <input
                  id={birdSliderId}
                  type="range"
                  min={5000}
                  max={100000}
                  step={1000}
                  value={birdCount}
                  onChange={(e) => setBirdCount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>5,000</span>
                  <span>50,000</span>
                  <span>100,000</span>
                </div>
              </div>

              {/* Slider 2: Feed Cost per Ton */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex justify-between items-center">
                  <label htmlFor={feedCostSliderId} className="text-sm font-semibold text-slate-700">
                    Costo de Alimento Balanceado (S/ por Tonelada)
                  </label>
                  <span className="text-lg font-mono font-bold text-emerald-700">
                    S/ {feedCostTon.toLocaleString("es-PE")}
                  </span>
                </div>
                <input
                  id={feedCostSliderId}
                  type="range"
                  min={1400}
                  max={2800}
                  step={50}
                  value={feedCostTon}
                  onChange={(e) => setFeedCostTon(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>S/ 1,400</span>
                  <span>S/ 2,100</span>
                  <span>S/ 2,800</span>
                </div>
              </div>

              {/* Slider 3: Current Mortality */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex justify-between items-center">
                  <label htmlFor={mortalitySliderId} className="text-sm font-semibold text-slate-700">
                    Mortalidad Histórica Actual del Lote
                  </label>
                  <span className="text-lg font-mono font-bold text-emerald-700">
                    {currentMortality.toFixed(1)}%
                  </span>
                </div>
                <input
                  id={mortalitySliderId}
                  type="range"
                  min={3.0}
                  max={12.0}
                  step={0.5}
                  value={currentMortality}
                  onChange={(e) => setCurrentMortality(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>3.0% (Excelente)</span>
                  <span>6.5% (Promedio Ica)</span>
                  <span>12.0% (Crítico)</span>
                </div>
              </div>
            </div>

            {/* Right Output: Dynamic Block (5 cols) */}
            <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl">
              <div>
                <span className="text-xs font-mono font-bold tracking-wider text-emerald-300 uppercase block mb-1">
                  Beneficio Proyectado IAVET
                </span>
                <div className="text-xs text-emerald-100/80">
                  Ahorro estimado en alimento y preservación de aves
                </div>
              </div>

              {/* Highlight Dynamic Monthly Number */}
              <div className="space-y-1">
                <div className="text-xs font-mono text-emerald-200 uppercase">
                  Ahorro Estimado Mensual
                </div>
                <motion.div
                  key={totalMonthlySavings}
                  initial={{ scale: 0.95, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-4xl sm:text-5xl font-black text-emerald-300 font-mono tracking-tight"
                >
                  S/ {totalMonthlySavings.toLocaleString("es-PE")}
                </motion.div>
                <div className="text-xs text-emerald-200/80">
                  ≈ S/ {totalAnnualSavings.toLocaleString("es-PE")} al año
                </div>
              </div>

              {/* Key Indicators */}
              <div className="space-y-3 pt-3 border-t border-white/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-100">Reducción de Mortalidad:</span>
                  <span className="font-bold text-white font-mono">
                    -{mortalityDropPercent.toFixed(1)}% (≈ {birdsSavedPerCycle} aves)
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-100">Optimización Conversión (FCR):</span>
                  <span className="font-bold text-emerald-300 font-mono">+6.8% eficiencia</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-100">Retorno de Inversión (ROI):</span>
                  <span className="font-bold text-emerald-200 font-mono">3.8x en 60 días</span>
                </div>
              </div>

              {/* Call to action */}
              <button
                onClick={onOpenPilot}
                className="w-full py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Solicitar Estudio de Viabilidad</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 5. KEY FEATURES (3-COLUMN LIGHT GRID WITH VISUAL IMAGERY)
// ==========================================
function KeyFeatures() {
  const features = [
    {
      icon: ThermometerSun,
      image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80",
      title: "Alerta Climática Preventiva",
      desc: "Recibe alertas por olas de calor en Ica antes de que afecten a tu lote. Modelos predictivos que anticipan picos térmicos para accionar nebulizadores y ventilación túnel con hasta 3 horas de ventaja.",
      highlight: "Evita pérdidas de hasta S/ 15,000 en días críticos de verano.",
      tag: "Vigilancia Térmica Ica",
    },
    {
      icon: WifiOff,
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
      title: "Funcionamiento Offline",
      desc: "Diseñado para el campo. IAVET guarda tus registros sin internet y se sincroniza automáticamente. La IA corre en hardware Edge instalado en el galpón sin depender de cobertura celular o fibra óptica.",
      highlight: "Cero pérdida de telemetría ante caídas de señal rural.",
      tag: "Edge AI Industrial",
    },
    {
      icon: Bot,
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80",
      title: "Asistente Experto",
      desc: "Consulta dudas sanitarias iniciales respaldado en parámetros veterinarios oficiales. Detecta síntomas de Newcastle, Gumboro o Bronquitis a partir de posturas anómalas y patrones de sonido.",
      highlight: "Triaje 24/7 alineado a buenas prácticas avícolas.",
      tag: "Criterio Sanitario Oficial",
    },
  ];

  return (
    <section id="solucion" className="py-20 md:py-28 relative bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold uppercase">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            Capacidades Centrales
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Tecnología Diseñada para la Realidad del Campo
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Combinamos visión artificial de alta precisión con la resiliencia operativa
            que demanda la producción avícola en el sur del país.
          </p>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              whileHover={{ y: -6 }}
              className="rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
            >
              {/* Feature Preview Image */}
              <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                <Image
                  src={feat.image}
                  alt={feat.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 z-10 w-11 h-11 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 flex items-center justify-center text-emerald-700 shadow-md">
                  <feat.icon className="w-5 h-5" />
                </div>
                <div className="absolute top-4 right-4 z-10 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-900/80 text-white backdrop-blur-md">
                  {feat.tag}
                </div>
              </div>

              {/* Title & Description */}
              <div className="p-6 sm:p-7 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feat.desc}</p>
                </div>

                {/* Bottom Highlight */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{feat.highlight}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 6. ECOSYSTEM & ALLIANCES (LIGHT SOCIAL PROOF)
// ==========================================
function EcosystemAndAlliances({ onOpenPilot }: { onOpenPilot: () => void }) {
  return (
    <section id="alianzas" className="py-20 md:py-28 relative bg-[#F4F8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Container */}
        <div className="rounded-3xl bg-white border border-slate-200 p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="max-w-3xl mb-12 space-y-3">
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-700 uppercase">
              Ecosistema Regional & Respaldo Técnico
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Con el respaldo técnico de instituciones clave y proveedores verificados
            </h2>
            <p className="text-slate-600 text-base">
              Articulamos la tecnología de visión artificial con los estándares oficiales
              de sanidad animal y la cadena de suministro agropecuaria del sur peruano.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Stylized SENASA Ica Badge */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-600 to-red-800 text-white flex items-center justify-center font-black text-xl font-mono shadow-md">
                  SENASA
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">SENASA Ica</h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Homologado
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Servicio Nacional de Sanidad Agraria — Región Ica
                  </div>
                </div>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Parámetros de vigilancia epidemiológica y triaje veterinario estructurados
                bajo las directivas sanitarias aviares vigentes para el control de
                enfermedades de notificación obligatoria.
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200">
                  Directiva Sanitaria Aviar
                </span>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-200">
                  Trazabilidad por Galpón
                </span>
              </div>
            </div>

            {/* B2B Verified Suppliers Card */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <Truck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Directorio B2B de Proveedores Verificados
                  </h3>
                  <div className="text-xs text-slate-500">
                    Conexión Inteligente de Insumos & Alimento
                  </div>
                </div>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                La IA proyecta el consumo de pienso de tu lote en tiempo real y conecta tu
                galpón con distribuidores mayoristas de maíz, soya y núcleos de Chincha y
                Pisco para asegurar precios directos y despacho oportuno.
              </p>
              <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  <span>Molinos del Valle Chincha</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  <span>AgroInsumos Ica Sur</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  <span>NutriAves Perú</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  <span>BioSeguridad Pisco</span>
                </div>
              </div>
            </div>
          </div>

          {/* Regional Trust Bar */}
          <div className="mt-10 pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>PROTOCOLO DE PRIVACIDAD: Datos de granja 100% confidenciales</span>
            </div>
            <button
              onClick={onOpenPilot}
              className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 transition-colors"
            >
              <span>Conoce el programa de validación de granjas</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 7. FOOTER (CLEAN LIGHT & MINIMALIST)
// ==========================================
function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-600 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-200">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white">
                <ScanEye className="w-4 h-4" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                IAVET<span className="text-emerald-600 ml-1">AGRO</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tecnología diseñada para los productores de Ica y el Perú. Optimizamos la
              rentabilidad avícola mediante visión computacional y modelos Edge AI.
            </p>
            <div className="text-xs font-mono text-emerald-700 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Despliegues en Chincha, Pisco e Ica</span>
            </div>
          </div>

          {/* Links: Plataforma */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
              Plataforma
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#simulador" className="hover:text-emerald-700 transition-colors">
                  Visión Computacional
                </a>
              </li>
              <li>
                <a href="#simulador" className="hover:text-emerald-700 transition-colors">
                  Conteo Automático
                </a>
              </li>
              <li>
                <a href="#solucion" className="hover:text-emerald-700 transition-colors">
                  Detección de Estrés Térmico
                </a>
              </li>
              <li>
                <a href="#roi" className="hover:text-emerald-700 transition-colors">
                  Calculadora de Retorno ROI
                </a>
              </li>
            </ul>
          </div>

          {/* Links: Alianzas & Cumplimiento */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
              Ecosistema
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#alianzas" className="hover:text-emerald-700 transition-colors">
                  SENASA Ica
                </a>
              </li>
              <li>
                <a href="#alianzas" className="hover:text-emerald-700 transition-colors">
                  Directorio de Proveedores
                </a>
              </li>
              <li>
                <Link href="/account/agro" className="hover:text-emerald-700 transition-colors">
                  Panel de Productores
                </Link>
              </li>
              <li>
                <Link href="/veterinarias" className="hover:text-emerald-700 transition-colors">
                  Directorio Clínico VetIA
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto B2B */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
              Contacto B2B
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Panamericana Sur Km 300, Ica, Perú</span>
              </li>
              <li className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>+51 (056) 632-180 / +51 956 718 200</span>
              </li>
              <li className="text-xs text-slate-500 pt-1 font-mono">
                Atención técnica a granjas: Lun-Sáb 06:00 - 18:00
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 IAVET Agro Technologies S.A.C. Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-slate-800">
              Términos del Piloto
            </Link>
            <Link href="/privacy" className="hover:text-slate-800">
              Privacidad y Telemetría
            </Link>
            <Link href="/auth/login" className="text-emerald-700 hover:text-emerald-800 font-bold">
              Acceso a Granjas
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ==========================================
// 8. PILOT REGISTRATION MODAL
// ==========================================
function PilotModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    farmLocation: "Chincha",
    birdCount: "25000",
    phone: "",
  });

  const producerNameId = useId();
  const farmLocationId = useId();
  const birdCapacityId = useId();
  const phoneId = useId();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">¡Solicitud de Piloto Recibida!</h3>
            <p className="text-slate-600 text-sm max-w-sm mx-auto">
              Un especialista técnico en avicultura de IAVET Agro se comunicará contigo en menos
              de 24 horas para coordinar la inspección del galpón en {formData.farmLocation}.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md"
            >
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-700 uppercase font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                Programa Piloto Sin Costo
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Inicia tu Piloto en Galpón</h3>
              <p className="text-slate-500 text-xs">
                Instalación de 1 cámara de visión artificial de prueba por 14 días en tu granja.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label htmlFor={producerNameId} className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Productor o Empresa
                </label>
                <input
                  id={producerNameId}
                  required
                  type="text"
                  placeholder="Ej. Granjas Avícolas del Sur S.A.C."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:border-emerald-600 focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={farmLocationId} className="block text-xs font-semibold text-slate-700 mb-1">
                    Ubicación de Granja
                  </label>
                  <select
                    id={farmLocationId}
                    value={formData.farmLocation}
                    onChange={(e) => setFormData({ ...formData, farmLocation: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:border-emerald-600 focus:bg-white outline-none"
                  >
                    <option value="Chincha">Chincha</option>
                    <option value="Pisco">Pisco</option>
                    <option value="Ica">Valle de Ica</option>
                    <option value="Nazca">Palpa / Nazca</option>
                    <option value="Otro">Otra provincia</option>
                  </select>
                </div>

                <div>
                  <label htmlFor={birdCapacityId} className="block text-xs font-semibold text-slate-700 mb-1">
                    Capacidad (Aves)
                  </label>
                  <input
                    id={birdCapacityId}
                    type="number"
                    value={formData.birdCount}
                    onChange={(e) => setFormData({ ...formData, birdCount: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:border-emerald-600 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={phoneId} className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono / WhatsApp de Contacto
                </label>
                <input
                  id={phoneId}
                  required
                  type="tel"
                  placeholder="+51 987 654 321"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:border-emerald-600 focus:bg-white outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 transition-all"
            >
              Confirmar Solicitud de Piloto
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

// ==========================================
// MAIN LANDING PAGE CONTAINER (LIGHT MODE)
// ==========================================
export default function LandingPage() {
  const [pilotModalOpen, setPilotModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 antialiased font-sans">
      <Navbar onOpenPilot={() => setPilotModalOpen(true)} />
      <main>
        <HeroSection onOpenPilot={() => setPilotModalOpen(true)} />
        <ComputerVisionSimulator />
        <ProfitabilityCalculator onOpenPilot={() => setPilotModalOpen(true)} />
        <KeyFeatures />
        <EcosystemAndAlliances onOpenPilot={() => setPilotModalOpen(true)} />
      </main>
      <Footer />
      <PilotModal isOpen={pilotModalOpen} onClose={() => setPilotModalOpen(false)} />
    </div>
  );
}
