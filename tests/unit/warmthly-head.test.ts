// cleanup not needed in this test
import { beforeEach, describe, expect, it } from 'vitest';

describe('WarmthlyHead Component', () => {
  beforeEach(() => {
    // cleanup not needed
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('should create the component', async () => {
    // Dynamically import the component
    await import('@components/warmthly-head.js');

    const element = document.createElement('warmthly-head');
    element.setAttribute('title', 'Test Title');
    element.setAttribute('description', 'Test Description');
    element.setAttribute('app', 'main');

    document.body.appendChild(element);

    await new Promise(resolve => setTimeout(resolve, 100));

    (expect(element) as any).toBeDefined();
    expect(document.head.querySelector('title')?.textContent).toBe('Test Title');
  });

  it('should escape HTML in title', async () => {
    await import('@components/warmthly-head.js');

    const element = document.createElement('warmthly-head');
    element.setAttribute('title', '<script>alert("xss")</script>');
    document.body.appendChild(element);

    await new Promise(resolve => setTimeout(resolve, 100));

    const title = document.head.querySelector('title');
    (expect(title?.textContent) as any).not.toContain('<script>');
  });
});
