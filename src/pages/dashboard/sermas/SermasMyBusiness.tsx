import { SiGoogle } from 'react-icons/si';
import SermasChannelPage, { type SermasChannelConfig } from './SermasChannelPage';

export const CFG_SERMAS_MYBUSINESS: SermasChannelConfig = {
  canal: 'mybusiness',
  titulo: 'Reseñas Google — SERMAS',
  short: 'My Business',
  Icon: SiGoogle,
  brandColor: '#4285F4',
};

export default function SermasMyBusiness() {
  return <SermasChannelPage cfg={CFG_SERMAS_MYBUSINESS} />;
}