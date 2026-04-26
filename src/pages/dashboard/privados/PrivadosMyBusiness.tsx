import { SiGoogle } from 'react-icons/si';
import PrivadosChannelPage, { type PrivadosChannelConfig } from './PrivadosChannelPage';

const CFG: PrivadosChannelConfig = {
  key: 'mybusiness',
  label: 'Google My Business',
  short: 'My Business',
  Icon: SiGoogle,
  brandColor: '#4285F4',
  view: 'my_business_reviews',
  dateField: 'iso_date',
  preclassified: true,
  groupField: 'grupo_hospitalario',
  titularityField: 'titularidad',
};

export default function PrivadosMyBusiness() {
  return <PrivadosChannelPage cfg={CFG} />;
}