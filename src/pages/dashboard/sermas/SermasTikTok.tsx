import { SiTiktok } from 'react-icons/si';
import SermasChannelPage, { type SermasChannelConfig } from './SermasChannelPage';

export const CFG_SERMAS_TIKTOK: SermasChannelConfig = {
  canal: 'tiktok',
  titulo: 'TikTok — SERMAS',
  short: 'TikTok',
  Icon: SiTiktok,
  brandColor: '#FF0050',
};

export default function SermasTikTok() {
  return <SermasChannelPage cfg={CFG_SERMAS_TIKTOK} />;
}