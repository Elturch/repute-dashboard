import { SiGoogle } from 'react-icons/si';
import CatsalutChannelPage, { type CatsalutChannelConfig } from './CatsalutChannelPage';

export const CFG_CATSALUT_MYBUSINESS: CatsalutChannelConfig = {
  canal: 'mybusiness',
  titulo: 'Reseñas Google — CATSALUT',
  short: 'Reseñas Google',
  Icon: SiGoogle,
  brandColor: '#4285F4',
};

export default function CatsalutMyBusiness() {
  return <CatsalutChannelPage cfg={CFG_CATSALUT_MYBUSINESS} />;
}
