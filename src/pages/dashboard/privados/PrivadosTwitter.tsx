import { FaXTwitter } from 'react-icons/fa6';
import PrivadosChannelPage, { type PrivadosChannelConfig } from './PrivadosChannelPage';

const CFG: PrivadosChannelConfig = {
  key: 'twitter',
  label: 'X (Twitter)',
  short: 'X',
  Icon: FaXTwitter,
  brandColor: '#FFFFFF',
  view: 'x_twitter_posts_general_filtrado',
  dateField: 'date_posted',
  preclassified: false,
  termField: 'header',
};

export default function PrivadosTwitter() {
  return <PrivadosChannelPage cfg={CFG} />;
}