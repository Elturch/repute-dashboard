import { SiInstagram } from 'react-icons/si';
import SermasChannelPage, { type SermasChannelConfig } from './SermasChannelPage';

export const CFG_SERMAS_INSTAGRAM: SermasChannelConfig = {
  canal: 'instagram',
  titulo: 'Instagram — SERMAS',
  short: 'Instagram',
  Icon: SiInstagram,
  brandColor: '#E4405F',
};

export default function SermasInstagram() {
  return <SermasChannelPage cfg={CFG_SERMAS_INSTAGRAM} />;
}