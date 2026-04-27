import { BiNews } from 'react-icons/bi';
import SermasChannelPage, { type SermasChannelConfig } from './SermasChannelPage';

export const CFG_SERMAS_MEDIOS: SermasChannelConfig = {
  canal: 'noticias',
  titulo: 'Medios — SERMAS',
  short: 'Medios',
  Icon: BiNews,
  brandColor: '#9CA3AF',
};

export default function SermasMedios() {
  return <SermasChannelPage cfg={CFG_SERMAS_MEDIOS} />;
}