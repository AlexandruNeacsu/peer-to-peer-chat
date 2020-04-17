class Encryption {
  static async deriveKeyFromPassword(password) {
    const encoder = new TextEncoder("utf-8");

    const passwordKey = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"],
    );

    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: window.crypto.getRandomValues(new Uint8Array(16)),
        iterations: 100000,
        hash: "SHA-256",
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  }

  /**
   * TODO
   * @returns {Promise<Uint8Array>}
   */
  static async generateRandomKeyBuffer() {
    const randomKey = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"],
    );

    const exportedRandomKey = await window.crypto.subtle.exportKey(
      "raw",
      randomKey,
    );

    return new Uint8Array(exportedRandomKey);
  }

  static async encryptKey(key, password) {
    const keyBuffer = new Uint8Array(key);

    // generate key from password  to use in encryption
    const masterKey = await Encryption.deriveKeyFromPassword(password);

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedKey = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      masterKey,
      keyBuffer,
    );

    const encryptionToken = new Uint8Array(encryptedKey).toString();

    return {
      encryptionToken,
      iv: iv.toString(),
    };
  }

  static async decryptKey(encryptedSymmetricKey, iv, password) {
    const masterKey = await Encryption.deriveKeyFromPassword(password);

    const decryptedSymmetricKey = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      masterKey,
      Buffer.from(encryptedSymmetricKey),
    );

    return new Uint8Array(decryptedSymmetricKey);
  }
}

export default Encryption;
