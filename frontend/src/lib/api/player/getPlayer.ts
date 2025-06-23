export const getPlayer = async (username: string) => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/user/get_user?username=${encodeURIComponent(username)}`
    );

    if (res.ok) {
      const data = await res.json();
      return { success: true, data };
    } else {
      const data = await res.json();
      return { success: false, error: data.detail || "Erreur inconnue" };
    }
  } catch (err) {
    console.error("Erreur de récupération :", err);
    return { success: false, error: "Erreur réseau ou serveur" };
  }
};
