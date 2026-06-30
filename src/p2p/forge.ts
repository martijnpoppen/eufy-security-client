import forge from "node-forge";

export type ForgeRSAOptions = {
    encryptionScheme?: "pkcs1" | "pkcs1_oaep";
};

export interface RSAPublicComponents {
  n: Uint8Array;
  e: Uint8Array;
}

export class ForgeRSA {
    private privateKey?: forge.pki.rsa.PrivateKey;
    private publicKey?: forge.pki.rsa.PublicKey;
    private options: ForgeRSAOptions = { encryptionScheme: "pkcs1" };

    constructor(bits?: number) {
        if (bits) {
            const keypair = forge.pki.rsa.generateKeyPair({ bits, e: 0x10001 });
            this.privateKey = keypair.privateKey;
            this.publicKey = keypair.publicKey;
        }
    }

    /**
     * Import a PEM-formatted key (auto-detects PKCS#1 vs PKCS#8).
     */
    importKey(pem: string): void {
        pem = pem.trim();
        if (pem.includes("-----BEGIN RSA PRIVATE KEY-----") || pem.includes("-----BEGIN PRIVATE KEY-----")) {
            this.privateKey = forge.pki.privateKeyFromPem(pem) as forge.pki.rsa.PrivateKey;
            this.publicKey = forge.pki.setRsaPublicKey(this.privateKey.n, this.privateKey.e);
        } else if (pem.includes("-----BEGIN RSA PUBLIC KEY-----") || pem.includes("-----BEGIN PUBLIC KEY-----")) {
            this.publicKey = forge.pki.publicKeyFromPem(pem) as forge.pki.rsa.PublicKey;
        } else {
            throw new Error("Unsupported PEM format");
        }
    }

    /**
     * Export a key in a NodeRSA-like format.
     */
    exportKey(format: string): string {
        switch (format) {
            case "pkcs1-private-pem":
                if (!this.privateKey) throw new Error("No private key loaded");
                return forge.pki.privateKeyToPem(this.privateKey);

            case "pkcs1-public-pem":
                if (!this.publicKey) throw new Error("No public key loaded");
                return forge.pki.publicKeyToPem(this.publicKey);

            case "pkcs8-private-pem":
                if (!this.privateKey) throw new Error("No private key loaded");
                return forge.pki.privateKeyToPem(this.privateKey); // forge doesn't distinguish PKCS#8 output

            case "pkcs8-public-pem":
                if (!this.publicKey) throw new Error("No public key loaded");
                return forge.pki.publicKeyToPem(this.publicKey);

            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Set options (only encryptionScheme supported).
     */
    setOptions(options: ForgeRSAOptions) {
        this.options = { ...this.options, ...options };
    }

    encrypt(data: string | Buffer): string {
        if (!this.publicKey) throw new Error("No public key loaded");
        const input = Buffer.isBuffer(data) ? data.toString("binary") : data;
        const scheme = this.options.encryptionScheme === "pkcs1_oaep" ? "RSA-OAEP" : "RSAES-PKCS1-V1_5";
        const encrypted = this.publicKey.encrypt(input, scheme);
        return forge.util.encode64(encrypted);
    }

    decrypt(encrypted: string | Buffer): Buffer {
        if (!this.privateKey) throw new Error("No private key loaded");

        let encryptedBytes: string;
        if (Buffer.isBuffer(encrypted)) {
            encryptedBytes = encrypted.toString("binary");
        } else if (/^[A-Za-z0-9+/=]+$/.test(encrypted.trim())) {
            encryptedBytes = forge.util.decode64(encrypted);
        } else {
            encryptedBytes = encrypted;
        }

        const scheme =
            this.options.encryptionScheme === "pkcs1_oaep" ? "RSA-OAEP" : "RSAES-PKCS1-V1_5";

        const decrypted = this.privateKey.decrypt(encryptedBytes, scheme);

        // Convert forge binary string → Node Buffer
        return Buffer.from(decrypted, "binary");
    }


     /**
   * Get raw components of the public key
   */
  exportPublicComponents(): RSAPublicComponents {
    if (!this.publicKey) throw new Error("No public key loaded");

    const nBytes = this.publicKey.n.toByteArray(); // forge BigInteger → byte array
    const eBytes = this.publicKey.e.toByteArray();

    return {
      n: Uint8Array.from(nBytes),
      e: Uint8Array.from(eBytes),
    };
  }
}
