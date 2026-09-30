// The store's public contact details, used in the header, footer, help and order pages.
// Change them here in one place. (Help & Support also reads the phone/email saved in Admin → Settings.)

export const STORE = {
  name: 'Delight Shopping Mart',
  phone: '+977 9841234567',
  whatsapp: '9779841234567',
  email: 'info@delightmart.com.np',
  address: 'Ward No. 6, Tulsipur, Dang, Lumbini Province, Nepal',
  hours: 'Open daily, 7 AM – 9 PM',
  mapQuery: 'Tulsipur, Dang, Nepal',
  socials: {
    facebook: 'https://www.facebook.com/',
    instagram: 'https://www.instagram.com/',
    youtube: 'https://www.youtube.com/',
    tiktok: 'https://www.tiktok.com/',
    linkedin: 'https://www.linkedin.com/',
  },
} as const;

export const telLink = `tel:+${STORE.phone.replace(/\D/g, '')}`;
export const whatsappLink = (text = '') => `https://wa.me/${STORE.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
