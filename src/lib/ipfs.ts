/**
 * IPFS upload helper — uses Pinata if configured, falls back to data URI.
 */

export interface BountyMetadata {
  title: string;
  description?: string;
  proofType: string;
  location?: { lat: number; lng: number; radius_m?: number };
  webhookUrl?: string;
}

/**
 * Upload JSON metadata to IPFS. Returns an `ipfs://` URI or a `data:` URI fallback.
 */
export async function uploadMetadata(metadata: BountyMetadata): Promise<string> {
  const jwt = process.env.PINATA_JWT;

  if (jwt) {
    try {
      const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: { name: `meatboard-${Date.now()}` },
        }),
      });

      if (!res.ok) {
        throw new Error(`Pinata error: ${res.status} ${await res.text()}`);
      }

      const { IpfsHash } = (await res.json()) as { IpfsHash: string };
      return `ipfs://${IpfsHash}`;
    } catch (err) {
      console.error('IPFS upload failed, using data URI fallback:', err);
    }
  }

  // Fallback: base64 data URI
  const encoded = Buffer.from(JSON.stringify(metadata)).toString('base64');
  return `data:application/json;base64,${encoded}`;
}
