import { SiInstagram } from 'react-icons/si';
import PrivadosChannelPage, { type PrivadosChannelConfig } from './PrivadosChannelPage';

export const CFG_INSTAGRAM: PrivadosChannelConfig = {
  key: 'instagram',
  label: 'Instagram',
  short: 'Instagram',
  Icon: SiInstagram,
  brandColor: '#E4405F',
  view: 'ig_posts_gh_agrupados',
  dateField: 'date_posted',
  preclassified: false,
  termField: 'termino',
};

export default function PrivadosInstagram() {
  return <PrivadosChannelPage cfg={CFG_INSTAGRAM} />;
}