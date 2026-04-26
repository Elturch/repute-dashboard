import { BiNews } from 'react-icons/bi';
import PrivadosChannelPage, { type PrivadosChannelConfig } from './PrivadosChannelPage';

export const CFG_MEDIOS: PrivadosChannelConfig = {
  key: 'medios',
  label: 'medios',
  short: 'Medios',
  Icon: BiNews,
  brandColor: '#1F2937',
  view: 'noticias_gh_privados',
  dateField: 'Date',
  preclassified: false,
  termField: 'Tema',
  titularityField: 'titularidad',
};

export default function PrivadosNoticias() {
  return <PrivadosChannelPage cfg={CFG_MEDIOS} />;
}
