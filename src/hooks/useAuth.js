import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";

/**
 * Hook personalizado para manejar autenticación y roles.
 */
export function useAuth() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session?.user?.token) {
      const tokenExp = JSON.parse(atob(session.user.token.split(".")[1])).exp * 1000;
      const currentTime = Date.now();

      if (currentTime >= tokenExp) {
        console.log("🔄 Token expirado. Cerrando sesión.");
        signOut(); // 🔹 Cierra sesión automáticamente
      }
    }
    // if (!session?.user?.token) return;

    // const tokenData = session.user.token;
    // let expiresAtMs = null;

    // // Si token es string (JWT), extraer exp del payload
    // if (typeof tokenData === "string") {
    //   try {
    //     const payload = JSON.parse(atob(tokenData.split(".")[1]));
    //     if (payload?.exp) expiresAtMs = payload.exp * 1000;
    //   } catch (err) {
    //     console.warn("useAuth: token string inválido", err);
    //   }
    // } else if (typeof tokenData === "object") {
    //   // Si token es objeto (lo que devuelve NextAuth en tu callback), usar expiresAt o exp
    //   if (tokenData.expiresAt) expiresAtMs = Number(tokenData.expiresAt);
    //   else if (tokenData.exp) expiresAtMs = Number(tokenData.exp) * 1000;
    // }

    // if (expiresAtMs && Date.now() >= expiresAtMs) {
    //   console.log("🔄 Token expirado. Cerrando sesión.");
    //   signOut();
    // }
  }, [session]);

  return {
    isAuthenticated: status === "authenticated",
    userRole: session?.user?.role || "guest",
    loading: status === "loading",
  };
}
