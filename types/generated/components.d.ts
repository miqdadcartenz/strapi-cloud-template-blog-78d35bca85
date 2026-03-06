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
    logo: Schema.Attribute.Media<'images'>;
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
    linkArtikel: Schema.Attribute.String;
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
    linkProduk: Schema.Attribute.String;
    title: Schema.Attribute.String;
    viewMoreLabel: Schema.Attribute.String;
  };
}

export interface HomeSectionSertifikat extends Struct.ComponentSchema {
  collectionName: 'components_home_section_sertifikats';
  info: {
    displayName: 'Section Sertifikat';
  };
  attributes: {
    description1: Schema.Attribute.Text;
    description2: Schema.Attribute.Text;
    logo1: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    logo2: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    logo3: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
  };
}

export interface HomeSectionTestimoni extends Struct.ComponentSchema {
  collectionName: 'components_home_section_testimonis';
  info: {
    displayName: 'Section Testimoni';
  };
  attributes: {
    foto: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    name: Schema.Attribute.String;
    posisi: Schema.Attribute.String;
    text: Schema.Attribute.Text;
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

export interface MenuChild extends Struct.ComponentSchema {
  collectionName: 'components_menu_children';
  info: {
    description: 'Sub-menu (level 2) untuk Mega Menu';
    displayName: 'Mega Menu Child';
    icon: 'layer-group';
  };
  attributes: {
    childId: Schema.Attribute.String & Schema.Attribute.Required;
    contentSubtitle: Schema.Attribute.String;
    contentTitle: Schema.Attribute.String;
    details: Schema.Attribute.Component<'menu.detail', true>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface MenuDetail extends Struct.ComponentSchema {
  collectionName: 'components_menu_details';
  info: {
    description: 'Detail (judul + daftar item, satu item per baris)';
    displayName: 'Mega Menu Detail';
    icon: 'list';
  };
  attributes: {
    itemsText: Schema.Attribute.JSON;
    title: Schema.Attribute.String;
  };
}

export interface MenuMegaMenuItem extends Struct.ComponentSchema {
  collectionName: 'components_menu_mega_menu_items';
  info: {
    description: 'Item level 1 di Mega Menu';
    displayName: 'Mega Menu Item';
    icon: 'th-large';
  };
  attributes: {
    children: Schema.Attribute.Component<'menu.child', true>;
    itemId: Schema.Attribute.String & Schema.Attribute.Required;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    menuType: Schema.Attribute.Enumeration<['nested', 'flat', 'single']> &
      Schema.Attribute.DefaultTo<'nested'>;
  };
}

export interface PalapaKlienPalapaKlienCard extends Struct.ComponentSchema {
  collectionName: 'components_palapa_klien_palapa_klien_cards';
  info: {
    displayName: 'Palapa Klien Card';
  };
  attributes: {
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    logo: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    nama_daerah: Schema.Attribute.String;
    produk_url: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface PalapaKlienPalapaKlienSection extends Struct.ComponentSchema {
  collectionName: 'components_palapa_klien_palapa_klien_sections';
  info: {
    displayName: 'Palapa Klien Section';
  };
  attributes: {
    badge: Schema.Attribute.String;
    cards: Schema.Attribute.Component<'palapa-klien.palapa-klien-card', true>;
    rating: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface ProductPageBlockHeading extends Struct.ComponentSchema {
  collectionName: 'components_product_page_block_headings';
  info: {
    description: 'Heading (h1\u2013h4) dalam blok konten tab';
    displayName: 'Block Heading';
    icon: 'heading';
  };
  attributes: {
    level: Schema.Attribute.Enumeration<['1', '2', '3', '4']> &
      Schema.Attribute.DefaultTo<'4'>;
    text: Schema.Attribute.String;
  };
}

export interface ProductPageBlockList extends Struct.ComponentSchema {
  collectionName: 'components_product_page_block_lists';
  info: {
    description: 'Daftar item dalam blok konten tab';
    displayName: 'Block List';
    icon: 'list';
  };
  attributes: {
    items: Schema.Attribute.JSON;
    title: Schema.Attribute.String;
  };
}

export interface ProductPageBlockParagraph extends Struct.ComponentSchema {
  collectionName: 'components_product_page_block_paragraphs';
  info: {
    description: 'Satu paragraf teks dalam blok konten tab';
    displayName: 'Block Paragraph';
    icon: 'file-alt';
  };
  attributes: {
    text: Schema.Attribute.Text;
  };
}

export interface ProductPageCategory extends Struct.ComponentSchema {
  collectionName: 'components_product_page_categories';
  info: {
    description: 'Kategori produk (accordion sidebar): label, megaMenuChildId, subMenus';
    displayName: 'Category';
    icon: 'layer-group';
  };
  attributes: {
    categoryId: Schema.Attribute.String;
    label: Schema.Attribute.String;
    megaMenuChildId: Schema.Attribute.String;
    sidebarAsFlat: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    subMenus: Schema.Attribute.Component<'product-page.sub-menu', true>;
  };
}

export interface ProductPageHero extends Struct.ComponentSchema {
  collectionName: 'components_product_page_heroes';
  info: {
    description: 'Hero section halaman produk: judul, paragraf, demo URL, logo, gambar';
    displayName: 'Hero';
    icon: 'star';
  };
  attributes: {
    demoUrl: Schema.Attribute.String;
    heroImage: Schema.Attribute.Media<'images'>;
    logo: Schema.Attribute.Media<'images'>;
    paragraphs: Schema.Attribute.Component<'product-page.paragraph', true>;
    title: Schema.Attribute.String;
  };
}

export interface ProductPageParagraph extends Struct.ComponentSchema {
  collectionName: 'components_product_page_paragraphs';
  info: {
    description: 'Satu paragraf teks untuk hero product page';
    displayName: 'Paragraph';
    icon: 'file-alt';
  };
  attributes: {
    text: Schema.Attribute.Text;
  };
}

export interface ProductPageSubMenu extends Struct.ComponentSchema {
  collectionName: 'components_product_page_sub_menus';
  info: {
    description: 'Sub menu (sidebar item) dengan daftar tab';
    displayName: 'Sub Menu';
    icon: 'list-ul';
  };
  attributes: {
    subSlug: Schema.Attribute.String;
    tabs: Schema.Attribute.Component<'product-page.tab', true>;
    title: Schema.Attribute.String;
  };
}

export interface ProductPageTab extends Struct.ComponentSchema {
  collectionName: 'components_product_page_tabs';
  info: {
    description: 'Satu tab dalam sub-menu (label + konten)';
    displayName: 'Tab';
    icon: 'folder';
  };
  attributes: {
    content: Schema.Attribute.Component<'product-page.tab-content', false>;
    tabLabel: Schema.Attribute.String;
  };
}

export interface ProductPageTabContent extends Struct.ComponentSchema {
  collectionName: 'components_product_page_tab_contents';
  info: {
    description: 'Konten satu tab: deskripsi, gambar, detail, blocks';
    displayName: 'Tab Content';
    icon: 'file-alt';
  };
  attributes: {
    blocks: Schema.Attribute.DynamicZone<
      [
        'product-page.block-paragraph',
        'product-page.block-heading',
        'product-page.block-list',
      ]
    >;
    description: Schema.Attribute.Text;
    details: Schema.Attribute.JSON;
    image: Schema.Attribute.Media<'images'>;
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

export interface StrategicConsultingStrategicProject
  extends Struct.ComponentSchema {
  collectionName: 'components_strategic_consulting_strategic_projects';
  info: {
    displayName: 'Strategic Project';
  };
  attributes: {
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    logo: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    name: Schema.Attribute.String;
    product_url: Schema.Attribute.String;
  };
}

export interface TentangKamiNilaiIntiItem extends Struct.ComponentSchema {
  collectionName: 'components_tentang_kami_nilai_inti_items';
  info: {
    displayName: 'Nilai Inti Item';
  };
  attributes: {
    description: Schema.Attribute.Text;
    icon: Schema.Attribute.String;
    letter: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface TentangKamiTeamMember extends Struct.ComponentSchema {
  collectionName: 'components_tentang_kami_team_members';
  info: {
    displayName: 'Team Member';
  };
  attributes: {
    jabatan: Schema.Attribute.String;
    name: Schema.Attribute.String;
    photo: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
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
      'home.section-sertifikat': HomeSectionSertifikat;
      'home.section-testimoni': HomeSectionTestimoni;
      'home.stat-item': HomeStatItem;
      'menu.child': MenuChild;
      'menu.detail': MenuDetail;
      'menu.mega-menu-item': MenuMegaMenuItem;
      'palapa-klien.palapa-klien-card': PalapaKlienPalapaKlienCard;
      'palapa-klien.palapa-klien-section': PalapaKlienPalapaKlienSection;
      'product-page.block-heading': ProductPageBlockHeading;
      'product-page.block-list': ProductPageBlockList;
      'product-page.block-paragraph': ProductPageBlockParagraph;
      'product-page.category': ProductPageCategory;
      'product-page.hero': ProductPageHero;
      'product-page.paragraph': ProductPageParagraph;
      'product-page.sub-menu': ProductPageSubMenu;
      'product-page.tab': ProductPageTab;
      'product-page.tab-content': ProductPageTabContent;
      'shared.media': SharedMedia;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
      'strategic-consulting.strategic-project': StrategicConsultingStrategicProject;
      'tentang-kami.nilai-inti-item': TentangKamiNilaiIntiItem;
      'tentang-kami.team-member': TentangKamiTeamMember;
    }
  }
}
