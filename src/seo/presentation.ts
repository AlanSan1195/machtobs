import type { SeoFaq, SeoPageDefinition, SeoSection } from './content';

const MAX_GUIDE_SECTIONS = 3;
const MAX_SECTION_ITEMS = 3;
const MAX_FAQS = 2;

export function getVisibleSections(page: SeoPageDefinition): SeoSection[] {
  const sections = page.kind === 'hub'
    ? page.sections
    : page.sections.slice(0, MAX_GUIDE_SECTIONS);

  return sections.map((section) => ({
    ...section,
    paragraphs: section.paragraphs.slice(0, 1),
    bullets: section.bullets?.slice(0, MAX_SECTION_ITEMS),
    steps: section.steps?.slice(0, MAX_SECTION_ITEMS),
  }));
}

export function getVisibleFaqs(page: SeoPageDefinition): SeoFaq[] {
  return page.faqs.slice(0, page.kind === 'home' ? 3 : MAX_FAQS);
}

export function getFirstSentence(text: string): string {
  const sentenceBreak = text.indexOf('. ');
  return sentenceBreak >= 0 ? text.slice(0, sentenceBreak + 1) : text;
}
