import type { Schema, Struct } from '@strapi/strapi';

export interface HomeAboutSection extends Struct.ComponentSchema {
  collectionName: 'components_home_about_sections';
  info: {
    description: '';
    displayName: 'About Section';
    icon: 'user';
  };
  attributes: {
    badge: Schema.Attribute.String;
    ctaLabel: Schema.Attribute.String;
    employeeCount: Schema.Attribute.String;
    paragraph: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface HomeHeroSlide extends Struct.ComponentSchema {
  collectionName: 'components_home_hero_slides';
  info: {
    description: '';
    displayName: 'Hero Slide';
    icon: 'picture';
  };
  attributes: {
    solutions: Schema.Attribute.JSON;
    title: Schema.Attribute.String;
  };
}

export interface HomeSectionArtikel extends Struct.ComponentSchema {
  collectionName: 'components_home_section_artikels';
  info: {
    description: '';
    displayName: 'Section Artikel';
    icon: 'file-alt';
  };
  attributes: {
    badge: Schema.Attribute.String;
    title: Schema.Attribute.String;
    viewMoreLabel: Schema.Attribute.String;
  };
}

export interface HomeSectionGaleri extends Struct.ComponentSchema {
  collectionName: 'components_home_section_galeris';
  info: {
    description: '';
    displayName: 'Section Galeri';
    icon: 'images';
  };
  attributes: {
    badge: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface HomeSectionKlien extends Struct.ComponentSchema {
  collectionName: 'components_home_section_kliens';
  info: {
    description: '';
    displayName: 'Section Klien';
    icon: 'building';
  };
  attributes: {
    badge: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface HomeSectionProduk extends Struct.ComponentSchema {
  collectionName: 'components_home_section_produks';
  info: {
    description: '';
    displayName: 'Section Produk';
    icon: 'grid';
  };
  attributes: {
    badge: Schema.Attribute.String;
    title: Schema.Attribute.String;
    viewMoreLabel: Schema.Attribute.String;
  };
}

export interface HomeStatItem extends Struct.ComponentSchema {
  collectionName: 'components_home_stat_items';
  info: {
    description: '';
    displayName: 'Stat Item';
    icon: 'chart-bar';
  };
  attributes: {
    label: Schema.Attribute.String;
    value: Schema.Attribute.String;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '';
    displayName: 'Slider';
    icon: 'address-book';
  };
  attributes: {
    files: Schema.Attribute.Media<'images', true>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'home.about-section': HomeAboutSection;
      'home.hero-slide': HomeHeroSlide;
      'home.section-artikel': HomeSectionArtikel;
      'home.section-galeri': HomeSectionGaleri;
      'home.section-klien': HomeSectionKlien;
      'home.section-produk': HomeSectionProduk;
      'home.stat-item': HomeStatItem;
      'shared.media': SharedMedia;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
    }
  }
}
