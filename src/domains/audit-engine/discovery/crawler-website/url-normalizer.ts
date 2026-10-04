export class UrlNormalizer {
  private static readonly IGNORED_EXTENSIONS = new Set([
    'css',
    'jpg',
    'jpeg',
    'gif',
    'svg',
    'pdf',
    'docx',
    'js',
    'png',
    'ico',
    'xml',
    'mp4',
    'mp3',
    'mkv',
    'wav',
    'rss',
    'json',
    'pptx',
    'txt',
    'zip',
  ]);

  public static filterAndNormalize(rawHrefs: string[], baseUrl: string): string[] {
    const collectedUrls = new Set<string>();

    for (const rawHref of rawHrefs) {
      if (!rawHref) continue;

      const trimmed = rawHref.trim();

      if (/^(mailto:|tel:|javascript:|#)/i.test(trimmed)) {
        continue;
      }

      try {
        const resolved = new URL(trimmed, baseUrl);

        const baseParsed = new URL(baseUrl);
        if (resolved.origin !== baseParsed.origin) {
          continue;
        }

        if (this.hasIgnoredExtension(resolved.pathname)) {
          continue;
        }

        resolved.hash = '';

        collectedUrls.add(resolved.href);
      } catch {
        continue;
      }
    }

    return Array.from(collectedUrls);
  }

  private static hasIgnoredExtension(pathname: string): boolean {
    const lowerPath = pathname.toLowerCase();
    for (const ext of this.IGNORED_EXTENSIONS) {
      if (lowerPath.endsWith(`.${ext}`)) {
        return true;
      }
    }
    return false;
  }
}
