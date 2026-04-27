import { SiTiktok } from 'react-icons/si';
import CatsalutChannelPage, { type CatsalutChannelConfig } from './CatsalutChannelPage';

export const CFG_CATSALUT_TIKTOK: CatsalutChannelConfig = {
  canal: 'tiktok',
  titulo: 'TikTok — CATSALUT',
  short: 'TikTok',
  Icon: SiTiktok,
  brandColor: '#FF0050',
};

export default function CatsalutTikTok() {
  return <CatsalutChannelPage cfg={CFG_CATSALUT_TIKTOK} />;
}
