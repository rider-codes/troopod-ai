const PRIVATE_IPV4 = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./
];

function isPrivateHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }

  if (PRIVATE_IPV4.some((pattern) => pattern.test(host))) {
    return true;
  }

  // IPv6 loopback, unspecified, unique-local, link-local and IPv4-mapped addresses.
  if (host.includes(":")) {
    return (
      host === "::1" ||
      host === "::" ||
      host.startsWith("fc") ||
      host.startsWith("fd") ||
      host.startsWith("fe80") ||
      host.startsWith("::ffff:")
    );
  }

  return false;
}

/** Returns an error message if the value is not a public http(s) URL, otherwise null. */
export function getUrlError(value: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    return "Enter a valid URL, e.g. https://yoursite.com/landing-page";
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "Only http:// and https:// URLs are supported.";
  }

  if (isPrivateHost(parsed.hostname)) {
    return "Enter a publicly reachable URL (local and private addresses are not allowed).";
  }

  return null;
}
