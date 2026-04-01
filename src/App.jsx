import { useState, useEffect, useCallback } from "react";
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc, getDoc, setDoc, updateDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";

import { CSS } from "./styles";
import { ADMIN_CREDS, DEBT_LIMIT_DAYS } from "./config";
import { usePWAInstall } from "./hooks/usePWAInstall";

import Nav            from "./components/Nav";
import Landing        from "./components/Landing";
import Auth           from "./components/Auth";
import UserHome       from "./components/UserHome";
import ServiceChat    from "./components/ServiceChat";
import MyOrders       from "./components/MyOrders";
import TallerHome     from "./components/TallerHome";
import OrderDetail    from "./components/OrderDetail";
import Chat           from "./components/Chat";
import Admin          from "./components/Admin";
import PasswordModal  from "./components/PasswordModal";
import ApiKeyModal    from "./components/ApiKeyModal";
import InstallBanner  from "./components/InstallBanner";

// ================================================================
// AUTO-BLOCK
// ================================================================
async function checkAndAutoBlock(uid, profileData) {
  const debts = profileData.debts || [];
  const now = Date.now();
  const hasOverdue = debts.some((d) => {
    if (d.paid) return false;
    return (now - new Date(d.date).getTime()) / (1000 * 60 * 60 * 24) > DEBT_LIMIT_DAYS;
  });
  if (hasOverdue && !profileData.blocked) {
    await updateDoc(doc(db, "profiles", uid), { blocked: true });
    return { ...profileData, blocked: true };
  }
  return profileData;
}

// ================================================================
// MAIN APP
// ================================================================
export default function LumajiraHub() {
  const [user, setUser]               = useState(null);
  const [authUser, setAuthUser]       = useState(null);
  const [view, setView]               = useState("loading");
  const [authType, setAuthType]       = useState("usuario");
  const [isRegister, setIsRegister]   = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedOrder, setSelectedOrder]     = useState(null);
  const [activeChat, setActiveChat]           = useState(null);
  const [toast, setToast]                     = useState(null);
  const [showApiModal, setShowApiModal]       = useState(false);
  const [newPassword, setNewPassword]         = useState(null);

  const { isInstallable, install, dismiss } = usePWAInstall();

  const showToast = useCallback((msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Auth state listener ──────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setAuthUser(null); setUser(null); setView("landing"); return;
      }

      // Admin
      if (fbUser.email === ADMIN_CREDS.email) {
        setAuthUser(fbUser);
        setUser({ id: fbUser.uid, type: "admin", name: "Administrador", email: fbUser.email });
        setView("admin");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "profiles", fbUser.uid));
        if (!snap.exists()) {
          // Sin perfil aún (anónimo recién creado sin guardar) → landing
          await signOut(auth);
          setView("landing");
          return;
        }
        let profile = { id: fbUser.uid, ...snap.data() };
        if (profile.type === "taller") profile = await checkAndAutoBlock(fbUser.uid, profile);
        setAuthUser(fbUser);
        setUser(profile);
        setView(profile.type === "usuario" ? "userHome" : "tallerHome");
      } catch (e) { console.error(e); setView("landing"); }
    });
    return unsub;
  }, []);

  // ── Login anónimo para clientes (solo nombre) ───────────────────
  const loginAsGuest = async (name) => {
    if (!name.trim()) {
      showToast("Ingresa tu nombre", "err");
      return false;
    }
    try {
      const cred = await signInAnonymously(auth);
      const profile = {
        type: "usuario",
        name: name.trim(),
        email: "",
        whatsapp: "",
        isAnonymous: true,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "profiles", cred.user.uid), profile);
      setAuthUser(cred.user);
      setUser({ id: cred.user.uid, ...profile });
      setView("userHome");
      return true;
    } catch (e) {
      showToast("Error al ingresar: " + e.message, "err");
      return false;
    }
  };

  // ── Registro de talleres ─────────────────────────────────────────
  const register = async (data, type, password) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, password);
      const profile = {
        type,
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp,
        tallerName: data.tallerName,
        blocked: false,
        debts: [],
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "profiles", cred.user.uid), profile);
      setNewPassword(password);
      return true;
    } catch (e) {
      const msg = e.code === "auth/email-already-in-use"
        ? "Este correo ya está registrado."
        : e.code === "auth/weak-password"
        ? "La contraseña debe tener al menos 6 caracteres."
        : e.message;
      showToast(msg, "err");
      return false;
    }
  };

  // ── Login de talleres / admin ────────────────────────────────────
  const login = async (email, password, type) => {
    if (type === "admin" && (email !== ADMIN_CREDS.email || password !== ADMIN_CREDS.password)) {
      showToast("Credenciales de admin incorrectas.", "err"); return false;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (e) {
      const msg = ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(e.code)
        ? "Correo o contraseña incorrectos." : e.message;
      showToast(msg, "err");
      return false;
    }
  };

  const logout = () => signOut(auth);

  const refreshUser = useCallback(async () => {
    if (!authUser) return;
    const snap = await getDoc(doc(db, "profiles", authUser.uid));
    if (snap.exists()) setUser({ id: authUser.uid, ...snap.data() });
  }, [authUser]);

  const ctx = {
    user, authUser, view, setView,
    selectedService, setSelectedService,
    selectedOrder, setSelectedOrder,
    activeChat, setActiveChat,
    login, register, loginAsGuest, logout, refreshUser,
    showToast, authType, setAuthType,
    isRegister, setIsRegister,
    showApiModal, setShowApiModal,
    newPassword, setNewPassword,
  };

  if (view === "loading") return (
    <>
      <style>{CSS}</style>
      <div className="loading-screen">
        <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 22, color: "#F97316" }}>
          LUMAJIRA<span style={{ color: "#52525B", fontWeight: 400 }}>HUB</span>
        </div>
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "ok" ? "✓" : "✗"} {toast.msg}
        </div>
      )}
      {showApiModal && <ApiKeyModal onClose={() => setShowApiModal(false)} showToast={showToast} />}
      {newPassword  && <PasswordModal password={newPassword} onClose={() => setNewPassword(null)} />}
      {isInstallable && view !== "landing" && (
        <InstallBanner onInstall={install} onDismiss={dismiss} />
      )}
      <div className="root">
        {view === "landing"     && <Landing      ctx={ctx} />}
        {view === "auth"        && <Auth         ctx={ctx} />}
        {view === "userHome"    && <UserHome      ctx={ctx} />}
        {view === "serviceChat" && <ServiceChat   ctx={ctx} />}
        {view === "myOrders"    && <MyOrders      ctx={ctx} />}
        {view === "tallerHome"  && <TallerHome    ctx={ctx} />}
        {view === "orderDetail" && <OrderDetail   ctx={ctx} />}
        {view === "chat"        && <Chat          ctx={ctx} />}
        {view === "admin"       && <Admin         ctx={ctx} />}
      </div>
    </>
  );
}