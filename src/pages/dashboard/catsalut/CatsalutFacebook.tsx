import { SiFacebook } from 'react-icons/si';
import CatsalutChannelPage, { type CatsalutChannelConfig } from './CatsalutChannelPage';

export const CFG_CATSALUT_FACEBOOK: CatsalutChannelConfig = {
  canal: 'facebook',
  titulo: 'Facebook — CATSALUT',
  short: 'Facebook',
  Icon: SiFacebook,
  brandColor: '#1877F2',
};

export default function CatsalutFacebook() {
  return <CatsalutChannelPage cfg={CFG_CATSALUT_FACEBOOK} />;
}
