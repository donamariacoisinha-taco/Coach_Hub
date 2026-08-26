import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (file: string) => readFileSync(resolve(root, file), 'utf8');

describe('SEO technical foundation', () => {
  it('keeps robots.txt as plain text and points to the canonical sitemap', () => {
    const robots = read('public/robots.txt');

    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Sitemap: https://kyron.uno/sitemap.xml');
    expect(robots).not.toMatch(/<html|<head|<body/i);
    expect(robots).toContain('Disallow: /api/');
    expect(robots).toContain('Disallow: /dashboard');
    expect(robots).toContain('Disallow: /workout');
  });

  it('keeps sitemap XML valid and limited to existing public canonical pages', () => {
    const sitemap = read('public/sitemap.xml');

    expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(sitemap).toContain('<loc>https://kyron.uno/</loc>');
    expect(sitemap).toContain('<loc>https://kyron.uno/academia-sem-medo/</loc>');
    expect(sitemap).not.toContain('/dashboard');
    expect(sitemap).not.toContain('/workout');
    expect(sitemap).not.toContain('/api/');
  });

  it('publishes canonical homepage metadata and structured data', () => {
    const html = read('index.html');

    expect(html).toContain('<html lang="pt-BR">');
    expect(html).toContain('<title>KYRON | Aplicativo de treino adaptativo e progressão de carga</title>');
    expect(html).toContain('<link rel="canonical" href="https://kyron.uno/">');
    expect(html).toContain('property="og:url" content="https://kyron.uno/"');
    expect(html).toContain('applicationCategory');
    expect(html).toContain('"@type": "WebApplication"');
  });

  it('does not restore a catch-all SPA fallback that turns unknown URLs into the homepage', () => {
    const config = read('vercel.json');

    expect(config).not.toContain('{ "src": "/.*", "dest": "/" }');
    expect(config).toContain('{ "handle": "filesystem" }');
    expect(config).toContain('"X-Robots-Tag"');
    expect(config).toContain('"/sitemap.xml"');
    expect(config).toContain('"/robots.txt"');
  });
});
