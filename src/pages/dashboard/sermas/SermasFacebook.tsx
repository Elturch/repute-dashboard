import { SiFacebook } from 'react-icons/si';
import SermasChannelPage, { type SermasChannelConfig } from './SermasChannelPage';

export const CFG_SERMAS_FACEBOOK: SermasChannelConfig = {
  canal: 'facebook',
  titulo: 'Facebook — SERMAS',
  short: 'Facebook',
  Icon: SiFacebook,
  brandColor: '#1877F2',
};

export default function SermasFacebook() {
  return <SermasChannelPage cfg={CFG_SERMAS_FACEBOOK} />;
}