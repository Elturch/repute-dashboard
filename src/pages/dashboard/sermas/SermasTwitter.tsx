import { FaXTwitter } from 'react-icons/fa6';
import SermasChannelPage, { type SermasChannelConfig } from './SermasChannelPage';

export const CFG_SERMAS_TWITTER: SermasChannelConfig = {
  canal: 'x_twitter',
  titulo: 'X (Twitter) — SERMAS',
  short: 'X',
  Icon: FaXTwitter,
  brandColor: '#FFFFFF',
};

export default function SermasTwitter() {
  return <SermasChannelPage cfg={CFG_SERMAS_TWITTER} />;
}