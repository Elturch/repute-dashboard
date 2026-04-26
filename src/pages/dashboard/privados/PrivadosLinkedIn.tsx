import { FaLinkedin } from 'react-icons/fa6';
import PrivadosChannelPage, { type PrivadosChannelConfig } from './PrivadosChannelPage';

const CFG: PrivadosChannelConfig = {
  key: 'linkedin',
  label: 'LinkedIn',
  short: 'LinkedIn',
  Icon: FaLinkedin,
  brandColor: '#0A66C2',
  view: 'linkedin_gh_filtradas',
  dateField: 'posted_date',
  preclassified: false,
  termField: 'termino',
};

export default function PrivadosLinkedIn() {
  return <PrivadosChannelPage cfg={CFG} />;
}