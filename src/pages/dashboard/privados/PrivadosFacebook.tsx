import { SiFacebook } from 'react-icons/si';
import PrivadosChannelPage, { type PrivadosChannelConfig } from './PrivadosChannelPage';

export const CFG_FACEBOOK: PrivadosChannelConfig = {
  key: 'facebook',
  label: 'Facebook',
  short: 'Facebook',
  Icon: SiFacebook,
  brandColor: '#1877F2',
  view: 'fb_posts_gh_agrupados',
  dateField: 'date_posted',
  preclassified: false,
  termField: 'termino',
};

export default function PrivadosFacebook() {
  return <PrivadosChannelPage cfg={CFG_FACEBOOK} />;
}