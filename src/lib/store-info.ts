// The store's public contact details, used in the header, footer, help and order pages.
// Change them here in one place. (Help & Support also reads the phone/email saved in Admin → Settings.)

export const STORE = {
  name: 'Delight Shopping Mart',
  // Real store number (Ghorahi). Each store's own number comes from Admin → Settings → Store Details.
  phone: '+977 82-563923',
  // No WhatsApp number yet: WhatsApp buttons are hidden until one is added (Admin → Settings).
  whatsapp: '',
  email: 'info@delightshoppingmart.com.np',
  address: 'Ward No. 6, Tulsipur, Dang, Lumbini Province, Nepal',
  hours: 'Open daily, 7 AM – 9 PM',
  // Pin from the store's Google Maps listing ("Delight the shopping mart").
  mapsUrl: 'https://maps.app.goo.gl/22sJUGhs3PJ9ZUtr8',
  lat: 28.1288489,
  lng: 82.2961992,
  // Add the store's real page links here; icons with no link are hidden.
  socials: {
    facebook: '',
    instagram: '',
    youtube: '',
    tiktok: '',
    linkedin: '',
  },
} as const;

export const telLink = `tel:+${STORE.phone.replace(/\D/g, '')}`;
/** WhatsApp chat link, or '' when no WhatsApp number is set (callers hide the button then). */
export const whatsappLink = (text = '', number: string = STORE.whatsapp) => {
  const digits = number.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}` : '';
};
