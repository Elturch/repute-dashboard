import { FaXTwitter } from 'react-icons/fa6';
import CatsalutChannelPage, { type CatsalutChannelConfig } from './CatsalutChannelPage';

export const CFG_CATSALUT_TWITTER: CatsalutChannelConfig = {
  canal: 'x_twitter',
  titulo: 'X (Twitter) — CATSALUT',
  short: 'X (Twitter)',
  Icon: FaXTwitter,
  brandColor: '#FFFFFF',
};

export default function CatsalutTwitter() {
  return <CatsalutChannelPage cfg={CFG_CATSALUT_TWITTER} />;
}
