class Encryption {

  /**
   *
   * @returns {PromiseLike<CryptoKey>}
   */
  static async getKeyMaterial(password) {
    const encoder = new TextEncoder();

    return window.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"],
    );
  }

  /**
   *
   * @param password
   * @returns {PromiseLike<CryptoKey>}
   */
  static async deriveKey(keyMaterial, salt) {
    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
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

  /**
   *
   * @param {Uint8Array} keyBuffer
   * @param password
   * @returns {Promise<{encryptedKey: string, iv: string}>}
   */
  static
  async encryptKey(keyBuffer, password) {
    // generate key from password  to use in encryption
    const keyMaterial = await Encryption.getKeyMaterial(password);
    const salt = window.crypto.getRandomValues(new Uint8Array(16));

    const masterKey = await Encryption.deriveKey(keyMaterial, salt);

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedKey = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      masterKey,
      keyBuffer,
    );
    const encryptedKeyArray = new Uint8Array(encryptedKey);

    return {
      salt: JSON.stringify(Array.from(salt)),
      encryptedKey: JSON.stringify(Array.from(encryptedKeyArray)),
      iv: JSON.stringify(Array.from(iv)),
    };
  }

  /**
   *
   * @param {Uint8Array} encryptedSymmetricKey
   * @param iv
   * @param password
   * @returns {Promise<Uint8Array>}
   */
  static
  async decryptKey(encryptedSymmetricKey, iv, password, salt) {
    const keyMaterial = await Encryption.getKeyMaterial(password);
    const masterKey = await Encryption.deriveKey(keyMaterial, salt);

    const decryptedSymmetricKey = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      masterKey,
      encryptedSymmetricKey,
    );

    return new Uint8Array(decryptedSymmetricKey);
  }
}

export default Encryption;
