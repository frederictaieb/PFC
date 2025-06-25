export const registerPlayer = async (
  username: string
): Promise<{ success: boolean; user?: any; error?: string }> => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/user/register_user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();

    if (res.ok) {
      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.detail || "Erreur inconnue" };
    }
  } catch (err) {
    console.error("Erreur de registrement :", err);
    return { success: false, error: "Erreur réseau ou serveur" };
  }
};