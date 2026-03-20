const SECRET_SALT = "9f#K2l@8!xPq$Zr7&LmN";

export const encryptData = (data: any): string => {
  try {
    const jsonString = JSON.stringify(data);
    const salted = SECRET_SALT + ":" + jsonString;
    return btoa(unescape(encodeURIComponent(salted)));
  } catch (error) {
    console.error("Encryption failed:", error);
    return "";
  }
};

export const decryptData = <T>(encryptedData: string | null): T | null => {
  if (!encryptedData) return null;
  try {
    const decoded = decodeURIComponent(escape(atob(encryptedData)));
    if (decoded.startsWith(SECRET_SALT + ":")) {
      const jsonString = decoded.replace(SECRET_SALT + ":", "");
      return JSON.parse(jsonString) as T;
    }
    return null;
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};
