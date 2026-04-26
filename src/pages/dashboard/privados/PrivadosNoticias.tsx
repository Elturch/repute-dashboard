import { BiNews } from 'react-icons/bi';
import PrivadosChannelPage, { type PrivadosChannelConfig } from './PrivadosChannelPage';

const CFG: PrivadosChannelConfig = {
  key: 'medios',
  label: 'medios',
  short: 'Medios',
  Icon: BiNews,
  brandColor: '#1F2937',
  view: 'noticias_general_filtradas',
  dateField: 'Date',
  preclassified: false,
  termField: 'Tema',
  titularityField: 'titularidad',
};

export default function PrivadosNoticias() {
  return <PrivadosChannelPage cfg={CFG} />;
}
