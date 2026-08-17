"use server";

export async function fetchUrlText(url: string) {
  try {
    const res = await fetch(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      } 
    });
    if (!res.ok) throw new Error("Failed to fetch URL");
    const html = await res.text();
    
    // Extract og:image
    const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i) || html.match(/<meta content="([^"]+)" property="og:image"/i);
    const image = ogImageMatch ? ogImageMatch[1] : null;

    // Strip scripts and styles
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    // Strip HTML tags
    text = text.replace(/<[^>]+>/g, ' ');
    // Remove extra whitespace
    text = text.replace(/\s+/g, ' ').trim();
    // Return first 40000 characters to stay within safe token limits
    return { text: text.slice(0, 40000), image }; 
  } catch (err) {
    console.error("fetchUrlText error:", err);
    throw new Error("Could not fetch the URL. It might be protected.");
  }
}
