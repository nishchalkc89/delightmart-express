// The store's public contact details, used in the header, footer, help and order pages.
// Change them here in one place. (Help & Support also reads the phone/email saved in Admin → Settings.)

export const STORE = {
  name: 'Delight Shopping Mart',
  phone: '+977 9841234567',
  whatsapp: '9779841234567',
  email: 'info@delightshoppingmart.com.np',
  address: 'Ward No. 6, Tulsipur, Dang, Lumbini Province, Nepal',
  hours: 'Open daily, 7 AM – 9 PM',
  // Pin from the store's Google Maps listing ("Delight the shopping mart").
  mapsUrl: 'https://maps.app.goo.gl/22sJUGhs3PJ9ZUtr8',
  lat: 28.1288489,
  lng: 82.2961992,
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
