import { SiFacebook } from 'react-icons/si';
import PrivadosChannelPage, { type PrivadosChannelConfig } from './PrivadosChannelPage';

const CFG: PrivadosChannelConfig = {
  key: 'facebook',
  label: 'Facebook',
  short: 'Facebook',
  Icon: SiFacebook,
  brandColor: '#1877F2',
  view: 'fb_posts_general_filtradas',
  dateField: 'date_posted',
  preclassified: false,
  termField: 'termino',
};

export default function PrivadosFacebook() {
  return <PrivadosChannelPage cfg={CFG} />;
}