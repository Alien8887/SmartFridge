/** Modern Clipboard API first; falls back to the legacy execCommand method
 *  (via a hidden, off-screen textarea) when navigator.clipboard is
 *  unavailable — e.g. accessing the dev server over a LAN IP on plain HTTP
 *  rather than localhost/HTTPS, which is not a "secure context." */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    throw new Error('Clipboard API unavailable in this context');
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  }
}