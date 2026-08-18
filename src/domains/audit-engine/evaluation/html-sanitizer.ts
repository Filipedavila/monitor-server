import * as cheerio from 'cheerio';

export function cleanHtml(html: string): string {
    if (!html) return '';
    const $ = cheerio.load(html);
    $('head script, head style').remove();
    return $.html();
}