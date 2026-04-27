import { SiInstagram } from 'react-icons/si';
import CatsalutChannelPage, { type CatsalutChannelConfig } from './CatsalutChannelPage';

export const CFG_CATSALUT_INSTAGRAM: CatsalutChannelConfig = {
  canal: 'instagram',
  titulo: 'Instagram — CATSALUT',
  short: 'Instagram',
  Icon: SiInstagram,
  brandColor: '#E4405F',
};

export default function CatsalutInstagram() {
  return <CatsalutChannelPage cfg={CFG_CATSALUT_INSTAGRAM} />;
}
