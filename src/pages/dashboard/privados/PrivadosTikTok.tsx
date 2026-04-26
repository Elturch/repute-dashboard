import { SiTiktok } from 'react-icons/si';
import PrivadosChannelPage, { type PrivadosChannelConfig } from './PrivadosChannelPage';

export const CFG_TIKTOK: PrivadosChannelConfig = {
  key: 'tiktok',
  label: 'TikTok',
  short: 'TikTok',
  Icon: SiTiktok,
  brandColor: '#FFFFFF',
  view: 'tiktok_posts_gh_agrupados',
  dateField: 'created_time',
  preclassified: false,
  termField: 'termino',
};

export default function PrivadosTikTok() {
  return <PrivadosChannelPage cfg={CFG_TIKTOK} />;
}