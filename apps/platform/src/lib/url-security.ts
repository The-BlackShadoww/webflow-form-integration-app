import dns from "dns";
import { isIP } from "net";

function isPrivateIP(ip: string): boolean {
    // Handle IPv4-mapped IPv6 addresses
    if (ip.toLowerCase().startsWith('::ffff:')) {
        return isPrivateIP(ip.substring(7));
    }

    const parts = ip.split('.').map(Number);
    if (parts.length === 4) { // IPv4
        if (parts[0] === 10) return true;
        if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
        if (parts[0] === 192 && parts[1] === 168) return true;
        if (parts[0] === 127) return true;
        if (parts[0] === 169 && parts[1] === 254) return true;
        if (parts[0] === 0) return true;
        return false;
    }

    // IPv6 (basic check)
    if (ip === "::1") return true;
    if (ip.toLowerCase().startsWith("fc") || ip.toLowerCase().startsWith("fd")) return true;
    const lowerIp = ip.toLowerCase();
    if (lowerIp.startsWith("fe8") || lowerIp.startsWith("fe9") || lowerIp.startsWith("fea") || lowerIp.startsWith("feb")) return true;

    return false;
}

export async function validateUrlSecurity(urlString: string): Promise<string> {
    let parsedUrl: URL;
    try {
        parsedUrl = new URL(urlString);
    } catch {
        throw new Error("Invalid URL format");
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        throw new Error("Invalid URL protocol. Only http and https are allowed.");
    }

    let hostname = parsedUrl.hostname;
    // Remove brackets for IPv6
    hostname = hostname.replace(/^\[|\]$/g, "");

    let ip = hostname;


    if (!isIP(hostname)) {
        try {
            const result = await dns.promises.lookup(hostname);
            ip = result.address;
        } catch (e) {
            throw new Error("Could not resolve hostname");
        }
    }

    if (isPrivateIP(ip)) {
        throw new Error("URL resolves to a private or restricted IP address");
    }

    return ip;
}
