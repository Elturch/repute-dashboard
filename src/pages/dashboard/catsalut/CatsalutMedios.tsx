import { BiNews } from 'react-icons/bi';
import CatsalutChannelPage, { type CatsalutChannelConfig } from './CatsalutChannelPage';

export const CFG_CATSALUT_MEDIOS: CatsalutChannelConfig = {
  canal: 'noticias',
  titulo: 'Medios — CATSALUT',
  short: 'Medios',
  Icon: BiNews,
  brandColor: '#9CA3AF',
};

export default function CatsalutMedios() {
  return <CatsalutChannelPage cfg={CFG_CATSALUT_MEDIOS} />;
}
